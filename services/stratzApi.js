const STRATZ_GRAPHQL_URL = 'https://api.stratz.com/graphql';

const defaultHeaders = (apiKey) => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
});

async function executeQuery(query, apiKey) {
    const response = await fetch(STRATZ_GRAPHQL_URL, {
        method: 'POST',
        headers: defaultHeaders(apiKey),
        body: JSON.stringify({ query }),
    });

    if (!response.ok) {
        console.log('Stratz API response status:', response.statusText);
        return [];
    }

    return response.json();
}

export const fetchWinDays = async (bracketId, position, apiKey) => {
    const positionPart = position ? `positionIds: [${position}],` : '';
    const query = `
        {
            heroStats {
                winDay(
                    take: 7,
                    ${positionPart}
                    bracketIds: [${bracketId}],
                    gameModeIds: [ALL_PICK_RANKED]
                ) {
                    heroId
                    matchCount
                    winCount
                }
            }
        }
    `;

    const { data } = await executeQuery(query, apiKey);
    return data?.heroStats?.winDay ?? [];
};

export const fetchHeroStats = async (playerId, position, apiKey) => {
    const sixMonthsAgo = Math.floor(new Date().setMonth(new Date().getMonth() - 6) / 1000);
    const positionPart = position ? `positionIds: [${position}],` : '';
    const query = `
        {
            player(steamAccountId: ${playerId}) {
                heroesPerformance(
                    request: {
                        ${positionPart}
                        startDateTime: ${sixMonthsAgo},
                        take: 5000
                    },
                    take: 150
                ) {
                    heroId
                    winCount
                    matchCount
                    imp
                }
            }
        }
    `;

    const { data } = await executeQuery(query, apiKey);
    return data?.player?.heroesPerformance ?? [];
};

export const getAllHeroes = async (apiKey) => {
    const query = `
        {
            heroStats {
                stats {
                    heroId
                }
            }
        }
    `;

    const { data } = await executeQuery(query, apiKey);
    return data?.heroStats?.stats?.map((hero) => hero.heroId) ?? [];
};
