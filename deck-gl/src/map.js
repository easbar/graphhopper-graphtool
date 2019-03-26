import mapboxgl from 'mapbox-gl';
import {tilesUrl} from './config';

/**
 * Represents the map that is displayed in the main view and deals with tiles etc., should be independent from
 * any vector layers on top of it.
 */
export class Map {

    constructor(container) {
        this._map = this._createMap(container);
    }

    setCenter(lng, lat) {
        this._map.setCenter([lng, lat]);
    }

    getCenter() {
        return this._map.getCenter();
    }

    setZoom(zoom) {
        this._map.setZoom(zoom);
    }

    getZoom() {
        return this._map.getZoom();
    }

    _createMap(container) {
        const map = new mapboxgl.Map({
            // docs: https://www.mapbox.com/mapbox-gl-js/api/#map
            container: container,
            minZoom: 0,
            maxZoom: 24,
            longitude: 0,
            latitude: 0,
            zoom: 1,
            style: {
                "version": 8,
                "sources": {
                    "graphhopper-mvt": {
                        "type": "vector",
                        "tiles": [
                            tilesUrl
                        ]
                    }
                },
                "glyphs": "https://free.tilehosting.com/fonts/{fontstack}/{range}.pbf?key=yrAYvi6TTYgg9U5mBtiY",
            },
            // map is not interactive, all user interaction will be done via deck.gl
            interactive: false,
        });
        map.addLayer({
            "id": "road_big",
            "type": "line",
            "source": "graphhopper-mvt",
            "source-layer": "roads",
            "filter": [
                ">=",
                "speed",
                60
            ],
            "layout": {
                "line-cap": "round",
                "line-join": "round"
            },
            "paint": {
                "line-opacity": 0.6,
                "line-color": "#dd504b",
                "line-width": 2
            }
        });
        map.addLayer({
            "id": "road_small",
            "type": "line",
            "source": "graphhopper-mvt",
            "source-layer": "roads",
            "filter": [
                "<",
                "speed",
                60
            ],
            "layout": {
                "line-cap": "round",
                "line-join": "round"
            },
            "paint": {
                "line-opacity": 0.6,
                "line-color": "#f7c913",
                "line-width": 2
            }
        });
        map.addLayer({
            "id": "road_major_label",
            "type": "symbol",
            "source": "graphhopper-mvt",
            "source-layer": "roads",
            "filter": [
                "==",
                "$type",
                "LineString"
            ],
            "layout": {
                "symbol-placement": "line",
                "text-field": "{name} - {edgeId}",
                "text-font": [
                    "Noto Sans Regular"
                ],
                "text-letter-spacing": 0.1,
                "text-rotation-alignment": "map",
                "text-size": {
                    "base": 1.4,
                    "stops": [
                        [10, 8],
                        [20, 14]
                    ]
                },
                "text-transform": "uppercase"
            },
            "paint": {
                "text-color": "#000",
                "text-halo-color": "hsl(0, 0%, 100%)",
                "text-halo-width": 2
            }
        });
        return map;
    }
}
