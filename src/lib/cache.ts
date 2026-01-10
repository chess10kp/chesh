import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_DIR = path.join(os.homedir(), '.check.sh', 'cache');

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
