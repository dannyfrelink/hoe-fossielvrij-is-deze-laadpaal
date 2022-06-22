import { getLocation } from './modules/getLocation.js';
import { addEventListeners } from './modules/ui.js';
import './modules/fillInData.js'

if (window.location.pathname == '/search') {
    getLocation();
    addEventListeners();
}
