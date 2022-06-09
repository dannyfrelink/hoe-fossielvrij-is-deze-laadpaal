const socket = io();
const results = document.querySelector('#results');
const openTimes = document.querySelector('#open_times');
const openFilters = document.querySelector('#open_filters');
const filters = document.querySelector('#filters');
const times = document.querySelector('#times');
const radiusFilter = document.querySelector('#radius');
const errorMessage = document.querySelector('#error_message');
const chargingStations = document.querySelector('#charging_stations');
const loaderSection = document.querySelector('#loader');

const getLocation = () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition, showError);
    } else {
        errorMessage.classList.remove('hidden');
        errorMessage.textContent = 'Your browser does not let you share your location. Maybe try in another browser.';
    }
}

const showPosition = position => {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    socket.emit('location', { latitude, longitude });
}

const showError = error => {
    if (error.PERMISSION_DENIED) {
        errorMessage.classList.remove('hidden');
        errorMessage.textContent = "It seems that we don't have access to your location. Check your settings to enable us to track your location.";
    }
}
getLocation();

openFilters.addEventListener('click', () => {
    openFilters.classList.toggle('active');
    filters.classList.toggle('hidden');

    if (openFilters.classList.contains('active')) {
        openTimes.classList.remove('active');
        times.classList.add('hidden');
    }
});

openTimes.addEventListener('click', () => {
    openTimes.classList.toggle('active');
    times.classList.toggle('hidden');

    if (openTimes.classList.contains('active')) {
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
    // let chargingStationsArticles = document.querySelectorAll('#charging_stations article');
    // console.log(chargingStationsArticles)

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
                    resultsAmount++;
                    let latitude = stat.coordinates.latitude;
                    let longitude = stat.coordinates.longitude;

                    // Create each charging station
                    let chargingStation = document.createElement('article');
                    // chargingStation.setAttribute('href', `http://www.google.com/maps/place/${latitude},${longitude}`);
                    // chargingStation.setAttribute('target', '_blank');

                    // Create content of each charging station
                    let operatorText = document.createElement('h2');
                    operatorText.textContent = stat.operatorName;
                    let distanceText = document.createElement('p');
                    distanceText.textContent = `${stat.distance} meters`;
                    let sustainabilityScore = document.createElement('p');
                    let sustainabilityValue = station[operator].value;
                    sustainabilityScore.textContent = `Sustainability score: ${Math.round(baseValue / sustainabilityValue * 100)}%`
                    let button = document.createElement('button');
                    button.textContent = 'i';

                    // Extra information (displays on click article)
                    let extraInfoContainer = document.createElement('div');
                    extraInfoContainer.classList.add('hidden');
                    let availability = document.createElement('p');
                    availability.textContent = `Current status: ${stat.status}`
                    let operatorName = document.createElement('p');
                    operatorName.textContent = `Operator: ${stat.operatorName}`;
                    let maxPower = document.createElement('p');
                    maxPower.textContent = `Maximum charging power: ${stat.maxPower}kW`
                    let startRoute = document.createElement('a');
                    startRoute.setAttribute('href', `http://www.google.com/maps/place/${latitude},${longitude}`);
                    startRoute.setAttribute('target', '_blank');
                    startRoute.textContent = 'Start route';

                    chargingStation.addEventListener('click', (e) => {
                        if (e.target.tagName.toLowerCase() !== 'a') {
                            extraInfoContainer.classList.toggle('hidden');
                        }
                    });

                    // Append children
                    extraInfoContainer.append(operatorName, availability, maxPower, startRoute);
                    chargingStation.append(operatorText, distanceText, sustainabilityScore, button, extraInfoContainer);
                    chargingStations.appendChild(chargingStation);
                    return chargingStations;
                }
            });
        });
    });
}