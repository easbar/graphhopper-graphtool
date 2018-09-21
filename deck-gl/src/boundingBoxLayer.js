import {PolygonLayer} from '@deck.gl/layers';
import * as Colors from './colors';

export class BoundingBoxLayer {
    constructor(deck) {
        this._deck = deck;
    }

    setBoundingBox(boundingBox) {
        this._deck.registerLayerFactory({
            layerId: 'bounding-box',
            createLayer: viewState => {
                return new PolygonLayer({
                    filled: false,
                    stroked: true,
                    lineWidthMinPixels: 3,
                    data: [{
                        corners: [
                            [boundingBox.northEast.lng, boundingBox.northEast.lat],
                            [boundingBox.northEast.lng, boundingBox.southWest.lat],
                            [boundingBox.southWest.lng, boundingBox.southWest.lat],
                            [boundingBox.southWest.lng, boundingBox.northEast.lat]
                        ],
                    }],
                    getLineColor: d => Colors.MAP_BBOX,
                    getPolygon: d => d.corners
                })
            }
        })
    }
}
