import Store from 'electron-store';
import {
    fetchWinDays as fetchWinDaysRaw,
    fetchHeroStats as fetchHeroStatsRaw,
    getAllHeroes as fetchAllHeroesRaw,
} from './stratzApi.js';

const cache = new Store({
    name: 'stratzcache',
});

const getDateSuffix = () => new Date().toISOString().slice(2, 10).replace(/-/g, '');

const buildDailyCacheKey = (baseKey) => `${baseKey}:${getDateSuffix()}`;

const hasData = (value) => {
    if (!value) return false;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object') return Object.keys(value).length > 0;
    return true;
};

async function getCachedResult(baseKey, fetcher, fallbackFactory) {
    const cacheKey = buildDailyCacheKey(baseKey);
    const cachedDailyValue = cache.get(cacheKey);
    if (cachedDailyValue) return cachedDailyValue;

    try {
        const freshValue = await fetcher();
        if (hasData(freshValue)) {
            cache.set(cacheKey, freshValue);
            cache.set(baseKey, freshValue);
            return freshValue;
        }
    } catch (error) {
        console.error(`Error fetching ${baseKey}, falling back to cache:`, error);
    }

    const fallback = cache.get(baseKey);
    if (fallback) return fallback;

    return fallbackFactory();
}

export async function getWinDays(bracketId, position, apiKey) {
    const baseCacheKey = `fetchWinDays:${bracketId}:${position}`;
    return getCachedResult(
        baseCacheKey,
        async () => {
            const response = (await fetchWinDaysRaw(bracketId, position, apiKey)) || [];
            return response.reduce((acc, item) => {
                acc[item.heroId] = {
                    matchCount: item.matchCount,
                    winCount: item.winCount,
                };
                return acc;
            }, {});
        },
        () => ({})
    );
}

export async function getHeroStats(playerId, position, apiKey) {
    const baseCacheKey = `fetchHeroStats:${playerId}:${position}`;
    return getCachedResult(
        baseCacheKey,
        async () => {
            const response = (await fetchHeroStatsRaw(playerId, position, apiKey)) || [];
            return response.reduce((acc, item) => {
                acc[item.heroId] = {
                    my_matchCount: item.matchCount,
                    my_winrate: item.matchCount ? parseFloat(item.winCount / item.matchCount).toFixed(3) : '0.000',
                    my_imp: item.imp,
                };
                return acc;
            }, {});
        },
        () => ({})
    );
}

export async function getAllHeroes(apiKey) {
    const baseCacheKey = 'getALlHeroes';
    return getCachedResult(
        baseCacheKey,
        async () => (await fetchAllHeroesRaw(apiKey)) || [],
        () => []
    );
}

export default {
    getWinDays,
    getHeroStats,
    getAllHeroes,
};
