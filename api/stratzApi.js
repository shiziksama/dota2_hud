const fetch = require('node-fetch');

async function getHeroIds(playerid, position, bracket_ids, count) {
    let params = new URLSearchParams({
        position: position,
        playerid: playerid,
        format: 'keys',
    });

    bracket_ids.forEach(value => {
        params.append('bracket_id[]', value);
    });

    const response = await fetch(`https://dota2.weblamas.com/?${params.toString()}`)
        .then(response => response.json());
    return response.slice(0, count);
}

async function getAllHeroes() {
    const response = await fetch('https://dota2.weblamas.com/heroes.json')
        .then(response => response.json());
    return Object.keys(response).map(numStr => parseInt(numStr));
}

module.exports = { getHeroIds, getAllHeroes };
