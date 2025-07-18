import { getAnime } from '@/api'
import type { ExtractTablesWithRelations } from 'drizzle-orm'
import type { SQLiteTransaction } from 'drizzle-orm/sqlite-core'
import type { SQLiteRunResult } from 'expo-sqlite'

export type TTx = SQLiteTransaction<
    'sync',
    SQLiteRunResult,
    Record<string, never>,
    ExtractTablesWithRelations<Record<string, never>>
>

export type TAnimeList = Awaited<ReturnType<typeof getAnime>>
