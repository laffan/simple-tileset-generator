const { app, BrowserWindow, Menu, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// Keep a global reference of the window object
let mainWindow;

// Determine if we're running in development or production
const isDev = !app.isPackaged;

// Get the correct path to the app files
function getAppPath() {
    if (isDev) {
        // Development: files are in parent directory
        return path.join(__dirname, '..');
    } else {
        // Production: files are in app subdirectory within asar
        return path.join(__dirname, 'app');
    }
}

function createWindow() {
    const appPath = getAppPath();

    // Create the browser window
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1024,
        minHeight: 700,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true
        },
        icon: path.join(__dirname, 'icons', 'icon.png'),
        title: 'Simple Tileset Generator',
        backgroundColor: '#ffffff'
    });

    // Load the index.html
    mainWindow.loadFile(path.join(appPath, 'index.html'));

    // Build the application menu
    const template = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'Save Session',
                    accelerator: 'CmdOrCtrl+S',
                    click: () => {
                        mainWindow.webContents.executeJavaScript('document.getElementById("saveSessionLink").click()');
                    }
                },
                {
                    label: 'Load Session',
                    accelerator: 'CmdOrCtrl+O',
                    click: () => {
                        mainWindow.webContents.executeJavaScript('document.getElementById("loadSessionLink").click()');
                    }
                },
                { type: 'separator' },
                {
                    label: 'Download Tileset as PNG',
                    accelerator: 'CmdOrCtrl+Shift+P',
                    click: () => {
                        mainWindow.webContents.executeJavaScript('document.querySelector(\'[data-format="png"]\').click()');
                    }
                },
                {
                    label: 'Download Tileset as SVG',
                    accelerator: 'CmdOrCtrl+Shift+S',
                    click: () => {
                        mainWindow.webContents.executeJavaScript('document.querySelector(\'[data-format="svg"]\').click()');
                    }
                },
                { type: 'separator' },
                { role: 'quit' }
            ]
        },
        {
            label: 'Edit',
            submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { type: 'separator' },
                { role: 'cut' },
                { role: 'copy' },
                { role: 'paste' },
                { role: 'selectAll' }
            ]
        },
        {
            label: 'View',
            submenu: [
                { role: 'reload' },
                { role: 'forceReload' },
                { type: 'separator' },
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen' }
            ]
        },
        {
            label: 'Window',
            submenu: [
                { role: 'minimize' },
                { role: 'close' }
            ]
        },
        {
            label: 'Help',
            submenu: [
                {
                    label: 'About Simple Tileset Generator',
                    click: async () => {
                        const { version } = require('./package.json');
                        dialog.showMessageBox(mainWindow, {
                            type: 'info',
                            title: 'About Simple Tileset Generator',
                            message: 'Simple Tileset Generator',
                            detail: `Version ${version}\n\nA tool for creating tilesets.\n\nDesigned by laffan, coded by Claude.`
                        });
                    }
                },
                {
                    label: 'View on GitHub',
                    click: async () => {
                        await shell.openExternal('https://github.com/laffan/simple-tileset-generator');
                    }
                },
                { type: 'separator' },
                {
                    label: 'Toggle Developer Tools',
                    accelerator: process.platform === 'darwin' ? 'Alt+Cmd+I' : 'Ctrl+Shift+I',
                    click: () => {
                        mainWindow.webContents.toggleDevTools();
                    }
                }
            ]
        }
    ];

    // Add macOS specific menu items
    if (process.platform === 'darwin') {
        template.unshift({
            label: app.name,
            submenu: [
                { role: 'about' },
                { type: 'separator' },
                { role: 'services' },
                { type: 'separator' },
                { role: 'hide' },
                { role: 'hideOthers' },
                { role: 'unhide' },
                { type: 'separator' },
                { role: 'quit' }
            ]
        });

        // Window menu
        template[4].submenu = [
            { role: 'close' },
            { role: 'minimize' },
            { role: 'zoom' },
            { type: 'separator' },
            { role: 'front' }
        ];
    }

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

    // Handle external links
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });

    // Emitted when the window is closed
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
    createWindow();

    // On macOS, re-create window when dock icon is clicked and no windows are open
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
