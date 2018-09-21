import {Map, proj, View} from 'ol';
import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import VectorLayer from 'ol/layer/Vector';
import {fromLonLat} from 'ol/proj';
import LineString from 'ol/geom/LineString';
import {loadGraph} from './remote';
import Style from 'ol/style/Style';
import Fill from 'ol/style/Fill';
import Text from 'ol/style/Text';

loadGraph({
    northEast: {
        lat: 51,
        lng: 12
    },
    southWest: {
        lat: 49,
        lng: 10
    }
}).done(json => {
    const features = [];
    for (let e of json.edges) {
        const line = new Feature(new LineString([fromLonLat([e.from.lon, e.from.lat]), fromLonLat([e.to.lon, e.to.lat])]));
        line.id = e.id;
        features.push(line);
    }
    const vectorSource = new VectorSource({
        features: features
    });
    new Map({
        target: 'map',
        layers: [
            new TileLayer({
                source: new XYZ({
                    url: 'https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png'
                }),

            }),
            new VectorLayer({
                source: vectorSource,
            }),
            // drawing edge labels like this makes rendering very slow
            // from open layer docs: http://openlayers.org/en/latest/doc/tutorials/background.html
            // ```
            //   By default, OpenLayers uses a performance optimized Canvas renderer.
            //   An experimental WebGL renderer (without text rendering support) is also available.
            // ```
            // -> this could be the reason
            new VectorLayer({
                source: vectorSource,
                style: e => {
                    return new Style({
                        text: new Text({
                            font: 'bold 11px "Open Sans", "Arial Unicode MS", "sans-serif"',
                            placement: 'line',
                            fill: new Fill({
                                color: 'red'
                            }),
                            text: e.id + ''
                        })
                    });
                }
            })
        ],
        view: new View({
            center: [0, 0],
            zoom: 2
        })
    });

}).fail(err => console.log(err));
