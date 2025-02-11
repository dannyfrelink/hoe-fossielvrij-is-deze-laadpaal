const express = require('express');
const app = express();
const PORT = process.env.PORT || 5151;
const compression = require('compression')
require('dotenv').config();
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

app.use(compression());
app.use(express.static('static'));
app.set('view engine', 'ejs');

let users = {};

io.on('connection', (socket) => {
    users[socket.id] = Math.floor(Math.random() * 10000000);
    socket.join(users[socket.id]);

    socket.on('location', async (coordinates) => {
        const stations = await getClosestChargingStation(coordinates);
        const renamedStations = await renameOperatorStations(stations);
        const stationsWithAddress = await getAddressFromCoords(renamedStations);
        const addressedStations = await Promise.all(stationsWithAddress)
            .then(stations => stations);
        const distancedStations = await getDistanceToStation(addressedStations, coordinates);
        let sortedStationsDistance = await Promise.all(distancedStations).then(stations => groupBy(stations, 'distance'));
        let sortedStationsOperator = await Promise.all(distancedStations).then(stations => groupBy(stations, 'provider'));
        let sortedStations = {};
        await Object.keys(sortedStationsOperator).map(operator => {
            sortedStationsOperator[operator].sort((a, b) => a.distance - b.distance);
            return sortedStations[operator] = sortedStationsOperator[operator];
        });

        const energySupplierEmission = await getProviderData();
        const sortedEnergySuppliers = await sortEnergySuppliers(energySupplierEmission)
        const nearbyStationsPerSupplier = await connectStationsToSupplier(sortedEnergySuppliers, sortedStations);
        await connectStationsToDistance(sortedEnergySuppliers, sortedStationsDistance);

        io.to(users[socket.id]).emit('fill-in-data', nearbyStationsPerSupplier, nearbyStationsPerDistance);
    });

    socket.on('disconnect', () => {
        delete users[socket.id];
    });
});

app.get('/', (req, res) => {
    res.render('home')
})

app.get('/search', async (req, res) => {
    const timesData = await getTimesData();
    let allTimes = [];
    await cleanTimeData(timesData, allTimes)
    const bestTimes = allTimes
        .sort((a, b) => Number(Object.keys(b)[0].split('%')[0]) - Number(Object.keys(a)[0].split('%')[0]))
        .slice(0, 4);

    res.render('search', { bestTimes })
});

const groupBy = (items, prop) => {
    return items.reduce((out, item) => {
        const value = item[prop];
        if (prop == 'provider' || prop == '_time' || prop == 'distance') {
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

    const url = `https://ui-map.shellrecharge.com/api/map/v2/markers/${longitude - 0.0131}/${longitude + 0.0131}/${latitude - 0.0131}/${latitude + 0.0131}/15`;
    let dataSet = null;

    await fetch(url)
        .then(res => res.json())
        .then(data => dataSet = data)
        .catch(err => console.log(err))

    return dataSet;
}

const renameOperatorStations = stations => {
    return stations.map(station => {
        let operatorName = station.operatorName;
        if (operatorName == 'PitPoint') {
            station['provider'] = 'TotalGasPower';
        } else if (operatorName == 'EV-Box') {
            station['provider'] = 'Engie';
        } else if (operatorName == 'LastMileSolutions') {
            station['provider'] = 'Engie';
        } else if (operatorName == 'Allego' || operatorName == 'Vattenfall') {
            station['provider'] = 'Vattenfall';
        } else if (operatorName == 'Community by Shell Recharge' || operatorName == 'Shell Recharge') {
            station['provider'] = 'EnergieDirect';
        } else if (operatorName == 'Alfen') {
            station['provider'] = 'Vandebron';
        } else if (operatorName == 'E-Flux') {
            station['provider'] = 'BudgetEnergie';
        }
        return station;
    });
}

const getAddressFromCoords = async (stations) => {
    return await stations.map(station => {
        return fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${station.coordinates.longitude},${station.coordinates.latitude}.json?access_token=${process.env.API_TOKEN}`)
            .then(res => res.json())
            .then(data => {
                station['address'] = data.features;
                return station
            });
    });
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

const getProviderData = async () => {
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
                    'stations': stations[supplier[0]],
                }
            };
        }
    }).filter(e => e);
}

let nearbyStationsPerDistance = [];
const connectStationsToDistance = (suppliers, stations) => {
    nearbyStationsPerDistance = [];
    Object.values(stations).map(station => {
        station.map(stat => {
            suppliers.map(supplier => {
                if (stat.provider == supplier[0]) {
                    nearbyStationsPerDistance.push({
                        [stat.distance]: {
                            'value': supplier[1],
                            'stations': stat
                        }
                    });
                }
            });
        });
    });
}

const getTimesData = async () => {
    const query = `
    from(bucket: "elmap")
      |> range(start: now(), stop: 24h)
      |> filter(fn: (r) => r["_measurement"] == "forecast")
      |> filter(fn: (r) => r["kind"] == "powerConsumptionBreakdown")
      |> filter(fn: (r) => r["zone"] == "NL")
      |> filter(fn: (r) => r["timeoffset"] == "baseline")
      |> aggregateWindow(every: 1h, fn: mean, createEmpty: false)
      |> sort(columns: ["_time"], desc: false)
      |> yield(name: "mean")
    `;
    try {
        const rows = await queryApi.collectRows(query);
        const today = new Date();
        const convertedTimes = rows.map(row => {
            row['_time'] = Math.round(Math.abs(today - new Date(row['_time'])) / 36e5) - 1;
            if (row['_time'] === 0) {
                row['_time'] = 'Now'
            }
            return row;
        });
        const data = groupBy(convertedTimes, "_time");
        return data;
    } catch (error) {
        console.error(error);
        return [];
    }
}

const cleanTimeData = (timesData, allTimes) => {
    Object.keys(timesData).map(time => {
        let badMaterial = {};
        let goodMaterial = {};

        timesData[time].map(results => {
            if (results._field == 'gas' || results._field == 'coal' || results._field == 'oil') {
                badMaterial[results._value] = results;
            } else {
                goodMaterial[results._value] = results;
            }
        });

        let badMaterialTotal = Object.keys(badMaterial).map(Number).reduce((partialSum, a) => partialSum + a, 0);
        let goodMaterialTotal = Object.keys(goodMaterial).map(Number).reduce((partialSum, a) => partialSum + a, 0);

        let goodMaterialResults = [];
        Object.values(goodMaterial).map(results => {
            goodMaterialResults.push(results);
        });

        let totalValue = badMaterialTotal + goodMaterialTotal;
        let calculate = `${Math.round(goodMaterialTotal / totalValue * 100)}%`;

        allTimes.push({ [calculate]: goodMaterialResults[0]._time });
    });
}

app.use((req, res) => {
    res.status(404).send('Sorry, could not find the page you were looking for.');
});

server.listen(PORT, () => {
    console.log(`Listening on port: ${PORT}`);
});