const express = require('express');
const app = express();
const PORT = process.env.PORT || 5151;
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);
const fetch = require('node-fetch');

const InfluxDatabase = require('@influxdata/influxdb-client');
const InfluxDB = InfluxDatabase.InfluxDB;
const INFLUXDB_URL = 'https://gc-acc.antst.net';
const INFLUXDB_ORG = 'grca';
const INFLUXDB_KEY = 'QvDOolmSU478M5YkeD17nVeFb4FA_ngo-P0LNokCe6dS2Y10hxIa1zoQ1ZZ9RipKIds-TO7at1-Wgh7Qi44gAQ==';
const client = new InfluxDB({ url: INFLUXDB_URL, token: INFLUXDB_KEY });
const queryApi = client.getQueryApi(INFLUXDB_ORG);

app.use(express.static('public'));
app.set('view engine', 'ejs');

let users = {}

io.on('connection', (socket) => {
    users[socket.id] = Math.floor(Math.random() * 10000000);
    socket.join(users[socket.id]);

    socket.on('location', async (coordinates) => {
        const stations = await getClosestChargingStation(coordinates);
        const renamedStations = await renameOperatorStations(stations);
        const distancedStations = await getDistanceToStation(renamedStations, coordinates);
        let sortedStations;
        await Promise.all(distancedStations).then(async (stations) => {
            sortedStations = await groupBy(stations, 'operatorName');
        });

        const energySupplierEmission = await getData();
        const sortedEnergySuppliers = await sortEnergySuppliers(energySupplierEmission)
        const nearbyStationsPerSupplier = await connectStationsToSupplier(sortedEnergySuppliers, sortedStations);

        io.to(users[socket.id]).emit('fill-in-data', nearbyStationsPerSupplier);
    });

    socket.on('disconnect', () => {
        delete users[socket.id];
    });
});

app.get('/', async (req, res) => {
    res.render('home')
});

const groupBy = (items, prop) => {
    return items.reduce((out, item) => {
        const value = item[prop];
        if (prop == 'operatorName') {
            out[value] = out[value] || [];
            out[value].push(item);
        } else {
            out[value] = item;
        }

        return out;
    }, {});
}

const getClosestChargingStation = async (coordinates) => {
    const latitude = coordinates.latitude;
    const longitude = coordinates.longitude;

    const url = `https://ui-map.shellrecharge.com/api/map/v2/markers/${longitude - 0.0055}/${longitude + 0.0055}/${latitude - 0.0055}/${latitude + 0.0055}/15`;
    let dataSet = null;

    await fetch(url)
        .then(res => res.json())
        .then(data => dataSet = data)
        .catch(err => console.log(err))

    const availableStations = dataSet.filter(data => {
        return data.status == 'Available'
    });
    return availableStations;
}

// Resource: https://www.geeksforgeeks.org/program-distance-two-points-earth/#:%7E:text=For%20this%20divide%20the%20values,is%20the%20radius%20of%20Earth.
const distance = (lat1, lat2, lon1, lon2) => {
    // The math module contains a function named to Radians which converts from degrees to radians.
    lon1 = lon1 * Math.PI / 180;
    lon2 = lon2 * Math.PI / 180;
    lat1 = lat1 * Math.PI / 180;
    lat2 = lat2 * Math.PI / 180;

    // Haversine formula
    let dlon = lon2 - lon1;
    let dlat = lat2 - lat1;
    let a = Math.pow(Math.sin(dlat / 2), 2)
        + Math.cos(lat1) * Math.cos(lat2)
        * Math.pow(Math.sin(dlon / 2), 2);

    let c = 2 * Math.asin(Math.sqrt(a));

    // Radius of earth in meters. Use 3956 for miles
    let r = 6371000;

    // Calculate the result
    return (Math.round(c * r));
}

const getDistanceToStation = (stations, coordinates) => {
    const lat1 = coordinates.latitude;
    const lon1 = coordinates.longitude;
    let lat2;
    let lon2;

    return stations.map(async (station) => {
        lat2 = station.coordinates.latitude;
        lon2 = station.coordinates.longitude;

        station['distance'] = station['locationUid'];
        delete station['locationUid'];
        station.distance = await distance(lat1, lat2, lon1, lon2);

        return station;
    });
}

const renameOperatorStations = stations => {
    return stations.map(station => {
        let operatorName = station.operatorName;
        if (operatorName == 'PitPoint') {
            station.operatorName = 'TotalGasPower';
        } else if (operatorName == 'EV-Box') {
            station.operatorName = 'Engie';
        } else if (operatorName == 'LastMileSolutions') {
            station.operatorName = 'Engie';
        } else if (operatorName == 'Allego') {
            station.operatorName = 'Vattenfall';
        } else if (operatorName == 'Community by Shell Recharge') {
            station.operatorName = 'EnergieDirect';
        } else if (operatorName == 'Alfen') {
            station.operatorName = 'Vandebron';
        } else if (operatorName == 'E-Flux') {
            station.operatorName = 'BudgetEnergie';
        }
        return station;
    });
}

const getData = async () => {
    const query = `from(bucket: "providers")
    |> range(start: -28h, stop: -27h)
    |> filter(fn: (r) => r["_measurement"] == "past_providers")`;

    try {
        const rows = await queryApi.collectRows(query);
        const data = groupBy(rows, "_field");
        return data;
    } catch (error) {
        console.error(error);
        return [];
    }
}

const sortEnergySuppliers = suppliers => {
    return Object.entries(suppliers)
        .sort(([, a], [, b]) => a._value - b._value)
        .map(supplier => [supplier[0], supplier[1]._value]);
}

const connectStationsToSupplier = (suppliers, stations) => {
    return suppliers.map(supplier => {
        if (stations[supplier[0]]) {
            return {
                [supplier[0]]: {
                    'value': supplier[1],
                    'stations': stations[supplier[0]]
                }
            }
        }
    }).filter(e => e)
}

app.use((req, res) => {
    res.status(404).send('Sorry, could not find the page you were looking for.');
});

server.listen(PORT, () => {
    console.log(`Listening on port: ${PORT}`);
});