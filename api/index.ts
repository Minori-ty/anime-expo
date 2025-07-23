import { db } from '@/db'
import { animeTable, calendarTable, scheduleTable, upcomingTable } from '@/db/schema'
import { EStatus, EWeekday } from '@/enums'
import { TTx } from '@/types'
import { createCalendarEvent, deleteCalendarEvent } from '@/utils/calendar'
import { getMondayTimestampInThisWeek, getStatus, getSundayTimestampInThisWeek } from '@/utils/time'
import dayjs from 'dayjs'
import { eq } from 'drizzle-orm'

/**
 * 查询所有动漫
 */
export async function getAnime() {
    const list = await db.select().from(animeTable)

    return list.map(item => {
        const { id, name, currentEpisode, totalEpisode, cover, firstEpisodeTimestamp } = item
        const updateWeekday = dayjs.unix(firstEpisodeTimestamp).isoWeekday() as typeof EWeekday.valueType
        const firstEpisodeYYYYMMDDHHmm = dayjs.unix(firstEpisodeTimestamp).format('YYYY-MM-DD HH:mm')
        const lastEpisodeTimestamp = dayjs
            .unix(firstEpisodeTimestamp)
            .add(totalEpisode * 7, 'day')
            .unix()
        const lastEpisodeYYYYMMDDHHmm = dayjs.unix(lastEpisodeTimestamp).format('YYYY-MM-DD HH:mm')
        const status = getStatus(firstEpisodeTimestamp, lastEpisodeTimestamp)

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

export async function getAnimeById(id: number) {
    const list = await db.select().from(animeTable).where(eq(animeTable.id, id))
    if (list.length === 0) {
        return undefined
    }
    const anime = list[0]
    const { name, currentEpisode, totalEpisode, cover, firstEpisodeTimestamp } = anime
    const updateWeekday = dayjs.unix(firstEpisodeTimestamp).isoWeekday() as typeof EWeekday.valueType
    const firstEpisodeYYYYMMDDHHmm = dayjs.unix(firstEpisodeTimestamp).format('YYYY-MM-DD HH:mm')
    const lastEpisodeTimestamp = dayjs
        .unix(firstEpisodeTimestamp)
        .add(totalEpisode * 7, 'day')
        .unix()
    const lastEpisodeYYYYMMDDHHmm = dayjs.unix(lastEpisodeTimestamp).format('YYYY-MM-DD HH:mm')
    const status = getStatus(firstEpisodeTimestamp, lastEpisodeTimestamp)

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
        updateTimeHHmm: dayjs(firstEpisodeYYYYMMDDHHmm).format('YYYY-MM-DD HH:mm'),
    }
}

export async function deleteAnimeById(id: number) {
    return await db.transaction(async tx => {
        await tx.delete(animeTable).where(eq(animeTable.id, id))
        await deleteCalendarByAnimeId(tx, id)
    })
}

interface IInsertAnimeData {
    name: string
    currentEpisode: number
    totalEpisode: number
    cover: string
    firstEpisodeTimestamp: number
}
export async function addAnime(data: IInsertAnimeData) {
    return await db.transaction(async tx => {
        const animeList = await tx.insert(animeTable).values(data).returning()
        if (animeList.length === 0) {
            console.log('添加动漫失败')
            return
        }
        const anime = animeList[0]
        await addScheduleIfNeed(tx, anime.id, data)
        await addToBeUpdatedIfNeed(tx, anime.id, data)
    })
}
interface IUpdateAnime extends IInsertAnimeData {
    id: number
}
export async function updateAnime(data: IUpdateAnime) {
    return await db.transaction(async tx => {
        const { id, name, cover, totalEpisode, currentEpisode, firstEpisodeTimestamp } = data
        const lastEpisodeTimestamp = dayjs
            .unix(firstEpisodeTimestamp)
            .add(totalEpisode * 7, 'day')
            .unix()
        const newStatus = getStatus(firstEpisodeTimestamp, lastEpisodeTimestamp)
        const anime = await getAnimeById(id)
        if (!anime) {
            console.log('此id的动漫不存在')
            return false
        }
        const oldStatus = getStatus(
            dayjs(anime.firstEpisodeYYYYMMDDHHmm).unix(),
            dayjs(anime.lastEpisodeYYYYMMDDHHmm).unix()
        )
        await tx
            .update(animeTable)
            .set({
                name,
                cover,
                totalEpisode,
                currentEpisode,
                firstEpisodeTimestamp,
                createdAt: dayjs().unix(),
            })
            .where(eq(animeTable.id, data.id))
        if (oldStatus === EStatus.completed) {
            if (newStatus === EStatus.completed) {
                await addScheduleIfNeed(tx, data.id, { firstEpisodeTimestamp, totalEpisode, name, currentEpisode })
            }
            if (newStatus === EStatus.serializing) {
                await addScheduleIfNeed(tx, data.id, { firstEpisodeTimestamp, totalEpisode, name, currentEpisode })
            }
            if (newStatus === EStatus.toBeUpdated) {
                await addScheduleIfNeed(tx, data.id, { firstEpisodeTimestamp, totalEpisode, name, currentEpisode })
                await addToBeUpdatedIfNeed(tx, data.id, { firstEpisodeTimestamp, totalEpisode, name, currentEpisode })
            }
        }
        if (oldStatus === EStatus.serializing) {
            await deleteScheduleByAnimeId(tx, data.id)
            if (newStatus === EStatus.completed) {
                await addScheduleIfNeed(tx, data.id, { firstEpisodeTimestamp, totalEpisode, name, currentEpisode })
            }
            if (newStatus === EStatus.serializing) {
                await addScheduleIfNeed(tx, data.id, { firstEpisodeTimestamp, totalEpisode, name, currentEpisode })
            }
            if (newStatus === EStatus.toBeUpdated) {
                await addScheduleIfNeed(tx, data.id, { firstEpisodeTimestamp, totalEpisode, name, currentEpisode })
                await addToBeUpdatedIfNeed(tx, data.id, { firstEpisodeTimestamp, totalEpisode, name, currentEpisode })
            }
        }
        if (oldStatus === EStatus.toBeUpdated) {
            await deleteToBeUpdatedByAnimeId(tx, data.id)
            await deleteScheduleByAnimeId(tx, data.id)
            if (newStatus === EStatus.completed) {
                await addScheduleIfNeed(tx, data.id, { firstEpisodeTimestamp, totalEpisode, name, currentEpisode })
            }
            if (newStatus === EStatus.serializing) {
                await addScheduleIfNeed(tx, data.id, { firstEpisodeTimestamp, totalEpisode, name, currentEpisode })
            }
            if (newStatus === EStatus.toBeUpdated) {
                await addScheduleIfNeed(tx, data.id, { firstEpisodeTimestamp, totalEpisode, name, currentEpisode })
                await addToBeUpdatedIfNeed(tx, data.id, { firstEpisodeTimestamp, totalEpisode, name, currentEpisode })
            }
        }
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
            const { id, name, currentEpisode, totalEpisode, cover, firstEpisodeTimestamp } = item
            const updateWeekday = dayjs.unix(firstEpisodeTimestamp).isoWeekday() as typeof EWeekday.valueType
            const firstEpisodeYYYYMMDDHHmm = dayjs.unix(firstEpisodeTimestamp).format('YYYY-MM-DD HH:mm')
            const lastEpisodeTimestamp = dayjs
                .unix(firstEpisodeTimestamp)
                .add(totalEpisode * 7, 'day')
                .unix()
            const lastEpisodeYYYYMMDDHHmm = dayjs.unix(lastEpisodeTimestamp).format('YYYY-MM-DD HH:mm')
            const status = getStatus(firstEpisodeTimestamp, lastEpisodeTimestamp)

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

/**
 * 如果有，就删除日历事件
 * @param tx
 * @param animeId
 */
export async function deleteCalendarByAnimeId(tx: TTx, animeId: number): Promise<boolean> {
    const result = await tx.select().from(calendarTable).where(eq(calendarTable.animeId, animeId))
    if (result.length === 0) {
        console.log('该动漫没有绑定日历表数据，有可能是已经完结的动漫')
        return false
    }
    const flag = await deleteCalendarEvent(result[0].calendarId)
    if (!flag) {
        console.log('删除日历事件失败，有可能被用户主动删除了')
    }
    await tx.delete(calendarTable).where(eq(calendarTable.animeId, animeId))
    return true
}

interface IAddScheduleIfNeed {
    firstEpisodeTimestamp: number
    totalEpisode: number
    name: string
    currentEpisode: number
}

/**
 * 如果需要，就添加更新表数据，并且创建日历事件
 * @param tx
 * @param animeId
 * @param data
 * @returns
 */
export async function addScheduleIfNeed(tx: TTx, animeId: number, data: IAddScheduleIfNeed) {
    const { firstEpisodeTimestamp, totalEpisode, name, currentEpisode } = data
    const lastEpisodeTimestamp = dayjs
        .unix(firstEpisodeTimestamp)
        .add(totalEpisode * 7, 'day')
        .unix()
    const status = getStatus(firstEpisodeTimestamp, lastEpisodeTimestamp)
    if (status === EStatus.completed) {
        // 如果是完结，但是在本周内完结的，则可以插入到表中
        if (lastEpisodeTimestamp >= getMondayTimestampInThisWeek()) {
            await tx.insert(scheduleTable).values({
                animeId,
            })
            console.log('虽然已经完结，但是在本周内完结的，插入到表更新表中')
        }
        return
    }
    // 如果即将更新的时间不在本周，则不插入
    if (status === EStatus.toBeUpdated && firstEpisodeTimestamp > getSundayTimestampInThisWeek()) {
        console.log('即将更新的时间不在本周，不插入')
        return
    }
    await tx.insert(scheduleTable).values({
        animeId,
    })
    await createCalendarEvent({
        name,
        currentEpisode,
        totalEpisode,
        firstEpisodeTimestamp,
    })
}

async function deleteScheduleByAnimeId(tx: TTx, animeId: number) {
    await tx.delete(scheduleTable).where(eq(scheduleTable.animeId, animeId))
    const result = await tx.select().from(calendarTable).where(eq(calendarTable.animeId, animeId))
    if (result.length === 0) {
        console.log('没有关联的日历事件表')
        return
    }
    await deleteCalendarByAnimeId(tx, animeId)
}

interface IAddToBeUpdatedIfNeed {
    firstEpisodeTimestamp: number
    totalEpisode: number
    name: string
    currentEpisode: number
}
/**
 * 如果需要，就添加到即将更新的表中
 * @param tx
 * @param animeId
 * @param data
 */
export async function addToBeUpdatedIfNeed(tx: TTx, animeId: number, data: IAddToBeUpdatedIfNeed) {
    const { firstEpisodeTimestamp, totalEpisode, name, currentEpisode } = data
    const lastEpisodeTimestamp = dayjs
        .unix(firstEpisodeTimestamp)
        .add(totalEpisode * 7, 'day')
        .unix()
    const status = getStatus(firstEpisodeTimestamp, lastEpisodeTimestamp)
    if (status === EStatus.toBeUpdated) {
        await tx.insert(upcomingTable).values({
            animeId,
        })

        await createCalendarEvent({
            name,
            currentEpisode,
            totalEpisode,
            firstEpisodeTimestamp,
        })
    }
}

export async function deleteToBeUpdatedByAnimeId(tx: TTx, animeId: number) {
    await tx.delete(upcomingTable).where(eq(upcomingTable.animeId, animeId))
    const result = await tx.select().from(calendarTable).where(eq(calendarTable.animeId, animeId))
    if (result.length === 0) {
        console.log('没有关联的日历事件表')
        return
    }
    await deleteCalendarByAnimeId(tx, animeId)
}
