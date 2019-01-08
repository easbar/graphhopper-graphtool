import {Deck} from './deck';
import {Map} from './map';
import {loadBoundingBox, loadGraph} from './remote';
import {GraphLayer} from './graphLayer';
import {BoundingBoxLayer} from './boundingBoxLayer';
import {Menu} from './menu';
import {hideTooltip, showTooltip} from './tooltip';
import {SelectBoxAction} from './selectBoxAction';
import {EventHandler} from './eventHandler';
import {ghUrl} from "./config";

const deckCanvas = 'deck-canvas';
const mapContainer = 'map-container';
const mapDiv = 'map';

const menu = new Menu();
const map = new Map(mapDiv);
const deck = new Deck(deckCanvas, map);
const selectBoxAction = new SelectBoxAction(deck);
const boundingBoxLayer = new BoundingBoxLayer(deck);
const graphLayer = new GraphLayer(deck);
const eventHandler = new EventHandler(mapContainer);

eventHandler.setMouseMoveAction(e => {
    const pos = deck.screenToLngLat(e.center.x, e.center.y);
    menu.setMousePosition(pos);
});

menu.setNodeLevelSliderChangedAction(value => {
    graphLayer.setMaximumNodeLevel(value);
    deck.redraw();
});

menu.setSelectAreaButtonAction(() => {
    selectBoxAction.start(mapContainer,
        coords => {
            queryAndDrawGraph(coords);
            selectBoxAction.stop();
        },
        () => {
            selectBoxAction.stop();
            deck.redraw();
        });
});

graphLayer.setOnEdgeHoverAction(object => {
    if (object) {
        const edge = object.edge;
        showTooltip(object.x, object.y, `edge: ${edge.id} (${edge.from.nodeId} - ${edge.to.nodeId}), weight=${edge.weight.toFixed(5)}`);
    } else {
        hideTooltip();
    }
});

graphLayer.setOnNodeHoverAction(object => {
    if (object) {
        const node = object.node;
        showTooltip(object.x, object.y, `node: ${node.nodeId} (${node.lon.toFixed(5)}, ${node.lat.toFixed(5)}), lvl=${node.level}`);
    } else {
        hideTooltip();
    }
});

loadBoundingBox()
    .done(bbox => {
        boundingBoxLayer.setBoundingBox(bbox);
        // no idea why, but without the timeout we end up in the wrong place until we pan or zoom for the first time
        setTimeout(() => {
            // todo: calculate zoom to fit bbox
            const zoom = 7;
            deck.moveTo((bbox.northEast.lng + bbox.southWest.lng) / 2, (bbox.northEast.lat + bbox.southWest.lat) / 2, zoom);
        }, 1000);
    })
    .fail(err => console.error(err));


function queryAndDrawGraph(box) {
    const callback = function (coordinates) {
        console.time('drawing graph');
        console.log('graph:', coordinates.length);
        // const bounds = getMinMaxNodeLevels(json.edges);
        // menu.setNodeLevelSliderBounds(bounds.minLevel, bounds.maxLevel);
        menu.setNodeLevelSliderBounds(0, 3);
        graphLayer.setGraph(coordinates);
        deck.redraw();
        console.timeEnd('drawing graph');
    };

    const url = ghUrl + 'binary-graph' +
        '?northEastLat=' + box.northEast.lat + '&northEastLng=' + box.northEast.lng +
        '&southWestLat=' + box.southWest.lat + '&southWestLng=' + box.southWest.lng;

    var xhttp = new XMLHttpRequest();
    xhttp.open("GET", url, true);
    xhttp.responseType = 'arraybuffer';
    xhttp.callback = callback;
    xhttp.setRequestHeader("Content-type", "application/octet-stream");

    var _this = this;

    // TODO error handling if exception or http code 500

    xhttp.onload = function (e) {
        var arrayBuffer = xhttp.response;
        var dataView = new DataView(arrayBuffer);

        var pointer = 0;
        var entries = dataView.getInt32(pointer);
        var entrySize = dataView.getInt32(pointer + 4);
        pointer += 8;

        if (dataView.byteLength - pointer !== entries * entrySize)
            console.log("expected byte size does not match " + (dataView.byteLength + pointer) + " vs " + entries * entrySize);

        const coordinates = [];
        for (let i = 0; i < entries; i++) {

            const edgeId = dataView.getFloat32(pointer);
            const weight = dataView.getFloat32(pointer + 4);
            const fromId = dataView.getFloat32(pointer + 8);
            const fromLvl = dataView.getFloat32(pointer + 12);
            const fromLat = dataView.getFloat32(pointer + 16);
            const fromLon = dataView.getFloat32(pointer + 20);
            const toId = dataView.getFloat32(pointer + 24);
            const toLvl = dataView.getFloat32(pointer + 28);
            const toLat = dataView.getFloat32(pointer + 32);
            const toLon = dataView.getFloat32(pointer + 36);

            coordinates.push([edgeId, weight, fromId, fromLvl, fromLat, fromLon,
                toId, toLvl, toLat, toLon]);
            pointer += entrySize;
        }

        callback(coordinates);
    };

    xhttp.send();
    // loadGraph(box)
    //     .done(json => {
    //         console.time('drawing graph');
    //         console.log('graph:', json.edges.length);
    //         const bounds = getMinMaxNodeLevels(json.edges);
    //         menu.setNodeLevelSliderBounds(bounds.minLevel, bounds.maxLevel);
    //         graphLayer.setGraph(json);
    //         deck.redraw();
    //         console.timeEnd('drawing graph');
    //     })
    //     .fail(err => {
    //         console.error('error when loading graph:', err);
    //     });
}

function getMinMaxNodeLevels(edges) {
    let minLevel = Number.MAX_SAFE_INTEGER;
    let maxLevel = Number.MIN_SAFE_INTEGER;
    for (let e of edges) {
        minLevel = Math.min(minLevel, Math.min(e.from.level, e.to.level));
        maxLevel = Math.max(maxLevel, Math.max(e.from.level, e.to.level));
    }
    return {minLevel, maxLevel};
}


