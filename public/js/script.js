const socket = io();
const radiusFilter = document.querySelector('#radius');
const errorMessage = document.querySelector('#error_message');
const chargingStations = document.querySelector('#charging_stations');
const loaderSection = document.querySelector('#loader');

const getLocation = () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition, showError);
    } else {
        errorMessage.classList.remove('hidden');
        errorMessage.textContent = 'The Browser Does not Support Geolocation';
    }
}

const showPosition = position => {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    socket.emit('location', { latitude, longitude });
    // errorMessage.textContent = 'Latitude: ' + latitude + '<br>Longitude: ' + longitude;
}

const showError = error => {
    if (error.PERMISSION_DENIED) {
        errorMessage.classList.remove('hidden');
        errorMessage.textContent = 'The User have denied the request for Geolocation.';
    }
}
getLocation();

radiusFilter.addEventListener('change', () => {
    chargingStations.textContent = '';
});

socket.on('fill-in-data', stations => {
    chargingStations.classList.remove('hidden');
    loaderSection.classList.add('hidden');

    stations.map(station => {
        Object.keys(station).map(operator => {
            station[operator].stations.map(stat => {
                fillInChargingStations(station, operator, stat);
                radiusFilter.addEventListener('change', () => {
                    fillInChargingStations(station, operator, stat)
                });
            });
        });
    });
});

const fillInChargingStations = (station, operator, stat) => {
    if (stat.distance < radiusFilter.value) {

        let latitude = stat.coordinates.latitude;
        let longitude = stat.coordinates.longitude;

        // Create each charging station
        let chargingStation = document.createElement('a');
        chargingStation.setAttribute('href', `http://www.google.com/maps/place/${latitude},${longitude}`);
        chargingStation.setAttribute('target', '_blank');

        // Create content of each charging station
        let distanceText = document.createElement('h2');
        distanceText.textContent = `${stat.distance} meters`;
        let operatorText = document.createElement('p');
        operatorText.textContent = stat.operatorName;
        let sustainabilityScore = document.createElement('p');
        sustainabilityScore.textContent = 'Sustainability score: ';
        let sustainabilityValue = station[operator].value;
        if (sustainabilityValue <= 150) {
            sustainabilityScore.classList.add('good_sustainability');
        } else if (sustainabilityValue > 150 && sustainabilityValue <= 250) {
            sustainabilityScore.classList.add('decent_sustainability');
        } else if (sustainabilityValue > 250 && sustainabilityValue <= 350) {
            sustainabilityScore.classList.add('bad_sustainability');
        } else if (sustainabilityValue > 350) {
            sustainabilityScore.classList.add('terrible_sustainability');
        }
        let button = document.createElement('button');

        // Append children
        chargingStation.append(distanceText, operatorText, sustainabilityScore, button);
        chargingStations.appendChild(chargingStation);
        return chargingStations;
    }
}