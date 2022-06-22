const socket = io();
const results = document.querySelector('#results');
const openTimes = document.querySelector('#open_times');
const openFilters = document.querySelector('#open_filters');
const filters = document.querySelector('#filters');
const times = document.querySelector('#times');
const rangeInput = document.querySelector('input[type="range"]');
const numberInput = document.querySelector('input[type="number"]');
const sortInputsAvailability = document.querySelectorAll('#filters div:first-of-type input[type="radio"]');
const sortInputs = document.querySelectorAll('#filters div:nth-of-type(2) input[type="radio"]');
const errorMessage = document.querySelector('#error_message');
const chargingStations = document.querySelector('#charging_stations');
const loaderSection = document.querySelector('#loader');
const loaderText = document.querySelector('#loader_text');

// export { socket, results, openTimes, openFilters, filters, times, rangeInput, numberInput, sortInputsAvailability, sortInputs, errorMessage, chargingStations, loaderSection, loaderText }