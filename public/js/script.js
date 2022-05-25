const socket = io();

var div = document.getElementById("location");
function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition, showError);
    } else {
        div.innerHTML = "The Browser Does not Support Geolocation";
    }
}

function showPosition(position) {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    socket.emit('location', { latitude, longitude })
    div.innerHTML = "Latitude: " + latitude + "<br>Longitude: " + longitude;
}

function showError(error) {
    if (error.PERMISSION_DENIED) {
        div.innerHTML = "The User have denied the request for Geolocation.";
    }
}
getLocation();