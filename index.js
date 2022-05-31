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
        const sortedStations = await groupBy(stations, 'operatorName');

        const energySupplierEmission = await getData();
        const sortedEnergySuppliers = Object.entries(energySupplierEmission)
            .sort(([, a], [, b]) => a._value - b._value)
            .map(supplier => [supplier[0], supplier[1]._value]);

        const lat1 = coordinates.latitude;
        const lon1 = coordinates.longitude;
        let lat2;
        let lon2;
        const test = Object.values(sortedStations).map(value => {
            return value.map(async (v) => {
                lat2 = v.coordinates.latitude;
                lon2 = v.coordinates.longitude;

                // console.log(v.locationUid)
                v.locationUid = await distance(lat1, lat2, lon1, lon2)

                // setTimeout(() => {
                //     v.then(d => console.log(d))
                // }, 10000)

                return v;

                // console.log(v.coordinates);
            });
            // return value;
        });

        console.log(test)

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

    const url = `https://ui-map.shellrecharge.com/api/map/v2/markers/${longitude - 0.03}/${longitude + 0.03}/${latitude - 0.03}/${latitude + 0.03}/15`;
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

async function getData() {
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

const distance = (lat1, lat2, lon1, lon2) => {
    // The math module contains a functionnamed to Radians which converts from degrees to radians.
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

    // calculate the result
    return (c * r);
}

app.use((req, res) => {
    res.status(404).send('Sorry, could not find the page you were looking for.');
});

server.listen(PORT, () => {
    console.log(`Listening on port: ${PORT}`);
});