import { db } from '@/db'
import { animeTable, calendarTable, scheduleTable } from '@/db/schema'
import { TTx } from '@/types'
import { deleteCalendarEvent } from '@/utils/calendar'
import { getStatus } from '@/utils/time'
import dayjs from 'dayjs'
import { eq } from 'drizzle-orm'

/**
 * 查询所有动漫
 */
export async function getAnime() {
    const list = await db.select().from(animeTable)

    return list.map(item => {
        const { id, name, currentEpisode, totalEpisode, cover, firstEpisodeTimestamp, lastEpisodeTimestamp } = item
        const updateWeekday = dayjs.unix(firstEpisodeTimestamp).isoWeekday()
        const firstEpisodeYYYYMMDDHHmm = dayjs.unix(firstEpisodeTimestamp).format('YYYY-MM-DD HH:mm')
        const lastEpisodeYYYYMMDDHHmm = dayjs.unix(lastEpisodeTimestamp).format('YYYY-MM-DD HH:mm')
        const status = getStatus(firstEpisodeYYYYMMDDHHmm, lastEpisodeYYYYMMDDHHmm)

        return {
            id,
            name,
            currentEpisode,
            totalEpisode,
            cover,
            updateWeekday,
            firstEpisodeYYYYMMDDHHmm,
            lastEpisodeYYYYMMDDHHmm,
            status,
            updateTimeHHmm: dayjs(firstEpisodeYYYYMMDDHHmm).format('HH:mm'),
        }
    })
}

export async function deleteAnimeById(id: number) {
    return await db.transaction(async tx => {
        await tx.delete(animeTable).where(eq(animeTable.id, id))
        await deleteCalendarByAnimeId(tx, id)
    })
}

/**
 * 获取动漫更新列表
 */
export async function getSchedule() {
    const list = await db.select().from(scheduleTable).leftJoin(animeTable, eq(scheduleTable.animeId, animeTable.id))
    const animeList = list.filter(item => item.anime)
    const res = animeList.map(item => {
        return item.anime
    })
    return res
        .filter(item => item !== null)
        .map(item => {
            const { id, name, currentEpisode, totalEpisode, cover, firstEpisodeTimestamp, lastEpisodeTimestamp } = item
            const updateWeekday = dayjs.unix(firstEpisodeTimestamp).isoWeekday()
            const firstEpisodeYYYYMMDDHHmm = dayjs.unix(firstEpisodeTimestamp).format('YYYY-MM-DD HH:mm')
            const lastEpisodeYYYYMMDDHHmm = dayjs.unix(lastEpisodeTimestamp).format('YYYY-MM-DD HH:mm')
            const status = getStatus(firstEpisodeYYYYMMDDHHmm, lastEpisodeYYYYMMDDHHmm)

            return {
                id,
                name,
                currentEpisode,
                totalEpisode,
                cover,
                updateWeekday,
                firstEpisodeYYYYMMDDHHmm,
                status,
                lastEpisodeYYYYMMDDHHmm,
                updateTimeHHmm: dayjs(firstEpisodeYYYYMMDDHHmm).format('HH:mm'),
            }
        })
}

export async function deleteCalendarByAnimeId(tx: TTx, animeId: number): Promise<boolean> {
    const result = await tx.select().from(calendarTable).where(eq(calendarTable.animeId, animeId))
    if (result.length === 0) {
        console.log('该动漫没有绑定日历表数据，有可能是已经完结的动漫')
        return false
    }
    const flag = await deleteCalendarEvent(result[0].calendarId)
    if (!flag) {
        console.log('删除日历时间失败，有可能被用户主动删除了')
    }
    await tx.delete(calendarTable).where(eq(calendarTable.animeId, animeId))
    return true
}
