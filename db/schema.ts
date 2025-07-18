import { sql } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'

/** 动漫列表数据表 */
export const animeTable = sqliteTable('anime', {
    id: integer('id').primaryKey({ autoIncrement: true }).notNull(),
    name: text('name').notNull(),
    currentEpisode: integer('current_episode').notNull(),
    totalEpisode: integer('total_episode').notNull(),
    cover: text('cover').notNull(),
    /** unix时间戳 */
    createdAt: integer('created_at')
        .notNull()
        .default(sql`(unixepoch())`),
    /** unix时间戳 */
    firstEpisodeTimestamp: integer('first_episode_timestamp').notNull(),
    /** unix时间戳 */
    lastEpisodeTimestamp: integer('last_episode_timestamp').notNull(),
})

/** 动漫更新表数据表 */
export const scheduleTable = sqliteTable('schdule', {
    id: integer('id').primaryKey({ autoIncrement: true }).notNull(),
    animeId: integer('anime_id')
        .notNull()
        .references(() => animeTable.id, { onDelete: 'cascade' }),
})

/** 动漫即将更新表数据表 */
export const upcomingTable = sqliteTable('upcoming', {
    id: integer('id').primaryKey({ autoIncrement: true }).notNull(),
    animeId: integer('anime_id')
        .notNull()
        .references(() => animeTable.id, { onDelete: 'cascade' }),
})

/** 日历存储表 */
export const calendarTable = sqliteTable('calendar', {
    id: integer('id').primaryKey({ autoIncrement: true }).notNull(),
    animeId: integer('anime_id')
        .notNull()
        .references(() => animeTable.id, { onDelete: 'cascade' }),
    calendarId: text('calendar_id').notNull(),
})

// 生成 Zod 验证模式
export const insertAnimeSchema = createInsertSchema(animeTable, {
    currentEpisode: schema => schema.int().gte(0),
    createdAt: schema => schema.int().gte(0),
    firstEpisodeTimestamp: schema => schema.int().gte(0),
    lastEpisodeTimestamp: schema => schema.int().gte(0),
})

export const selectAnimeSchema = createSelectSchema(animeTable)
