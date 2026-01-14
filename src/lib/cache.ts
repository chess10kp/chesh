import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_DIR = path.join(os.homedir(), '.chesh', 'cache');

export async function getCache<T>(
  key: string,
  maxAge: number
): Promise<T | null> {
  try {
    const cachePath = path.join(CACHE_DIR, `${key}.json`);
    const data = await fs.readFile(cachePath, 'utf-8');
    const entry: CacheEntry<T> = JSON.parse(data);

    const age = Date.now() - entry.timestamp;
    if (age > maxAge) {
      return null;
    }

    return entry.data;
  } catch {
    return null;
  }
}

export async function setCache<T>(key: string, data: T): Promise<void> {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
    };
    const cachePath = path.join(CACHE_DIR, `${key}.json`);
    await fs.writeFile(cachePath, JSON.stringify(entry));
  } catch (err) {
    console.error('Cache write error:', err);
  }
}

export async function clearOldCache(maxAge: number): Promise<void> {
  try {
    const files = await fs.readdir(CACHE_DIR);
    for (const file of files) {
      const cachePath = path.join(CACHE_DIR, file);
      const stats = await fs.stat(cachePath);
      const age = Date.now() - stats.mtimeMs;
      if (age > maxAge) {
        await fs.unlink(cachePath);
      }
    }
  } catch (err) {
    console.error('Cache cleanup error:', err);
  }
}

export interface RoundPGNCache {
  roundId: string;
  roundName: string;
  broadcastId: string;
  broadcastName: string;
  pgn: string;
  finishedAt: number;
}

export async function getRoundPGNCache(roundId: string): Promise<RoundPGNCache | null> {
  return getCache<RoundPGNCache>(`round-pgn-${roundId}`, Number.MAX_SAFE_INTEGER);
}

export async function setRoundPGNCache(data: RoundPGNCache): Promise<void> {
  await setCache(`round-pgn-${data.roundId}`, data);
}

export interface TournamentSlugCache {
  [tournamentName: string]: string;
}

export async function getTournamentSlugCache(tournamentName: string): Promise<string | null> {
  const cache = await getCache<TournamentSlugCache>('tournament-slugs', 24 * 60 * 60 * 1000);
  return cache?.[tournamentName] || null;
}

export async function setTournamentSlugCache(tournamentName: string, slug: string): Promise<void> {
  const cache = await getCache<TournamentSlugCache>('tournament-slugs', 24 * 60 * 60 * 1000) || {};
  cache[tournamentName] = slug;
  await setCache('tournament-slugs', cache);
}

import type { Game } from '../types/index.js';

export interface FavoriteGame {
  game: Game;
  savedAt: number;
}

export interface FavoritesCache {
  games: FavoriteGame[];
}

const FAVORITES_CACHE_KEY = 'favorites';

export async function getFavorites(): Promise<FavoritesCache> {
  const cache = await getCache<FavoritesCache>(FAVORITES_CACHE_KEY, Number.MAX_SAFE_INTEGER);
  return cache || { games: [] };
}

export async function addFavorite(game: Game): Promise<boolean> {
  const favorites = await getFavorites();
  const exists = favorites.games.some(f => f.game.id === game.id);
  if (exists) {
    return false;
  }
  favorites.games.push({ game, savedAt: Date.now() });
  await setCache(FAVORITES_CACHE_KEY, favorites);
  return true;
}

export async function removeFavorite(gameId: string): Promise<boolean> {
  const favorites = await getFavorites();
  const initialLength = favorites.games.length;
  favorites.games = favorites.games.filter(f => f.game.id !== gameId);
  if (favorites.games.length < initialLength) {
    await setCache(FAVORITES_CACHE_KEY, favorites);
    return true;
  }
  return false;
}
