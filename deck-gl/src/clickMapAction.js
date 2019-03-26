import {EventManager} from 'mjolnir.js';

/**
 * Lets the user click a location on the map.
 */
export class ClickMapAction {

    constructor(deck) {
        this._deck = deck;
        this._active = false;
    }

    start(domId, mapClickedHandler, cancelledHandler) {
        this._eventManager = new EventManager(document.getElementById(domId));
        this._eventManager.on('click', this._onClick.bind(this));
        this._mapClickedHandler = mapClickedHandler;
        // todo: maybe change mouse cursor ?
        // todo: maybe press esc to cancel ?
        this._cancelledHandler = cancelledHandler;
        this._active = true;
    }

    stop() {
        if (!this._eventManager) {
            throw new Error('need to call start first');
        }
        this._eventManager.destroy();
        this._active = false;
    }

    _onClick(event) {
        if (!this._active) {
            return;
        }
        const clickCoords = this._deck.screenToLngLat(event.center.x, event.center.y);
        this._mapClickedHandler(clickCoords);
    }

}
