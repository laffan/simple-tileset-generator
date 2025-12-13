/* Shape registry - collects all shape render functions and path data */

const shapeRenderers = {};
const shapePathData = {};

// Bezier circle approximation constant (used for curved shapes)
const BEZIER_CIRCLE = 0.552284749831;
