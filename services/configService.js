const fs = require('fs');
const path = require('path');
const { app } = require('electron');

function getConfig() {
    const configPath = path.join(app.getPath('userData'), 'config.json');
    return fs.existsSync(configPath) ? JSON.parse(fs.readFileSync(configPath)) : {};
}

function setConfig(config) {
    const configPath = path.join(app.getPath('userData'), 'config.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

module.exports = { getConfig, setConfig };
