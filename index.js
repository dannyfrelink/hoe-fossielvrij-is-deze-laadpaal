const express = require('express');
const app = express();
const PORT = process.env.PORT || 5151;
// const fetch = require('node-fetch');

app.use(express.static('public'));
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    res.render('home')
})

app.use((req, res) => {
    res.status(404).send('Sorry, deze pagina kon ik niet vinden.');
});

app.listen(PORT, () => {
    console.log(`Listening on port: ${PORT}`);
});


const InfluxDatabase = require('@influxdata/influxdb-client');
const InfluxDB = InfluxDatabase.InfluxDB;

const INFLUXDB_URL = 'https://gc-acc.antst.net';
const INFLUXDB_ORG = 'grca';
const INFLUXDB_KEY =
    'QvDOolmSU478M5YkeD17nVeFb4FA_ngo-P0LNokCe6dS2Y10hxIa1zoQ1ZZ9RipKIds-TO7at1-Wgh7Qi44gAQ==';

const client = new InfluxDB({ url: INFLUXDB_URL, token: INFLUXDB_KEY });
const queryApi = client.getQueryApi(INFLUXDB_ORG);

const groupBy = (items, prop) => {
    return items.reduce((out, item) => {
        const value = item[prop];
        out[value] = out[value] || [];
        out[value].push(item);
        return out;
    }, {});
};

async function getData() {
    const query = `
    from(bucket: "elmap")
      |> range(start: now(), stop: 25h)
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
        const data = Object.entries(groupBy(rows, "_field"));
        console.log()
        return data;
    } catch (error) {
        console.error(error);
        return [];
    }
}
getData()






// const rows = queryApi.collectRows(query);
// const data = Object.entries(groupBy(rows, "_field"));