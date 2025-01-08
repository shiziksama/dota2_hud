import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';

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
    const platform = os.platform();
    let steamPaths = [];

    if (platform === 'win32') {
        // Додаємо стандартні шляхи для Windows
        steamPaths = [
            'C:/Program Files (x86)/Steam/userdata',
            'C:/Program Files/Steam/userdata',
            '/mnt/c/Program Files (x86)/Steam/userdata',
        ];

        // Спроба знайти шлях до Steam через реєстр
        try {
            const regQuery = execSync(
                'reg query "HKCU\\Software\\Valve\\Steam" /v SteamPath',
                { encoding: 'utf-8' }
            );
            const match = regQuery.match(/SteamPath\s+REG_SZ\s+(.+)/);
            if (match && match[1]) {
                steamPaths.push(`${match[1].trim()}/userdata`);
            }
        } catch (err) {
            console.warn('Не вдалося знайти шлях Steam через реєстр:', err.message);
        }
    } else if (platform === 'linux') {
        // Додаємо стандартні шляхи для Linux
        steamPaths = [
            '/mnt/c/Program Files (x86)/Steam/userdata',
            `${os.homedir()}/.steam/steam/userdata`,
            `${os.homedir()}/.local/share/Steam/userdata`,
        ];
    } else if (platform === 'darwin') {
        // Додаємо стандартний шлях для macOS
        steamPaths = [`${os.homedir()}/Library/Application Support/Steam/userdata`];
    }

    // Повертаємо перший існуючий шлях
    return steamPaths.find(fs.existsSync) || null;
}
