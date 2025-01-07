import fs from 'fs';
import path from 'path';

export function listDirectories(dirPath) {
    return fs.readdirSync(dirPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
}

export function getHudPath(userid) {
    const steamFolder = getSteamFolder();
    if (!steamFolder) throw new Error('Steam folder not found.');
    return path.join(steamFolder, `${userid}/570/remote/cfg/hero_grid_config.json`);
}

export function getSteamFolder() {
    const steamPaths = [
        'C:/Program Files (x86)/Steam/userdata',
        '/mnt/c/Program Files (x86)/Steam/userdata',
    ];
    return steamPaths.find(fs.existsSync) || null;
}
