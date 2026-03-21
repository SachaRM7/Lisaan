// src/db/local.ts
// Couche d'accès à la base SQLite locale (offline-first)

import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

/**
 * Ouvre (ou crée) la base SQLite locale.
 * Appelé une seule fois au démarrage de l'app.
 */
export async function openLocalDB(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('lisaan.db');
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');
  return db;
}

/**
 * Retourne l'instance de la base SQLite.
 * Lève une erreur si la base n'a pas été ouverte.
 */
export function getLocalDB(): SQLite.SQLiteDatabase {
  if (!db) throw new Error('Local DB not initialized — call openLocalDB() first');
  return db;
}
