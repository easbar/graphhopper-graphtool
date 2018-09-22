import {LineLayer, ScatterplotLayer, TextLayer} from '@deck.gl/layers';
import * as Colors from './colors';

export class GraphLayer {

    constructor(deck) {
        this._deck = deck;
        this._maxNodeLevel = 0;
        this._onEdgeHover = e => {
        };
        this._onNodeHover = n => {
        };
    }

    setMaximumNodeLevel(nodeLevel) {
        this._maxNodeLevel = nodeLevel;
    }

    setOnEdgeHoverAction(action) {
        this._onEdgeHover = action;
    }

    setOnNodeHoverAction(action) {
        this._onNodeHover = action;
    }

    setGraph(graph) {
        this._deck.registerLayerFactory({
            layerId: 'graph-layer-edges',
            createLayer: viewState => {
                return new LineLayer({
                    data: graph.edges,
                    getStrokeWidth: 5,
                    getSourcePosition: e => [e.from.lon, e.from.lat],
                    getTargetPosition: e => [e.to.lon, e.to.lat],
                    getColor: Colors.EDGE,
                    onHover: e => {
                        if (e.object) {
                            this._onEdgeHover({
                                x: e.x,
                                y: e.y,
                                edge: e.object
                            });
                        } else {
                            this._onEdgeHover();
                        }
                    },
                    autoHighlight: true,
                    highlightColor: Colors.EDGE_HIGHLIGHT,
                    pickable: true
                });
            }
        });

        this._deck.registerLayerFactory({
            layerId: 'graph-layer-edge-labels',
            createLayer: viewState => {
                return new TextLayer({
                    data: graph.edges,
                    visible: viewState.zoom > 13,
                    getText: e => e.id + '',
                    getSize: 20,
                    getColor: Colors.EDGE_LABEL,
                    getPosition: e => [(e.from.lon + e.to.lon) / 2, (e.from.lat + e.to.lat) / 2],
                    getAngle: e => getAngleBetweenPoints(e.from.lon, e.from.lat, e.to.lon, e.to.lat),
                    getPixelOffset: e => {
                        const angle = getAngleBetweenPoints(e.from.lon, e.from.lat, e.to.lon, e.to.lat);
                        const offset = 22;
                        return [offset * Math.sin(toRadians(angle)), offset * Math.cos(toRadians(angle))];
                    }
                })
            }
        });

        let nodes = {};
        for (let e of graph.edges) {
            nodes[e.from.nodeId] = e.from;
            nodes[e.to.nodeId] = e.to;
        }
        nodes = Object.values(nodes);

        this._deck.registerLayerFactory({
            layerId: 'graph-layer-nodes',
            createLayer: viewState => {
                return new ScatterplotLayer({
                    data: nodes,
                    radiusMinPixels: 3,
                    radiusMaxPixels: 5,
                    getRadius: 5,
                    getPosition: n => [n.lon, n.lat],
                    getColor: n => (n.level < this._maxNodeLevel) ? Colors.NODE : Colors.INVISIBLE,
                    updateTriggers: {
                        getRadius: [this._maxNodeLevel],
                        getColor: [this._maxNodeLevel]
                    },
                    onHover: n => {
                        if (n.object) {
                            this._onNodeHover({
                                x: n.x,
                                y: n.y,
                                node: n.object
                            });
                        } else {
                            this._onNodeHover();
                        }
                    },
                    autoHighlight: true,
                    highlightColor: Colors.NODE_HIGHLIGHT,
                    pickable: true
                });
            }
        });

        this._deck.registerLayerFactory({
            layerId: 'graph-layer-node-labels',
            createLayer: viewState => {
                return new TextLayer({
                    data: nodes,
                    visible: viewState.zoom > 13,
                    getText: n => n.nodeId + '',
                    getSize: 20,
                    getColor: Colors.NODE_LABEL,
                    getPosition: n => [n.lon, n.lat],
                    getPixelOffset: [0, -22],
                })
            }
        })
    }
}

/**
 * Returns the angle (in degrees) between a horizontal line through a point P (lng1, lat1), and a line connecting
 * P with a second point Q (lng2, lat2) in a 2D plane.
 */
function getAngleBetweenPoints(lng1, lat1, lng2, lat2) {
    lng1 = toRadians(lng1);
    lat1 = toRadians(lat1);
    lng2 = toRadians(lng2);
    lat2 = toRadians(lat2);

    // calculate Haversine distance between P(Q) and (lng2, lat1)
    const x = 2 * Math.asin(Math.cos(lat1) * Math.sin((lng2 - lng1) / 2));
    const y = lat2 - lat1;

    return toDegrees(Math.atan(y / x));
}

function toRadians(angle) {
    return angle * Math.PI / 180;
}

function toDegrees(radians) {
    return radians * 180 / Math.PI;
}
