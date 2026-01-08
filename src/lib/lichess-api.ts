import { readNdjsonStream } from './ndjson-parser.js';
import { BroadcastRound } from '../types/index.js';

const LICHESS_API_URL = 'https://lichess.org/api';

export async function fetchBroadcasts(token?: string): Promise<any[]> {
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${LICHESS_API_URL}/broadcast`, {
    headers,
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch broadcasts: ${response.status}`);
  }

  const broadcasts: any[] = [];
  await readNdjsonStream(response, (data) => {
    broadcasts.push(data);
  });

  return broadcasts;
}

export async function fetchBroadcastRounds(
  broadcastId: string,
  token?: string
): Promise<BroadcastRound[]> {
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${LICHESS_API_URL}/broadcast/${broadcastId}`, {
    headers,
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch broadcast rounds: ${response.status}`);
  }

  const data = await response.json();
  return data.rounds || [];
}

export async function streamRoundPGN(
  roundId: string,
  onUpdate: (pgn: string) => void,
  token?: string,
  timeoutMs: number = 5000
): Promise<void> {
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${LICHESS_API_URL}/stream/broadcast/round/${roundId}.pgn`;

  const response = await fetch(url, {
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[lichess-api] Error response:', errorText);
    throw new Error(`Failed to stream round PGN: ${response.status} - ${errorText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No reader available');
  }

  const decoder = new TextDecoder();
  let buffer = '';
  let totalBytes = 0;
  let timeoutId: NodeJS.Timeout | null = null;

  try {
    const timeoutPromise = new Promise<void>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error('Stream timeout'));
      }, timeoutMs);
    });

    await Promise.race([
      (async () => {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          totalBytes += value.length;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.trim()) {
              onUpdate(line);
            }
          }
        }

        if (buffer.trim()) {
          onUpdate(buffer);
        }
      })(),
      timeoutPromise
    ]);
  } catch (err: any) {
    if (err.message === 'Stream timeout') {
      if (buffer.trim()) {
        onUpdate(buffer);
      }
    } else {
      throw err;
    }
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    reader.releaseLock();
  }
}
