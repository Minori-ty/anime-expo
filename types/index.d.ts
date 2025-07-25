import { getAnime } from '@/api'
import type { ExtractTablesWithRelations } from 'drizzle-orm'
import type { SQLiteTransaction } from 'drizzle-orm/sqlite-core'
import type { SQLiteRunResult } from 'expo-sqlite'
import { ZodArray, ZodBoolean, ZodDate, ZodNumber, ZodString, ZodTypeAny, ZodUnion } from 'zod'

export type TTx = SQLiteTransaction<
    'sync',
    SQLiteRunResult,
    Record<string, never>,
    ExtractTablesWithRelations<Record<string, never>>
>

export type TAnimeList = Awaited<ReturnType<typeof getAnime>>

/** 对象转ZodType */
export type ToZodType<T> = {
    [K in keyof T]: T[K] extends number
        ? ZodNumber
        : T[K] extends string
          ? ZodString
          : T[K] extends boolean
            ? ZodBoolean
            : T[K] extends Date
              ? ZodDate
              : T[K] extends (infer U)[]
                ? ZodArray<EnsureZodType<ToZodType<U>>>
                : T[K] extends object
                  ? ToZodType<T[K]>
                  : T[K] extends infer A | infer B
                    ? ZodUnion<[EnsureZodType<ToZodType<A>>, EnsureZodType<ToZodType<B>>]>
                    : ZodTypeAny
}

// 辅助类型：确保类型符合 ZodTypeAny 约束
type EnsureZodType<T> = T extends ZodTypeAny ? T : never

export interface LocalFile {
    id: string
    name: string
    size: number
    createdAt: string
    type: 'export' | 'import'
}

export interface AnimeEvent {
    id: string
    title: string
    episode: number
    airDate: string
    isRegistered: boolean
    description?: string
}

export interface AppData {
    animeEvents: AnimeEvent[]
    settings: {
        notifications: boolean
        autoSync: boolean
    }
    lastUpdated: string
}
