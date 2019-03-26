import {LineLayer, ScatterplotLayer, TextLayer} from '@deck.gl/layers';
import * as Colors from './colors';

export class GraphLayer {

    constructor(deck) {
        this._deck = deck;
        this._minNodeLevel = -99999999;
        this._maxNodeLevel = +99999999;
        this._highlightedNodes = [];
        this._graph = {};
        this._nodes = {};
        this._nodesByIndex = {};
        this._onEdgeHover = e => {
        };
        this._onShortcutHover = e => {
        };
        this._onNodeHover = n => {
        };
    }

    setMinimumNodeLevel(nodeLevel) {
        this._minNodeLevel = nodeLevel;
    }

    setMaximumNodeLevel(nodeLevel) {
        this._maxNodeLevel = nodeLevel;
    }

    setHighlightedNode(nodeId) {
        this._highlightedNodes = [nodeId];
    }

    setOnEdgeHoverAction(action) {
        this._onEdgeHover = action;
    }

    setOnShortcutHoverAction(action) {
        this._onShortcutHover = action;
    }

    setOnNodeHoverAction(action) {
        this._onNodeHover = action;
    }

    setLocationLookup(lookup) {
        console.log(lookup);
        this._deck.registerLayerFactory({
            layerId: 'location-lookup-points',
            createLayer: viewState => {
                return new ScatterplotLayer({
                    data: [{point: lookup.queryPoint, type: 'query'}, {point: lookup.snappedPoint, type: 'snapped'}],
                    radiusMinPixels: 3,
                    radiusMaxPixels: 5,
                    getRadius: 5,
                    getPosition: n => [n.point[0], n.point[1]],
                    getFillColor: n => n.type === 'query' ? Colors.NODE_LOOKUP_QUERY : Colors.NODE_LOOKUP_SNAPPED,
                    autoHighlight: false,
                    highlightColor: Colors.NODE_HIGHLIGHT,
                    pickable: true
                });
            }
        });

        this._deck.registerLayerFactory({
                layerId: 'location-lookup-edges',
                createLayer: viewState => {
                    return new LineLayer({
                        data: [
                            {edge: lookup.closestEdge, type: 'closest'},
                            ...lookup.virtualEdges.map(e => ({edge: e, type: 'virtual'}))
                        ],
                        getStrokeWidth: 5,
                        getSourcePosition: e => [e.edge.from.lon, e.edge.from.lat],
                        getTargetPosition: e => [e.edge.to.lon, e.edge.to.lat],
                        getLineColor: e => e.type === 'closest' ? Colors.NODE_LOOKUP_SNAPPED : Colors.NODE_LOOKUP_QUERY,
                        autoHighlight: false,
                        highlightColor: Colors.EDGE_HIGHLIGHT,
                        pickable: true
                    });
                }
            }
        )
    }

    setGraph(graph) {
        this._graph = graph;
        this._nodesByIndex = {};
        for (let e of graph.edges) {
            this._nodesByIndex[e.from.nodeId] = e.from;
            this._nodesByIndex[e.to.nodeId] = e.to;
        }
        this._nodes = Object.values(this._nodesByIndex);
        this.setSearchedNodes(graph);
        this.setEdges(graph);
        this.setShortcuts(graph);
        this.setNodes(graph);
    }

    setSearchedNodes(graph) {
        this._deck.registerLayerFactory({
            layerId: 'graph-layer-searched-node',
            createLayer: viewState => {
                return new ScatterplotLayer({
                    data: this._highlightedNodes,
                    radiusMinPixels: 5,
                    radiusMaxPixels: 5,
                    getRadius: 5,
                    visible: n => this._nodesByIndex[n] !== 'undefined',
                    getPosition: n => this._nodesByIndex[n] !== 'undefined' ? [this._nodesByIndex[n].lon, this._nodesByIndex[n].lat] : [0, 0],
                    getFillColor: n => this._nodesByIndex[n] !== 'undefined' ? Colors.NODE : Colors.INVISIBLE,
                    updateTriggers: {
                        getRadius: [this._highlightedNodes],
                        getFillColor: [this._highlightedNodes]
                    },
                    autoHighlight: true,
                    highlightColor: Colors.NODE_HIGHLIGHT,
                    pickable: true
                });
            }
        });
    }

    setEdges(graph) {
        this._deck.registerLayerFactory({
            layerId: 'graph-layer-edges',
            createLayer: viewState => {
                return new LineLayer({
                    data: graph.edges,
                    getStrokeWidth: 5,
                    getSourcePosition: e => [e.from.lon, e.from.lat],
                    getTargetPosition: e => [e.to.lon, e.to.lat],
                    getColor: e => {
                        return (this.levelInRange(this._nodesByIndex[e.from.nodeId].level) || this.levelInRange(this._nodesByIndex[e.to.nodeId].level)) ? Colors.EDGE : Colors.INVISIBLE
                    },
                    updateTriggers: {
                        getColor: [this._maxNodeLevel, this._minNodeLevel]
                    },
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
                    // getText: e => e.id + '',
                    getSize: 20,
                    getColor: n => this.levelInRange(n.level) ? Colors.EDGE_LABEL : Colors.INVISIBLE,
                    updateTriggers: {
                        getColor: [this._maxNodeLevel, this._minNodeLevel]
                    },
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
    }

    setShortcuts(graph) {
        this._deck.registerLayerFactory({
            layerId: 'graph-layer-shortcuts',
            createLayer: viewState => {
                // todo: maybe use an ArcLayer to show shortcuts ?
                return new LineLayer({
                    data: graph.shortcuts,
                    getStrokeWidth: 4,
                    getSourcePosition: e => [e.from.lon, e.from.lat],
                    getTargetPosition: e => [e.to.lon, e.to.lat],
                    getColor: e => {
                        return (this.levelInRange(this._nodesByIndex[e.from.nodeId].level) || this.levelInRange(this._nodesByIndex[e.to.nodeId].level)) ? Colors.SHORTCUT : Colors.INVISIBLE
                    },
                    onHover: e => {
                        if (e.object) {
                            this._onShortcutHover({
                                x: e.x,
                                y: e.y,
                                edge: e.object
                            });
                        } else {
                            this._onShortcutHover();
                        }
                    },
                    updateTriggers: {
                        getColor: [this._maxNodeLevel, this._minNodeLevel]
                    },
                    autoHighlight: true,
                    highlightColor: Colors.EDGE_HIGHLIGHT,
                    pickable: true
                });
            }
        });

        this._deck.registerLayerFactory({
            layerId: 'graph-layer-shortcut-labels',
            createLayer: viewState => {
                return new TextLayer({
                    data: graph.shortcuts,
                    visible: viewState.zoom > 13,
                    getText: e => e.id + '',
                    getSize: 20,
                    getColor: n => this.levelInRange(n.level) ? Colors.EDGE_LABEL : Colors.INVISIBLE,
                    updateTriggers: {
                        getColor: [this._maxNodeLevel, this._minNodeLevel]
                    },
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
    }

    setNodes(graph) {
        this._deck.registerLayerFactory({
            layerId: 'graph-layer-nodes',
            createLayer: viewState => {
                // todo: maybe use a 3D Grid Layer to show CH levels ?
                return new ScatterplotLayer({
                    data: this._nodes,
                    radiusMinPixels: 2,
                    radiusMaxPixels: 3,
                    getRadius: 3,
                    getPosition: n => [n.lon, n.lat],
                    getFillColor: n => this.levelInRange(n.level) ? Colors.NODE : Colors.INVISIBLE,
                    updateTriggers: {
                        getRadius: [this._maxNodeLevel, this._minNodeLevel],
                        getFillColor: [this._maxNodeLevel, this._minNodeLevel]
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
                    data: this._nodes,
                    visible: viewState.zoom > 13,
                    getText: n => n.nodeId + '',
                    getSize: 20,
                    getColor: n => this.levelInRange(n.level) ? Colors.NODE_LABEL : Colors.INVISIBLE,
                    updateTriggers: {
                        getColor: [this._maxNodeLevel, this._minNodeLevel]
                    },
                    getPosition: n => [n.lon, n.lat],
                    getPixelOffset: [0, -22],
                })
            }
        })
    }

    levelInRange(level) {
        return level >= this._minNodeLevel && level <= this._maxNodeLevel;
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
