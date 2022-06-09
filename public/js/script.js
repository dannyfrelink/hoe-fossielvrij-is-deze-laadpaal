const socket = io();
const results = document.querySelector('#results');
const openTimes = document.querySelector('#open_times');
const openFilters = document.querySelector('#open_filters');
const filters = document.querySelector('#filters');
const times = document.querySelector('#times');
const radiusFilter = document.querySelector('#radius');
const chargingStations = document.querySelector('#charging_stations');
const loaderSection = document.querySelector('#loader');

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

openFilters.addEventListener('click', () => {
    openFilters.classList.toggle('active');
    filters.classList.toggle('hidden');

    if (openFilters.classList[0] === 'active') {
        openTimes.classList.remove('active');
        times.classList.add('hidden');
    }
});

openTimes.addEventListener('click', () => {
    openTimes.classList.toggle('active');
    times.classList.toggle('hidden');

    if (openTimes.classList[0] === 'active') {
        openFilters.classList.remove('active');
        filters.classList.add('hidden');
    }
});

radiusFilter.addEventListener('change', () => {
    chargingStations.textContent = '';
});

let resultsAmount = 0;
socket.on('fill-in-data', stations => {
    chargingStations.classList.remove('hidden');
    loaderSection.classList.add('hidden');

    fillInChargingStations(stations);
    results.textContent = `${resultsAmount} results`;

    radiusFilter.addEventListener('change', () => {
        fillInChargingStations(stations);
        results.textContent = `${resultsAmount} results`;
    });
});

const fillInChargingStations = (stations) => {
    resultsAmount = 0;
    const baseValue = Object.values(stations[0])[0].value;

    return stations.map(station => {
        return Object.keys(station).map(operator => {
            return station[operator].stations.map(stat => {
                if (stat.distance < radiusFilter.value) {
                    resultsAmount++
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
                    sustainabilityScore.textContent = `Sustainability score: ${Math.round(baseValue / sustainabilityValue * 100)}%`
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