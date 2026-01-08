// modules/chartUtils.js
// Utility functions and configurations for Chart.js

/**
 * Returns the base configuration options for Chart.js charts, mimicking shadcn styling.
 * @param {string} type - 'bar', 'line', 'doughnut', etc.
 * @param {object} extra - Additional options to merge.
 * @returns {object} Chart.js options object.
 */
export const getBaseOptions = (type, extra = {}) => {
    const { plugins: extraPlugins, animation: extraAnimation, ...otherExtra } = extra;

    return {
        responsive: true,
        maintainAspectRatio: false,
        animation: false, // Animation COMPLETELY DISABLED
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                titleColor: '#f1f5f9',
                bodyColor: '#e2e8f0',
                borderColor: 'rgba(148, 163, 184, 0.1)',
                borderWidth: 1,
                padding: 10,
                cornerRadius: 6,
                boxPadding: 4
            },
            ...extraPlugins
        },
        ...otherExtra
    };
};

/**
 * Plugin to display text in the center of a doughnut chart.
 */
export const commonCenterTextPlugin = {
    id: 'centerText',
    beforeDraw: function (chart) {
        if (chart.config.type !== 'doughnut') return;
        const pluginData = chart.config.options.plugins?.centerTextData;
        if (!pluginData) return;

        const { width, height, ctx } = chart;
        ctx.save();

        // Scaling font size
        const fontSize = (height / 120).toFixed(2);
        ctx.font = "800 " + fontSize + "em Inter, sans-serif";

        const fgVar = getComputedStyle(document.body).getPropertyValue('--foreground').trim();
        ctx.fillStyle = fgVar ? `hsl(${fgVar})` : '#ffffff';
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";

        const text = pluginData.text || '';

        // Draw Number (slightly raised)
        ctx.fillText(text, width / 2, height / 2 - 18); // Moved up (was -10)

        // Draw Label (slightly lowered)
        const labelFontSize = (height / 280).toFixed(2);
        ctx.font = "500 " + labelFontSize + "em Inter, sans-serif";

        const mutedVar = getComputedStyle(document.body).getPropertyValue('--muted-foreground').trim();
        ctx.fillStyle = mutedVar ? `hsl(${mutedVar})` : '#94a3b8';
        ctx.fillText(pluginData.subText || '', width / 2, height / 2 + 8); // Moved up (was +15)
        ctx.restore();
    }
};

/**
 * Destroys existing chart instance on a canvas if it exists.
 * @param {string} canvasId - The ID of the canvas element.
 */
export const destroyChart = (canvasId) => {
    const canvas = document.getElementById(canvasId);
    if (canvas) {
        const existingChart = Chart.getChart(canvas);
        if (existingChart) {
            existingChart.destroy();
        }
    }
};
