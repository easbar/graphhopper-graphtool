const tooltip = $('#tooltip');

export const showTooltip = (x, y, content) => {
    tooltip.css('left', `${x}px`);
    tooltip.css('top', `${y}px`);
    tooltip.html(content);
};

export const hideTooltip = () => {
    // we use css to make sure tooltip will be hidden when empty
    tooltip.html('');
};
