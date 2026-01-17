/**
 * Post-install script to copy Two.js to the lib directory
 * This ensures the Electron app can work offline
 */

const fs = require('fs');
const path = require('path');

const sourceFile = path.join(__dirname, '..', 'node_modules', 'two.js', 'build', 'two.min.js');
const destDir = path.join(__dirname, '..', '..', 'lib');
const destFile = path.join(destDir, 'two.min.js');

// Create lib directory if it doesn't exist
if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
    console.log('Created lib directory');
}

// Copy the file
try {
    fs.copyFileSync(sourceFile, destFile);
    console.log('Copied two.min.js to lib directory for offline use');
} catch (err) {
    console.error('Error copying two.min.js:', err.message);
    console.log('The app will use the CDN version as fallback');
}
