const selectAreaButton = $('#select-area-button');
const nodeLevelSlider = $('#node-level-slider');
const nodeLevelDisplay = $('#node-level-value');
const mousePositionDisplay = $('#mouse-position');

export class Menu {

    constructor() {
        this._nodeLevelSliderChangedAction = (value) => {
        };
        nodeLevelSlider.on('input', this._onNodeLevelSliderChanged.bind(this));
    }

    setMousePosition(pos) {
        mousePositionDisplay.html('(' + pos.lng.toFixed(5) + ', ' + pos.lat.toFixed(5) + ')');
    }

    setSelectAreaButtonAction(action) {
        selectAreaButton.click(e => action());
    }

    setNodeLevelSliderChangedAction(action) {
        this._nodeLevelSliderChangedAction = action;
    }

    setNodeLevelSliderBounds(min, max) {
        nodeLevelSlider.attr('min', min);
        nodeLevelSlider.attr('max', max);
    }

    _onNodeLevelSliderChanged() {
        const sliderValue = nodeLevelSlider.val();
        nodeLevelDisplay.html(sliderValue);
        this._nodeLevelSliderChangedAction(sliderValue);
    }
}
