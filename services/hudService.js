const fs = require('fs');
const pathUtils = require('../utils/pathUtils');
const stratzApi = require('../api/stratzApi');
const configService = require('../services/configService');

async function generateHud(userid, base, config) {
    let allHeroes = await stratzApi.getAllHeroes();
    let leftId = -1;

    for (const [key, value] of Object.entries(base)) {
        base[key]['x_position']=Math.round(value.x_position/10)*10;
        base[key]['y_position']=Math.round(value.y_position/10)*10;
        base[key]['width']=Math.round(value.width/10)*10;
        base[key]['height']=Math.round(value.height/10)*10;
        if (!config[value.category_name]) continue;

        const curConfig = config[value.category_name];
        if (curConfig.dont_change) continue;

        if (curConfig.heroes_left) {
            leftId = key;
            continue;
        }

        base[key]['hero_ids'] = await stratzApi.getHeroIds(userid, curConfig.position, curConfig.bracket_ids, curConfig.count);
        allHeroes = allHeroes.filter(x => !base[key]['hero_ids'].includes(x));
    }

    base[leftId]['hero_ids'] = allHeroes.filter(Boolean);
    return base;
}

async function generateUserHuds() {
    const config=configService.getConfig();
    for (const [userid, hudConfig] of Object.entries(config)) {
        console.log(userid);
        console.log(hudConfig);

        const hudPath = pathUtils.getHudPath(userid);
        const huds = JSON.parse(fs.readFileSync(hudPath));

        for (const [key, value] of Object.entries(huds.configs)) {
            if (hudConfig[value.config_name]) {
                huds.configs[key].categories = await generateHud(userid, value.categories, hudConfig[value.config_name]);
            }
        }

        fs.writeFileSync(hudPath, JSON.stringify(huds, null, 2));
    }
    console.log('HUDs written successfully.');
}
async function getHud(userid){
    const hudPath = pathUtils.getHudPath(userid);
    return JSON.parse(fs.readFileSync(hudPath));
}

module.exports = { generateHud, generateUserHuds, getHud };
