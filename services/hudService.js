import fs from 'fs';
import * as pathUtils from '../utils/pathUtils.js';
import * as stratzApi from '../api/stratzApi.js';
import configService from '../services/configService.js';
import {Notification} from "electron";

export async function getHeroIds(playerId, position, bracketIds, count, apiKey) {
    const response = await calculateHeroScores(playerId, position, bracketIds, apiKey);
    return count > 0 ? response.slice(0, count) : response;
}

export async function calculateHeroScores(playerId, position, bracketIds, apiKey) {
    const brackets = {};

    // Отримання статистики для кожного рангу
    for (const name of bracketIds) {
        brackets[name] = await stratzApi.fetchWinDays(name, position, apiKey);
    }

    let result = {};

    // Об'єднання статистики з усіх рангу
    for (const bracket of Object.values(brackets)) {
        for (const [heroId, heroStats] of Object.entries(bracket)) {
            result[heroId] = result[heroId] || { matchCount: 0, winCount: 0, hero_id: parseInt(heroId) };
            result[heroId].matchCount += heroStats.matchCount;
            result[heroId].winCount += heroStats.winCount;
            result[heroId].winrate = parseFloat((result[heroId].winCount / result[heroId].matchCount).toFixed(3));
        }
    }

    // Додавання статистики гравця
    const heroStats = await stratzApi.fetchHeroStats(playerId, position, apiKey);
    for (const [heroId, heroStat] of Object.entries(heroStats)) {
        result[heroId] = { ...result[heroId], ...heroStat };
    }

    // Розрахунок середнього впливу (impact)
    const totalMyMatchCount = Object.values(result).reduce((sum, hero) => sum + (hero.my_matchCount || 0), 0);
    const avgImp = totalMyMatchCount !== 0
        ? Object.values(result).reduce((sum, hero) => {
        return sum + (hero.my_imp || 0) * (hero.my_matchCount || 0);
    }, 0) / totalMyMatchCount
        : 0;

    // Мінімальна кількість матчів
    const totalMatchCount = Object.values(result).reduce((sum, hero) => sum + hero.matchCount, 0);
    const minMatchCount = Math.round(totalMatchCount / 10 / 40);

    // Обробка кожного героя
    result = Object.values(result).map(hero => {
        const oneBadGame = hero.my_imp < 0 && hero.my_matchCount < 3;
        let myScore = 1;

        if (hero.my_imp && !oneBadGame) {
            myScore = 1 + (hero.my_imp - avgImp) / 100 / 2;
            if (hero.my_matchCount > 3) {
                myScore *= 1 + (hero.my_winrate - 0.5) / 2;
            }
        }

        hero.score = myScore * hero.winrate;

        return hero;
    }).filter(hero => hero.my_imp || hero.matchCount > minMatchCount);

    // Сортування героїв за рейтингом
    result.sort((a, b) => b.score - a.score);

    // Повернення ID героїв
    return result.map(hero => hero.hero_id);
}

export async function generateHud(userid, base, config, apiKey) {
    let allHeroes = await stratzApi.getAllHeroes(apiKey);
    let leftId = -1;

    for (const [key, value] of Object.entries(base)) {
        base[key]['x_position'] = Math.round(value.x_position / 10) * 10;
        base[key]['y_position'] = Math.round(value.y_position / 10) * 10;
        base[key]['width'] = Math.round(value.width / 10) * 10;
        base[key]['height'] = Math.round(value.height / 10) * 10;

        if (!config[value.category_name]) continue;

        const curConfig = config[value.category_name];
        if (curConfig.dont_change) continue;

        if (curConfig.heroes_left) {
            leftId = key;
            continue;
        }

        base[key]['hero_ids'] = await getHeroIds(userid, curConfig.position, curConfig.bracket_ids, curConfig.count, apiKey);
        allHeroes = allHeroes.filter(x => !base[key]['hero_ids'].includes(x));
    }

    base[leftId]['hero_ids'] = allHeroes.filter(Boolean);
    return base;
}

export async function generateUserHuds() {
    const config = configService.getConfig();

    for (const [userid, hudConfig] of Object.entries(config)) {
        if (userid === 'apiKey') continue;

        const hudPath = pathUtils.getHudPath(userid);
        const huds = JSON.parse(fs.readFileSync(hudPath, 'utf-8'));

        for (const [key, value] of Object.entries(huds.configs)) {
            if (hudConfig[value.config_name]) {
                huds.configs[key].categories = await generateHud(userid, value.categories, hudConfig[value.config_name], config.apiKey);
            }
        }

        fs.writeFileSync(hudPath, JSON.stringify(huds, null, 2));
    }

    console.log('HUDs written successfully.');
    new Notification({
        title: 'HUD Generator',
        body: 'All HUDs generated successfully!',
    }).show();
}

export async function getHud(userid) {
    const hudPath = pathUtils.getHudPath(userid);
    return JSON.parse(fs.readFileSync(hudPath, 'utf-8'));
}

export default {
    generateUserHuds,
    getHud
};