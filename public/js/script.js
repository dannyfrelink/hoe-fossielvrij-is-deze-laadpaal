const socket = io();
const div = document.querySelector('#location');
const chargingStationsUl = document.querySelector('#charging_stations');

const getLocation = () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition, showError);
    } else {
        div.innerHTML = 'The Browser Does not Support Geolocation';
    }
}

const showPosition = position => {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    socket.emit('location', { latitude, longitude })
    div.innerHTML = 'Latitude: ' + latitude + '<br>Longitude: ' + longitude;
}

const showError = error => {
    if (error.PERMISSION_DENIED) {
        div.innerHTML = 'The User have denied the request for Geolocation.';
    }
}
getLocation();

socket.on('fill-in-data', data => {
    data.forEach(d => {
        let chargingStation = document.createElement('li');
        chargingStation.innerHTML = d.operatorName;
        chargingStationsUl.appendChild(chargingStation);
        // console.log(d)
    })
})