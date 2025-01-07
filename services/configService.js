import fs from 'fs';
import path from 'path';
import {app} from 'electron';

export default {
    getPath() {
        if(app) {
            return app.getPath('userData');
        }
    },

    getConfig() {
        const configPath = path.join(this.getPath(), 'config.json');
        return fs.existsSync(configPath) ? JSON.parse(fs.readFileSync(configPath, 'utf-8')) : {};
    },

    setConfig(config) {
        const configPath = path.join(this.getPath(), 'config.json');
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    }
}