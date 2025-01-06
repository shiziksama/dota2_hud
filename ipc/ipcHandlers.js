const { listDirectories, getSteamFolder } = require('../utils/pathUtils');
const configService = require('../services/configService');
const hudService = require('../services/hudService');

function registerHandlers(ipcMain) {
    ipcMain.handle('generate', hudService.generateUserHuds);
    ipcMain.handle('userlist', () => listDirectories(getSteamFolder()));
    ipcMain.handle('getHud', (event, userid) => hudService.getHud(userid));
    ipcMain.handle('getConfig', configService.getConfig);
    ipcMain.handle('setConfig', (event, config) => configService.setConfig(config));
}

module.exports = { registerHandlers };
