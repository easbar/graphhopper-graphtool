const selectAreaButton = $('#select-area-button');
const lookupLocationButton = $('#lookup-location-button');
const findNodeByIdField = $('#find-node-by-id-field');
const zoomToNodeInput = $('#zoom-to-node-input');
const zoomToNodeButton = $('#zoom-to-node-button');
const zoomToEdgeInput = $('#zoom-to-edge-input');
const zoomToEdgeButton = $('#zoom-to-edge-button');
const minNodeLevelSlider = $('#min-node-level-slider');
const maxNodeLevelSlider = $('#max-node-level-slider');
const minNodeLevelDisplay = $('#min-node-level-value');
const maxNodeLevelDisplay = $('#max-node-level-value');
const mousePositionDisplay = $('#mouse-position');

export class Menu {

    constructor() {
        this._nodeLevelSliderChangedAction = (min, max) => {
        };
        this._findNodeByIdEnteredAction = (nodeId) => {
        };
        findNodeByIdField.keypress(this._onFindNodeById.bind(this));
        minNodeLevelSlider.on('input', this._onNodeLevelSliderChanged.bind(this));
        maxNodeLevelSlider.on('input', this._onNodeLevelSliderChanged.bind(this));
    }

    setMousePosition(pos) {
        mousePositionDisplay.html('(' + pos.lng.toFixed(5) + ', ' + pos.lat.toFixed(5) + ')');
    }

    setSelectAreaButtonAction(action) {
        selectAreaButton.click(e => action());
    }

    setLookupLocationAction(action) {
        lookupLocationButton.click(e => action());
    }

    setFindNodeByIdEnteredAction(action) {
        this._findNodeByIdEnteredAction = action;
    }

    setZoomToNodeAction(action) {
        zoomToNodeButton.click(e => {
            const nodeId = zoomToNodeInput.val();
            action(nodeId);
        })
    }

    setZoomToEdgeAction(action) {
        zoomToEdgeButton.click(e => {
            const edgeId = zoomToEdgeInput.val();
            action(edgeId);
        })
    }

    setNodeLevelSliderChangedAction(action) {
        this._nodeLevelSliderChangedAction = action;
    }

    setNodeLevelSliderBounds(min, max) {
        minNodeLevelSlider.attr('min', min);
        minNodeLevelSlider.attr('max', max);
        minNodeLevelSlider.attr('value', min);
        maxNodeLevelSlider.attr('min', min);
        maxNodeLevelSlider.attr('max', max);
        maxNodeLevelSlider.attr('value', max);
        this._onNodeLevelSliderChanged(min, max);
    }

    _onFindNodeById(event) {
        if (event.keyCode === 13) {
            const nodeId = findNodeByIdField.val();
            this._findNodeByIdEnteredAction(nodeId);
        }
    }

    _onNodeLevelSliderChanged() {
        const minSliderValue = minNodeLevelSlider.val();
        const maxSliderValue = maxNodeLevelSlider.val();
        minNodeLevelDisplay.html(minSliderValue);
        maxNodeLevelDisplay.html(maxSliderValue);
        this._nodeLevelSliderChangedAction(minSliderValue, maxSliderValue);
    }
}
