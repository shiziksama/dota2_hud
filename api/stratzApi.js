const fetchWinDays = async (bracketId, position, apiKey) => {
    try {

        const requestBody = JSON.stringify({
            query: `
                     {
            heroStats {
                winDay(
                    take: 7,
                    positionIds: [${position}],
                    bracketIds:[${bracketId}]
                    gameModeIds: [ALL_PICK_RANKED]
                ) {
                    heroId,
                    matchCount,
                    winCount,
                }
            }
        }
                `,
        });

        const response = await fetch('https://api.stratz.com/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: requestBody,
        });
        const {data} = await response.json();
        // Формуємо об'єкт зі статистикою героїв
        return (data?.heroStats?.winDay || []).reduce((acc, item) => {
            acc[item.heroId] = {
                matchCount: item.matchCount,
                winCount: item.winCount,
            };
            return acc;
        }, {});
    } catch (error) {
        console.error(`Помилка у fetchWinDays (bracketId: ${bracketId}, position: ${position}):`, error);
        return {};
    }
};

const fetchHeroStats = async (playerId, position, apiKey) => {
    try {
        const sixMonthsAgo = Math.floor(new Date().setMonth(new Date().getMonth() - 6) / 1000);
        const requestBody = JSON.stringify({
            query: `
                     {
          player(steamAccountId: ${playerId}) {
            heroesPerformance(request: {positionIds: [${position}],  startDateTime:${sixMonthsAgo},take:5000}, take: 150) {
              heroId
              winCount
              matchCount
              imp
            }
          }
        }
                `,
        });
        const response = await fetch('https://api.stratz.com/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: requestBody,
        });
        const {data} = await response.json();

        // Формуємо об'єкт зі статистикою гравця
        return (data?.player?.heroesPerformance || []).reduce((acc, item) => {
            acc[item.heroId] = {
                my_matchCount: item.matchCount,
                my_winrate: parseFloat(item.winCount / item.matchCount).toFixed(3),
                my_imp: item.imp,
            };
            return acc;
        }, {});
    } catch (error) {
        console.error(`Помилка у fetchHeroStats (playerId: ${playerId}, position: ${position}):`, error);
        return {};
    }
};


// Отримати всі ID героїв через API Stratz
const getAllHeroes = async (apiKey) => {
    const response = await fetch('https://api.stratz.com/graphql', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({query: "{heroStats{stats{heroId}}}"}),
    });
    const data = await response.json();
    return data?.data?.heroStats?.stats.map(hero => hero.heroId) || [];
};

module.exports = {getAllHeroes, fetchHeroStats, fetchWinDays};

