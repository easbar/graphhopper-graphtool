import {EventManager} from 'mjolnir.js';

export class EventHandler {
    constructor(domId) {
        this._eventManager = new EventManager(document.getElementById(domId));
    }

    setMouseMoveAction(action) {
        this._eventManager.on('mousemove', action);
    }
}
