import { db } from '@/db'
import { animeTable, scheduleTable } from '@/db/schema'
import { TTx } from '@/types'
import { eq } from 'drizzle-orm'
import { IAddAnimeData, parseAnimeData } from './anime'
import { createAndBindCalendar } from './calendar'

/**
 * 添加动漫更新表数据
 * @param tx
 * @param animeId
 * @returns
 */
export async function addSchedule(tx: TTx, animeId: number) {
    const result = await getScheduleByAnimeId(tx, animeId)
    if (result) {
        console.log('已经有对应的动漫更新数据表了，就不再创建了')
        return
    }
    await tx.insert(scheduleTable).values({
        animeId,
    })
    console.log('添加动漫更新表数据成功')
}

/**
 * 根据动漫id删除动漫更新表数据
 * @param tx
 * @param animeId
 * @returns
 */
export async function deleteScheduleByAnimeId(tx: TTx, animeId: number) {
    const result = await getScheduleByAnimeId(tx, animeId)
    if (!result) {
        console.log('对应的动漫更新表数据不存在，就不删除了')
        return
    }
    await tx.delete(scheduleTable).where(eq(scheduleTable.animeId, animeId))
    console.log('删除动漫更新表数据成功')
}

/**
 * 获取所有更新表数据
 * @returns
 */
export async function getScheduleList() {
    const result = await db.select().from(scheduleTable).innerJoin(animeTable, eq(animeTable.id, scheduleTable.animeId))
    const animeList = result.map(item => parseAnimeData(item.anime))

    return animeList
}

/**
 * 根据动漫id判断动漫更新表中是否存在该数据
 * @param tx
 * @param animeId
 * @returns
 */
export async function getScheduleByAnimeId(tx: TTx, animeId: number) {
    const result = await tx.select().from(scheduleTable).where(eq(scheduleTable.animeId, animeId))
    if (result.length === 0) {
        console.log('对应的动漫更新表数据不存在')
        return
    }
    return result[0]
}

/**
 * 统一处理添加连载表和创建日历表和日历事件
 * @param tx
 * @param animeId
 * @param data
 */
export async function handleAddSchedule(tx: TTx, animeId: number, data: IAddAnimeData) {
    await addSchedule(tx, animeId)
    await createAndBindCalendar(tx, animeId, data)
}
