import {Deck} from './deck';
import {Map} from './map';
import {loadBoundingBox, loadGraph} from './remote';
import {GraphLayer} from './graphLayer';
import {BoundingBoxLayer} from './boundingBoxLayer';
import {Menu} from './menu';
import {hideTooltip, showTooltip} from './tooltip';
import {SelectBoxAction} from './selectBoxAction';
import {EventHandler} from './eventHandler';

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
            logBBoxForOsmosis(coords);
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

graphLayer.setOnShortcutHoverAction(object => {
    if (object) {
        const edge = object.edge;
        showTooltip(object.x, object.y, `shortcut: ${edge.id} (${edge.from.nodeId} - ${edge.to.nodeId}), weight=${edge.weight.toFixed(5)}`);
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
    loadGraph(box)
        .done(json => {
            const bounds = getMinMaxNodeLevels(json.edges);
            menu.setNodeLevelSliderBounds(bounds.minLevel, bounds.maxLevel);
            graphLayer.setGraph(json);
            deck.redraw();
        })
        .fail(err => {
            console.error('error when loading graph:', err);
        });
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

function logBBoxForOsmosis(box) {
    console.log(`osmosis --read-pbf file=-` +
        ` --bounding-box left=${box.southWest.lng} bottom=${box.southWest.lat} right=${box.northEast.lng} top=${box.northEast.lat}` +
        ` --write-pbf file=-`);
}

