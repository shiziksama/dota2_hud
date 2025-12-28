import { app, BrowserWindow, ipcMain, Notification } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import ipcHandlers from './ipc/ipcHandlers.js';
import hudService from './services/hudService.js';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// DYDæ¥?DæDý¥-¥?D§Dø D'D¯¥? Electron Squirrel Startup
if (process.argv.some(arg => arg.includes('--squirrel'))) {
    process.exit(0);
}

// D¥ŸD«D§¥+¥-¥? D'D¯¥? ¥?¥,DýD_¥?DæD«D«¥? Dý¥-D§D«Dø
const createWindow = () => {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.resolve(__dirname, 'preload.js'),
        },
    });
    //win.setMenuBarVisibility(false);
    win.maximize();

    const devServerUrl = process.env.VITE_DEV_SERVER_URL;
    if (devServerUrl) {
        win.loadURL(devServerUrl);
        return;
    }

    const rendererIndexPath = path.join(app.getAppPath(), 'dist', 'renderer', 'index.html');
    if (fs.existsSync(rendererIndexPath)) {
        win.loadFile(rendererIndexPath);
    } else {
        const fallbackPath = path.join(__dirname, 'src', 'index.html');
        win.loadFile(fallbackPath);
    }
};

// DzDñ¥?D_DñD§Dø D¨D_D'¥-D1 Electron
app.whenReady().then(async () => {
    if (process.argv.includes('--silent')) {
        console.log('start generate');
        await hudService.generateUserHuds();
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
