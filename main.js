import { app, BrowserWindow, ipcMain, Notification } from 'electron';
import path from 'node:path';
import ipcHandlers from './ipc/ipcHandlers.js';
import hudService from './services/hudService.js';
import { fileURLToPath } from 'url';


// Перевірка для Electron Squirrel Startup
if (process.argv.some(arg => arg.includes('--squirrel'))) {
    process.exit(0);
}

// Функція для створення вікна
const createWindow = () => {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'preload.js'),
        },
    });
    win.loadFile('./src/index.html');
};

// Обробка подій Electron
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
