const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');
const ipcHandlers = require('./ipc/ipcHandlers');

if (require('electron-squirrel-startup')) return;

const createWindow = () => {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
    });
    win.loadFile('./src/index.html');
};

app.whenReady().then(async () => {
    if (process.argv.includes('--silent')) {
        console.log('start generate');
        await require('./services/hudService').generate();
        console.log('start generated');
        app.quit();
        return;
    }

    ipcHandlers.registerHandlers(ipcMain);
    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
