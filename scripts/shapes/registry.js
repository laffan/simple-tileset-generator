/* Shape registry - collects all shape render functions and path data */

// Use var to make these globally accessible across script files
var shapeRenderers = {};
var shapePathData = {};

// Bezier circle approximation constant (used for curved shapes)
var BEZIER_CIRCLE = 0.552284749831;
