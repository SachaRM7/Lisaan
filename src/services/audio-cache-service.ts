// src/services/audio-cache-service.ts

import * as FileSystem from 'expo-file-system';
import { getLocalDB } from '../db/local';

const AUDIO_DIR = FileSystem.documentDirectory + 'audio/';

async function ensureAudioDir() {
  const info = await FileSystem.getInfoAsync(AUDIO_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(AUDIO_DIR, { intermediates: true });
  }
}

function urlToFilename(url: string): string {
  return url.split('/').pop()?.replace(/[^a-zA-Z0-9._-]/g, '_') ?? 'audio.mp3';
}

export async function getLocalAudioPath(remoteUrl: string): Promise<string | null> {
  const db = getLocalDB();
  const cached = await db.getFirstAsync<{ local_path: string }>(
    'SELECT local_path FROM audio_cache WHERE remote_url = ?',
    [remoteUrl]
  );
  if (!cached) return null;

  const info = await FileSystem.getInfoAsync(cached.local_path);
  if (!info.exists) {
    await db.runAsync('DELETE FROM audio_cache WHERE remote_url = ?', [remoteUrl]);
    return null;
  }
  return cached.local_path;
}

export async function downloadAndCacheAudio(remoteUrl: string): Promise<string> {
  const cached = await getLocalAudioPath(remoteUrl);
  if (cached) return cached;

  await ensureAudioDir();
  const filename = urlToFilename(remoteUrl);
  const localPath = AUDIO_DIR + filename;

  const result = await FileSystem.downloadAsync(remoteUrl, localPath);
  if (result.status !== 200) throw new Error(`Audio download failed: ${result.status}`);

  const db = getLocalDB();
  const cacheId = `audio_${filename}`;
  await db.runAsync(
    `INSERT OR REPLACE INTO audio_cache (id, remote_url, local_path, downloaded_at, file_size)
     VALUES (?, ?, ?, ?, ?)`,
    [
      cacheId,
      remoteUrl,
      localPath,
      Date.now(),
      result.headers['Content-Length'] ? parseInt(result.headers['Content-Length']) : null,
    ]
  );

  return localPath;
}

export async function prefetchAudio(): Promise<void> {
  const db = getLocalDB();
  type AudioRow = { audio_url: string };

  const results = await Promise.all([
    db.getAllAsync<AudioRow>('SELECT audio_url FROM letters WHERE audio_url IS NOT NULL'),
    db.getAllAsync<AudioRow>('SELECT audio_url FROM words WHERE audio_url IS NOT NULL'),
    db.getAllAsync<AudioRow>('SELECT audio_url FROM sentences WHERE audio_url IS NOT NULL'),
  ]);

  const allUrls = results.flat().map(r => r.audio_url);

  for (const url of allUrls) {
    try {
      await downloadAndCacheAudio(url);
    } catch (e) {
      console.warn('[prefetchAudio] failed for', url, e);
    }
  }
}

export async function clearAudioCache(): Promise<void> {
  const db = getLocalDB();
  const rows = await db.getAllAsync<{ local_path: string }>('SELECT local_path FROM audio_cache');
  for (const row of rows) {
    await FileSystem.deleteAsync(row.local_path, { idempotent: true });
  }
  await db.runAsync('DELETE FROM audio_cache');
}
