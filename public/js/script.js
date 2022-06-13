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
socket.on('fill-in-data', (stationsBySupplier, stationsByDistance) => {
    chargingStations.classList.remove('hidden');
    loaderSection.classList.add('hidden');

    fillInChargingStationsByDistance(stationsByDistance);
    radiusFilter.addEventListener('change', () => {
        fillInChargingStationsByDistance(stationsByDistance);
        results.textContent = `${resultsAmount} results`;
    });

    // fillInChargingStationsBySupplier(stationsBySupplier);
    results.textContent = `${resultsAmount} results`;

    // radiusFilter.addEventListener('change', () => {
    //     fillInChargingStationsBySupplier(stationsBySupplier);
    //     results.textContent = `${resultsAmount} results`;
    // });
});

const fillInChargingStationsByDistance = stations => {
    console.log(stations)
    resultsAmount = 0;

    Object.values(stations).map(station => {
        station.map(stat => {
            if (stat.distance < radiusFilter.value) {
                resultsAmount++;
                let latitude = stat.coordinates.latitude;
                let longitude = stat.coordinates.longitude;

                // Create all elements
                let chargingStation = document.createElement('article');
                let address = document.createElement('h2');
                let distance = document.createElement('p');
                let button = document.createElement('button');
                let extraInfoContainer = document.createElement('div');
                let operatorName = document.createElement('p');
                let providerName = document.createElement('p');
                let sustainabilityScore = document.createElement('p');
                let availability = document.createElement('p');
                let maxPower = document.createElement('p');
                let startRoute = document.createElement('a');

                let streetName = stat.address.map(address => {
                    if (address.id.includes('address')) {
                        return address.text;
                    }
                }).filter(e => e);

                // Create content of each charging station
                address.textContent = streetName[0];
                distance.textContent = `${stat.distance} meters`;
                button.textContent = 'i';

                // Extra information (displays on click article)
                extraInfoContainer.setAttribute('id', 'extra_info_container');
                extraInfoContainer.classList.add('hidden');
                operatorName.textContent = `Operator: ${stat.operatorName}`;
                providerName.textContent = `Provider: ${stat.provider}`;
                // let sustainabilityValue = station[operator].value;
                // sustainabilityScore.textContent = `Sustainability score: ${Math.round(baseValue / sustainabilityValue * 100)}%`
                availability.textContent = `Current status: ${stat.status}`
                maxPower.textContent = `Maximum charging power: ${stat.maxPower}kW`
                startRoute.setAttribute('href', `http://www.google.com/maps/place/${latitude},${longitude}`);
                startRoute.setAttribute('target', '_blank');
                startRoute.textContent = 'Start route';

                // Open and close extra info of article
                chargingStation.addEventListener('click', (e) => {
                    if (e.target.tagName.toLowerCase() !== 'a') {
                        extraInfoContainer.classList.toggle('hidden');
                    }
                });

                // Append children
                if (streetName.length > 0) {
                    extraInfoContainer.append(operatorName, providerName, sustainabilityScore, availability, maxPower, startRoute);
                    chargingStation.append(address, distance, button, extraInfoContainer);
                    chargingStations.appendChild(chargingStation);
                }
                return chargingStations;

            }
        });
    });
    // return stations.map(station => console.log(station))
}

const fillInChargingStationsBySupplier = stations => {
    resultsAmount = 0;
    const baseValue = Object.values(stations[0])[0].value;

    return stations.map(station => {
        return Object.keys(station).map(operator => {
            return station[operator].stations.map(stat => {
                if (stat.distance < radiusFilter.value) {
                    resultsAmount++;
                    let latitude = stat.coordinates.latitude;
                    let longitude = stat.coordinates.longitude;

                    // Create all elements
                    let chargingStation = document.createElement('article');
                    let address = document.createElement('h2');
                    let distance = document.createElement('p');
                    let button = document.createElement('button');
                    let extraInfoContainer = document.createElement('div');
                    let operatorName = document.createElement('p');
                    let providerName = document.createElement('p');
                    let sustainabilityScore = document.createElement('p');
                    let availability = document.createElement('p');
                    let maxPower = document.createElement('p');
                    let startRoute = document.createElement('a');

                    let streetName = stat.address.map(address => {
                        if (address.id.includes('address')) {
                            return address.text;
                        }
                    }).filter(e => e);

                    // Create content of each charging station
                    address.textContent = streetName[0];
                    distance.textContent = `${stat.distance} meters`;
                    button.textContent = 'i';

                    // Extra information (displays on click article)
                    extraInfoContainer.setAttribute('id', 'extra_info_container');
                    extraInfoContainer.classList.add('hidden');
                    operatorName.textContent = `Operator: ${stat.operatorName}`;
                    providerName.textContent = `Provider: ${stat.provider}`;
                    let sustainabilityValue = station[operator].value;
                    sustainabilityScore.textContent = `Sustainability score: ${Math.round(baseValue / sustainabilityValue * 100)}%`
                    availability.textContent = `Current status: ${stat.status}`
                    maxPower.textContent = `Maximum charging power: ${stat.maxPower}kW`
                    startRoute.setAttribute('href', `http://www.google.com/maps/place/${latitude},${longitude}`);
                    startRoute.setAttribute('target', '_blank');
                    startRoute.textContent = 'Start route';

                    // Open and close extra info of article
                    chargingStation.addEventListener('click', (e) => {
                        if (e.target.tagName.toLowerCase() !== 'a') {
                            extraInfoContainer.classList.toggle('hidden');
                        }
                    });

                    // Append children
                    if (streetName.length > 0) {
                        extraInfoContainer.append(operatorName, providerName, sustainabilityScore, availability, maxPower, startRoute);
                        chargingStation.append(address, distance, button, extraInfoContainer);
                        chargingStations.appendChild(chargingStation);
                    }
                    return chargingStations;
                }
            });
        });
    });
}