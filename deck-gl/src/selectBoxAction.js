import {EventManager} from 'mjolnir.js';
import {PolygonLayer} from '@deck.gl/layers';
import * as Colors from './colors';

/**
 * Lets the user select a bounding box by clicking two different locations on the map. After the first click the
 * current bounding box is drawn on the map.
 */
export class SelectBoxAction {
    constructor(deck) {
        this._deck = deck;
        this._reset();
    }

    start(domId, boxSelectedHandler, cancelledHandler) {
        this._eventManager = new EventManager(document.getElementById(domId));
        this._eventManager.on('click', this._onClick.bind(this));
        this._eventManager.on('mousemove', this._onMouseMove.bind(this));
        this._eventManager.on('keydown', this._onKeyDown.bind(this));
        this._boxSelectedHandler = boxSelectedHandler;
        this._cancelledHandler = cancelledHandler;
    }

    stop() {
        if (!this._eventManager) {
            throw new Error('need to call start first');
        }
        this._eventManager.destroy();
    }

    _onClick(event) {
        if (!this._isActive()) {
            this._reset();
            const startCoords = this._deck.screenToLngLat(event.center.x, event.center.y);
            this._startBox(startCoords);
        } else {
            this._finishBox();
        }
    }

    _onMouseMove(event) {
        if (this._isActive()) {
            const endCoords = this._deck.screenToLngLat(event.center.x, event.center.y);
            this._updateBox(endCoords);
        }
    }

    _onKeyDown(event) {
        if (this._isActive()) {
            if (event.key === 'Escape') {
                this._reset();
                this._cancelledHandler();
            }
        }
    }

    _startBox(startCoords) {
        this._start = startCoords;
        this._end = this._start;
    }

    _updateBox(endCoords) {
        this._end = endCoords;
        this._deck.registerLayerFactory({
            layerId: 'tmp-box',
            createLayer: this._createLayer.bind(this)
        });
        this._deck.redraw();
    }

    _finishBox() {
        this._boxSelectedHandler({
            northEast: {lng: Math.max(this._start.lng, this._end.lng), lat: Math.max(this._start.lat, this._end.lat)},
            southWest: {lng: Math.min(this._start.lng, this._end.lng), lat: Math.min(this._start.lat, this._end.lat)},
        });
        this._reset();
    }

    _reset() {
        this._deck.removeLayerFactory('tmp-box');
        this._start = undefined;
        this._end = undefined;
    }

    _createLayer(viewState) {
        return new PolygonLayer({
            id: 'tmp-box',
            filled: true,
            stroked: true,
            lineWidthMinPixels: 3,
            opacity: 0.2,
            data: [{
                corners: [
                    [this._start.lng, this._start.lat],
                    [this._start.lng, this._end.lat],
                    [this._end.lng, this._end.lat],
                    [this._end.lng, this._start.lat]
                ],
            }],
            getLineColor: Colors.SELECT_AREA_BOX,
            getFillColor: Colors.SELECT_AREA_BOX_FILL,
            getPolygon: d => d.corners
        })
    }

    _isActive() {
        return this._start !== undefined;
    }

}
