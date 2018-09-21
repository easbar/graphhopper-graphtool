import {Deck as DeckGL} from '@deck.gl/core';

/**
 * Wraps the deck.gl class and allows drawing vector layers on top of the given map. Map navigation (zooming & panning)
 * is handled by deck.gl and forwarded to the given map.
 */
export class Deck {
    constructor(canvas, map) {
        this._map = map;
        this._currentViewState = {
            longitude: 0,
            latitude: 0,
            zoom: 1,
        };
        this._props = {
            canvas: canvas,
            controller: true,
            viewState: this._currentViewState,
            onViewStateChange: ({viewState}) => {
                this._currentViewState = viewState;
                this._map.setCenter(viewState.longitude, viewState.latitude);
                this._map.setZoom(viewState.zoom);
                // allows making layers available at certain zoom levels only, but implies rendering overhead
                this.redraw();
            },
        };
        this._deck = this._createDeck();
        this._layerFactories = {};
    }

    moveTo(lng, lat, zoom) {
        this._currentViewState = {
            longitude: lng,
            latitude: lat,
            zoom: zoom,
        };
        this._props.onViewStateChange({viewState: this._currentViewState});
    }

    screenToLngLat(x, y) {
        if (!this._deck.layerManager) {
            return {lng: 0, lat: 0};
        }
        const coords = this._deck.layerManager.context.viewport.unproject([x, y]);
        return {
            lng: coords[0],
            lat: coords[1]
        }
    }

    registerLayerFactory(layerFactory) {
        this._layerFactories[layerFactory.layerId] = layerFactory;
    }

    removeLayerFactory(layerId) {
        delete this._layerFactories[layerId];
    }

    redraw() {
        this._props.layers = Object.keys(this._layerFactories)
            .map(k => {
                const layer = this._layerFactories[k].createLayer(this._currentViewState);
                layer.id = k;
                return layer;
            });
        this._props.viewState = this._currentViewState;
        this._deck.setProps(this._props);
    }

    _createDeck() {
        return new DeckGL(this._props);
    }
}

