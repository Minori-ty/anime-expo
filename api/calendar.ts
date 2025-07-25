import { db } from '@/db'
import { calendarTable } from '@/db/schema'
import { TTx } from '@/types'
import { createCalendarEvent, deleteCalendarEvent } from '@/utils/calendar'
import { eq } from 'drizzle-orm'
import { IAddAnimeData } from './anime'

/**
 * 根据动漫id添加日历事件表数据
 * @param tx
 * @param animeId
 * @param calendarId
 * @returns
 */
export async function addCalendar(tx: TTx, animeId: number, calendarId: string) {
    const result = await getCalendarByAnimeId(tx, animeId)
    if (result) {
        console.log('已经有对应的日历事件表数据了，就不再创建了')
        return
    }
    await tx.insert(calendarTable).values({ animeId, calendarId })
    console.log('添加日历表成功')
}

/**
 * 根据动漫id更细日历事件表数据
 * @param tx
 * @param animeId
 * @param calendarId
 * @returns
 */
export async function updateCalendarByAnimeId(tx: TTx, animeId: number, calendarId: string) {
    const result = await getCalendarByAnimeId(tx, animeId)
    if (!result) {
        console.log('对应的日历事件表数据不存在，就不更新日历表了')
        return
    }
    await tx
        .update(calendarTable)
        .set({
            calendarId,
        })
        .where(eq(calendarTable.animeId, animeId))
    console.log('更新日历表数据成功')
}

/**
 * 根据动漫id删除日历事件表数据
 * @param tx
 * @param animeId
 * @returns
 */
export async function deleteCalendarByAnimeId(tx: TTx, animeId: number) {
    const result = await getCalendarByAnimeId(tx, animeId)
    if (!result) {
        console.log('对应的日历事件表数据不存在，就不删除日历表了')
        return
    }
    await tx.delete(calendarTable).where(eq(calendarTable.animeId, animeId))
    console.log('删除日历表数据成功')
}

/**
 * 根据动漫id判断日历事件表中的数据是否存在
 * @param tx
 * @param animeId
 * @returns
 */
export async function getCalendarByAnimeId(tx: TTx, animeId: number) {
    const result = await tx.select().from(calendarTable).where(eq(calendarTable.animeId, animeId))
    if (result.length === 0) {
        console.log('对应的日历事件不存在')
        return
    }
    return result[0]
}

export async function hasCalendar(animeId: number) {
    const result = await db.select().from(calendarTable).where(eq(calendarTable.animeId, animeId))
    if (result.length === 0) {
        console.log('对应的日历事件不存在')
        return false
    }
    return true
}

/**
 * 统一创建日历事件并写入日历表
 */
export async function createAndBindCalendar(tx: TTx, animeId: number, data: IAddAnimeData) {
    await clearCalendarByAnimeId(tx, animeId)
    const eventId = await createCalendarEvent({
        name: data.name,
        firstEpisodeTimestamp: data.firstEpisodeTimestamp,
        currentEpisode: data.currentEpisode,
        totalEpisode: data.totalEpisode,
    })
    if (eventId) {
        await addCalendar(tx, animeId, eventId)
    }
}

/**
 * 统一删除日历事件及其关联表
 */
export async function clearCalendarByAnimeId(tx: TTx, animeId: number) {
    const calendar = await getCalendarByAnimeId(tx, animeId)
    if (calendar) {
        await deleteCalendarEvent(calendar.calendarId)
        await deleteCalendarByAnimeId(tx, animeId)
    }
}
