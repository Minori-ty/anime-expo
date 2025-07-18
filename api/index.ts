import { db } from '@/db'
import { animeTable, scheduleTable } from '@/db/schema'
import { getStatus } from '@/utils/time'
import dayjs from 'dayjs'
import { eq } from 'drizzle-orm'

/**
 * 查询所有动漫
 * @returns
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
