const express = require('express');
const app = express();
const PORT = process.env.PORT || 5151;
// const fetch = require('node-fetch');

app.use(express.static('public'));
app.set('view engine', 'ejs');

app.use((req, res) => {
    res.status(404).send('Sorry, deze pagina kon ik niet vinden.');
});

app.listen(PORT, () => {
    console.log(`Listening on port: ${PORT}`);
});