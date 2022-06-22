// import { socket, chargingStations, loaderSection, loaderText, sortInputsAvailability, sortInputs, results, rangeInput } from './variables.js';

let resultsAmount = 0;

socket.on('fill-in-data', (stationsBySupplier, stationsByDistance) => {
    chargingStations.classList.remove('hidden');
    loaderSection.classList.add('hidden');
    loaderText.classList.add('hidden');

    let sortedSupplierStations = changeSupplierOnAvailibitlySort(stationsBySupplier);
    let sortedDistanceStations = changeDistanceOnAvailibitlySort(stationsByDistance);

    sortInputsAvailability.forEach(input => {
        input.addEventListener('click', () => {
            chargingStations.textContent = '';
            sortedSupplierStations = changeSupplierOnAvailibitlySort(stationsBySupplier);
            sortedDistanceStations = changeDistanceOnAvailibitlySort(stationsByDistance);
            if (sortInputs[0].checked) {
                fillInChargingStationsBySupplier(sortedSupplierStations);
            } else if (sortInputs[1].checked) {
                fillInChargingStationsByDistance(sortedDistanceStations, sortedSupplierStations);
            }
            results.textContent = `${resultsAmount} results`;
        });
    })

    sortInputs.forEach(input => {
        input.addEventListener('click', (e) => {
            chargingStations.textContent = '';
            const checkedInput = e.target.id
            if (checkedInput == 'sustainability') {
                fillInChargingStationsBySupplier(sortedSupplierStations);
            } else if (checkedInput == 'distance') {
                fillInChargingStationsByDistance(sortedDistanceStations, sortedSupplierStations);
            }
        });
    });

    rangeInput.addEventListener('input', () => {
        chargingStations.textContent = '';
        if (sortInputs[0].checked) {
            fillInChargingStationsBySupplier(sortedSupplierStations);
        } else if (sortInputs[1].checked) {
            fillInChargingStationsByDistance(sortedDistanceStations, sortedSupplierStations);
        }
        results.textContent = `${resultsAmount} results`;
    });

    fillInChargingStationsBySupplier(sortedSupplierStations);
    results.textContent = `${resultsAmount} results`;
});

const changeSupplierOnAvailibitlySort = (stationsBySupplier) => {
    let stationsSupplierAvailability = [];
    stationsBySupplier.map(providers => {
        return Object.keys(providers).map(provider => {
            stationsSupplierAvailability.push({
                [provider]: {
                    'value': providers[provider].value,
                    'stations': providers[provider].stations.filter(station => {
                        if (sortInputsAvailability[0].checked) {
                            return station.status === 'Available'
                        } else if (sortInputsAvailability[1].checked) {
                            return station;
                        }
                    })
                }
            });
        });
    });

    return stationsSupplierAvailability;
}

const changeDistanceOnAvailibitlySort = (stationsByDistance) => {
    let stationsDistanceAvailability = [];
    stationsByDistance.map(distances => {
        return Object.keys(distances).filter(distance => {
            if (sortInputsAvailability[0].checked && distances[distance].stations.status === 'Available') {
                stationsDistanceAvailability.push({
                    [distance]: {
                        'value': distances[distance].value,
                        'stations': distances[distance].stations
                    }
                })
            } else if (sortInputsAvailability[1].checked) {
                stationsDistanceAvailability.push({
                    [distance]: {
                        'value': distances[distance].value,
                        'stations': distances[distance].stations
                    }
                })
            }
        });
    });

    return stationsDistanceAvailability;
}

const fillInChargingStationsByDistance = (stations, value) => {
    resultsAmount = 0;
    let totalValues = [];
    let totalStations = [];
    value.map(providers => {
        Object.values(providers).map(values => {
            totalValues.push(values.value * values.stations.length);
            totalStations.push(values.stations.length);
        });
    });
    let averageValue = totalValues.reduce((a, b) => a + b, 0) / totalStations.reduce((a, b) => a + b, 0);

    stations.map(station => {
        Object.values(station).map(stat => {
            let sustainabilityScore = document.createElement('p');
            let sustainabilityValue = stat.value;
            sustainabilityScore.textContent = 'Sustainability score: ';
            if (sustainabilityValue > averageValue) {
                sustainabilityScore.classList.add('bad_sustainability');
            } else if (sustainabilityValue <= averageValue) {
                sustainabilityScore.classList.add('good_sustainability');
            }

            insertContent(stat.stations, sustainabilityScore);
        });
    });
}

const fillInChargingStationsBySupplier = stations => {
    resultsAmount = 0;

    let totalValues = [];
    let totalStations = [];
    Object.values(stations).map(providers => {
        Object.values(providers).map(values => {
            totalValues.push(values.value * values.stations.length);
            totalStations.push(values.stations.length);
        });
    });
    let averageValue = totalValues.reduce((a, b) => a + b, 0) / totalStations.reduce((a, b) => a + b, 0);

    return stations.map(station => {
        return Object.keys(station).map(operator => {
            return station[operator].stations.map(stat => {
                let sustainabilityScore = document.createElement('p');
                sustainabilityScore.textContent = 'Sustainability score: ';
                let sustainabilityValue = station[operator].value;
                if (sustainabilityValue > averageValue) {
                    sustainabilityScore.classList.add('bad_sustainability');
                } else if (sustainabilityValue <= averageValue) {
                    sustainabilityScore.classList.add('good_sustainability');
                }

                insertContent(stat, sustainabilityScore);
            });
        });
    });
}

const insertContent = (station, sustainabilityScore) => {
    if (station.distance < rangeInput.value) {
        resultsAmount++;
        let latitude = station.coordinates.latitude;
        let longitude = station.coordinates.longitude;

        // Create all elements
        let chargingStation = document.createElement('article');
        let address = document.createElement('h2');
        let distance = document.createElement('p');
        let button = document.createElement('button');
        let extraInfoContainer = document.createElement('div');
        let operatorName = document.createElement('p');
        let providerName = document.createElement('p');
        let availability = document.createElement('p');
        let maxPower = document.createElement('p');
        let startRoute = document.createElement('a');
        let streetName = station.address.map(address => {
            if (address.id.includes('address')) {
                return address.text;
            }
        }).filter(e => e);

        // Give faded out look to unavailable stations
        if (station.status !== 'Available') {
            chargingStation.classList.add('unavailable');
        }

        // Create content of each charging station
        address.textContent = streetName[0];
        distance.textContent = `${station.distance} meters`;
        button.textContent = 'i';

        // Extra information (displays on click article)
        extraInfoContainer.setAttribute('id', 'extra_info_container');
        extraInfoContainer.classList.add('hidden');
        operatorName.textContent = `Operator: ${station.operatorName}`;
        providerName.textContent = `Provider: ${station.provider}`;
        availability.textContent = `Current status: ${station.status}`
        maxPower.textContent = `Maximum charging power: ${station.maxPower}kW`
        startRoute.setAttribute('href', `http://www.google.com/maps/place/${latitude},${longitude}`);
        startRoute.setAttribute('target', '_blank');
        startRoute.textContent = 'Start route';

        // Open and close extra info of article
        chargingStation.addEventListener('click', (e) => {
            let clickHeight = window.innerHeight - e.clientY;
            if (clickHeight < 250 && extraInfoContainer.classList.contains('hidden')) {
                let targetElement = e.target
                if (targetElement.nodeName.toLowerCase() !== 'article') {
                    targetElement = e.target.parentElement
                }
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }
            if (e.target.tagName.toLowerCase() !== 'a') {
                extraInfoContainer.classList.toggle('hidden');
            }
        });

        // Append children
        if (streetName.length > 0) {
            extraInfoContainer.append(operatorName, providerName, availability, maxPower, startRoute);
            chargingStation.append(address, distance, sustainabilityScore, button, extraInfoContainer);
            chargingStations.appendChild(chargingStation);
        }
        return chargingStations;
    }
}