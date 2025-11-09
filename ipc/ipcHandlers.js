import { app } from 'electron';
import { listDirectories, getSteamFolder } from '../utils/pathUtils.js';
import configService from '../services/configService.js';
import hudService from '../services/hudService.js';

export function registerHandlers(ipcMain) {
    ipcMain.handle('generate', hudService.generateUserHuds);
    ipcMain.handle('userlist', () => listDirectories(getSteamFolder()));
    ipcMain.handle('getHud', (event, userid) => hudService.getHud(userid));
    ipcMain.handle('getConfig', () => configService.getConfig());
    ipcMain.handle('setConfig', (event, config) => configService.setConfig(config));
    ipcMain.handle('getAppVersion', () => app.getVersion());
}

export default {
    registerHandlers
}
