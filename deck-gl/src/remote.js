import {ghUrl} from './config';

export function loadGraph(box) {
    const url = ghUrl + 'graph' +
        '?northEastLat=' + box.northEast.lat + '&northEastLng=' + box.northEast.lng +
        '&southWestLat=' + box.southWest.lat + '&southWestLng=' + box.southWest.lng;
    return get(url);
}

export function loadBoundingBox() {
    const url = ghUrl + 'info';
    return get(url).then(json => {
        return {
            southWest: {
                lng: json.bbox[0],
                lat: json.bbox[1]
            },
            northEast: {
                lng: json.bbox[2],
                lat: json.bbox[3],
            }
        };
    })
}

export function loadLocationLookup(coords) {
    const url = ghUrl + 'location-lookup' +
        '?lat=' + coords.lat + '&lng=' + coords.lng;
    return get(url).then(json => json);
}

export function loadNodeCoordinate(nodeId) {
    const url = ghUrl + 'node-coordinate' +
        '?nodeId=' + nodeId;
    return get(url).then(json => json);
}

export function loadEdgeCoordinate(edgeId) {
    const url = ghUrl + 'edge-coordinate' +
        '?edgeId=' + edgeId;
    return get(url).then(json => json);
}

function get(url) {
    return $.ajax({
        url: url,
        timeout: 60 * 1000,
        type: 'GET',
        datatype: 'json',
        crossDomain: true
    });
}