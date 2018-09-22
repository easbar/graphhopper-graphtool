import {ghUrl} from './config';

export function loadGraph(box) {
    const url = ghUrl + 'graph' +
        '?northEastLat=' + box.northEast.lat + '&northEastLng=' + box.northEast.lng +
        '&southWestLat=' + box.southWest.lat + '&southWestLng=' + box.southWest.lng;
    return $.ajax({
        url: url,
        timeout: 60 * 1000,
        type: 'GET',
        datatype: 'json',
        crossDomain: true,
    });
}

export function loadBoundingBox() {
    const url = ghUrl + 'info';
    return $.ajax({
        url: url,
        timeout: 60 * 1000,
        type: 'GET',
        datatype: 'json',
        crossDomain: true,
    }).then(json => {
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
