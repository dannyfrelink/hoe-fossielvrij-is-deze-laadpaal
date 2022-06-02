const express = require('express');
const app = express();
const PORT = process.env.PORT || 5151;
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);
const fetch = require('node-fetch')

const InfluxDatabase = require('@influxdata/influxdb-client');
const InfluxDB = InfluxDatabase.InfluxDB;
const INFLUXDB_URL = 'https://gc-acc.antst.net';
const INFLUXDB_ORG = 'grca';
const INFLUXDB_KEY = 'QvDOolmSU478M5YkeD17nVeFb4FA_ngo-P0LNokCe6dS2Y10hxIa1zoQ1ZZ9RipKIds-TO7at1-Wgh7Qi44gAQ==';
const client = new InfluxDB({ url: INFLUXDB_URL, token: INFLUXDB_KEY });
const queryApi = client.getQueryApi(INFLUXDB_ORG);

app.use(express.static('public'));
app.set('view engine', 'ejs');

io.on('connection', (socket) => {
    socket.on('location', async (coordinates) => {
        const stations = await getClosestChargingStation(coordinates);
        const renamedStations = await renameOperatorStations(stations);
        const sortedStations = await groupBy(stations, 'operatorName');
        const distancedStations = await getDistanceToStation(sortedStations, coordinates);

        Promise.all(distancedStations).then(stations => {
            stations.map(station => console.log(station))
        });
        // console.log(distancedStations)

        const energySupplierEmission = await getData();
        const sortedEnergySuppliers = Object.entries(energySupplierEmission)
            .sort(([, a], [, b]) => a._value - b._value)
            .map(supplier => [supplier[0], supplier[1]._value]);



        // const b = test.map(tes => {
        //     return tes.map(t => {
        //         return t.then(k => {
        //             return k
        //         })
        //     })
        // })

        // setTimeout(() => {
        //     test.then(d => console.log(d))
        // }, 10000)




        // sortedEnergySuppliers.forEach(supplier => {
        //     // console.log(supplier[0])
        //     // console.log(sortedStations[supplier[0]])
        // })

        // console.log(Object.keys(sortedStations))

        io.emit('fill-in-data', sortedStations);
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

const getDistanceToStation = (sortedStations, coordinates) => {
    const lat1 = coordinates.latitude;
    const lon1 = coordinates.longitude;
    let lat2;
    let lon2;

    return Object.values(sortedStations).map(values => {
        return values.map(async (value) => {
            lat2 = value.coordinates.latitude;
            lon2 = value.coordinates.longitude;

            value['distance'] = value['locationUid'];
            delete value['locationUid'];

            // console.log(value)

            value.distance = await distance(lat1, lat2, lon1, lon2);

            // console.log(value)

            // setTimeout(() => {
            //     value.then(d => console.log(d))
            // }, 10000)

            return value;

            // console.log(v.coordinates);
        });
        // console.log(values)
        // Promise.all(values).then(d => {
        //     return d
        // });
        // console.log(test2)
        // return values;
    });
}

const renameOperatorStations = stations => {
    console.log(stations)
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

app.use((req, res) => {
    res.status(404).send('Sorry, could not find the page you were looking for.');
});

server.listen(PORT, () => {
    console.log(`Listening on port: ${PORT}`);
});