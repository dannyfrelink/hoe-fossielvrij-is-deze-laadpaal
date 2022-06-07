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

    fillInChargingStations(stations);
    radiusFilter.addEventListener('change', () => {
        fillInChargingStations(stations)
    });
});

const fillInChargingStations = (stations) => {
    const baseValue = Object.values(stations[0])[0].value;

    return stations.map(station => {
        return Object.keys(station).map(operator => {
            return station[operator].stations.map(stat => {
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
                    let sustainabilityValue = station[operator].value;
                    if (sustainabilityValue == baseValue) {
                        sustainabilityScore.textContent = 'Sustainability score: 100%';
                    } else {
                        sustainabilityScore.textContent = `Sustainability score: ${Math.round(baseValue / sustainabilityValue * 100)}%`
                    }
                    let button = document.createElement('button');

                    // Append children
                    chargingStation.append(distanceText, operatorText, sustainabilityScore, button);
                    chargingStations.appendChild(chargingStation);
                    return chargingStations;
                }
            });
        });
    });
}