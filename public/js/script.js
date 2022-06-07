const socket = io();
const filterContainer = document.querySelector('#filters_container');
const closeFilters = document.querySelector('#filters button');
const radiusFilter = document.querySelector('#radius');
const errorMessageContainer = document.querySelector('#error_message_container');
const closeErrorMessage = document.querySelector('#error_message button');
const chargingStations = document.querySelector('#charging_stations');
const loaderSection = document.querySelector('#loader');
const openFilters = document.querySelector('#open_filters');

const getLocation = () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition, showError);
    } else {
        errorMessageContainer.classList.remove('hidden');
    }
}

const showPosition = position => {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    socket.emit('location', { latitude, longitude });
}

const showError = error => {
    if (error.PERMISSION_DENIED) {
        errorMessageContainer.classList.remove('hidden');
    }
}
getLocation();

closeFilters.addEventListener('click', () => {
    filterContainer.classList.add('hidden');
});

closeErrorMessage.addEventListener('click', () => {
    errorMessageContainer.classList.add('hidden');
});

radiusFilter.addEventListener('change', () => {
    chargingStations.textContent = '';
});

openFilters.addEventListener('click', () => {
    filterContainer.classList.remove('hidden');
})

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
                    let operatorText = document.createElement('h2');
                    operatorText.textContent = stat.operatorName;
                    let distanceText = document.createElement('p');
                    distanceText.textContent = `${stat.distance} meters`;
                    let sustainabilityScore = document.createElement('p');
                    let sustainabilityValue = station[operator].value;
                    if (sustainabilityValue == baseValue) {
                        sustainabilityScore.textContent = 'Sustainability score: 100%';
                    } else {
                        sustainabilityScore.textContent = `Sustainability score: ${Math.round(baseValue / sustainabilityValue * 100)}%`
                    }
                    let button = document.createElement('button');

                    // Append children
                    chargingStation.append(operatorText, distanceText, sustainabilityScore, button);
                    chargingStations.appendChild(chargingStation);
                    return chargingStations;
                }
            });
        });
    });
}