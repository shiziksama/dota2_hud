import https from 'node:https';
import { URL } from 'node:url';

const STRATZ_GRAPHQL_URL = new URL('https://api.stratz.com/graphql');

const defaultHeaders = (apiKey, contentLength) => ({
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Content-Type': 'application/json',
    'Host': STRATZ_GRAPHQL_URL.hostname,
    'Origin': 'https://stratz.com',
    'Pragma': 'no-cache',
    'Referer': 'https://stratz.com/',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-site',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    ...(contentLength ? { 'Content-Length': contentLength.toString() } : {}),
    'Authorization': `Bearer ${(apiKey || '').trim()}`,
});

const parseResponseBody = (body) => {
    if (!body) return { data: null };
    try {
        return JSON.parse(body);
    } catch (error) {
        console.error('Failed to parse Stratz response JSON:', error);
        return { data: null };
    }
};

async function executeQuery(query, apiKey) {
    if (!apiKey) {
        console.error('Stratz API key is missing. Fill it in the settings before generating HUDs.');
        return { data: null };
    }

    const payload = JSON.stringify({ query });
    const headers = defaultHeaders(apiKey, Buffer.byteLength(payload));

    const requestOptions = {
        method: 'POST',
        protocol: STRATZ_GRAPHQL_URL.protocol,
        hostname: STRATZ_GRAPHQL_URL.hostname,
        port: STRATZ_GRAPHQL_URL.port || undefined,
        path: STRATZ_GRAPHQL_URL.pathname,
        headers,
    };

    return new Promise((resolve) => {
        const req = https.request(requestOptions, (res) => {
            let responseBody = '';
            res.setEncoding('utf8');

            res.on('data', (chunk) => {
                responseBody += chunk;
            });

            res.on('end', () => {
                if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(parseResponseBody(responseBody));
                    return;
                }

                console.error('Stratz API HTTP error:', res.statusCode, res.statusMessage);
                console.error('Response body:', responseBody);
                resolve({ data: null });
            });
        });

        req.on('error', (error) => {
            console.error('Stratz API request failed:', error);
            resolve({ data: null });
        });

        req.write(payload);
        req.end();
    });
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
