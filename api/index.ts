import { db } from '@/db'
import { EStatus } from '@/enums'
import { getLastEpisodeTimestamp, getStatus, willUpdateThisWeek } from '@/utils/time'
import { addAnime, addAnimeList, deleteAnimeById, updateAnimeById, type IAddAnimeData } from './anime'
import { clearCalendarByAnimeId, createAndBindCalendar } from './calendar'
import { addSchedule, deleteScheduleByAnimeId } from './schedule'
import { addToBeUpdatedByAnimeId, deleteToBeUpdatedByAnimeId } from './toBeUpdated'
export { getAnimeList } from './anime'

/**
 * 添加动漫归一化处理
 */
export async function handleAddAnime(animeData: IAddAnimeData) {
    return await db.transaction(async tx => {
        // 1. 添加主表
        const newAnime = await addAnime(tx, animeData)
        if (!newAnime) return

        // 2. 计算状态
        const lastTs = getLastEpisodeTimestamp({
            firstEpisodeTimestamp: animeData.firstEpisodeTimestamp,
            totalEpisode: animeData.totalEpisode,
        })
        const status = getStatus(animeData.firstEpisodeTimestamp, lastTs)

        // 3. 关联表与日历处理
        if (status === EStatus.serializing) {
            await addSchedule(tx, newAnime.id)
            await createAndBindCalendar(tx, newAnime.id, animeData)
        } else if (status === EStatus.toBeUpdated) {
            await addToBeUpdatedByAnimeId(tx, newAnime.id)
            if (willUpdateThisWeek(animeData.firstEpisodeTimestamp)) {
                await addSchedule(tx, newAnime.id)
                await createAndBindCalendar(tx, newAnime.id, animeData)
            }
        }
        // 已完结不做其它处理
    })
}

/**
 * 批量添加动漫
 * @param animeDataList
 * @returns
 */
export async function handleAddAnimeList(animeDataList: IAddAnimeData[]) {
    return await db.transaction(async tx => {
        // 1. 添加主表
        const newAnime = await addAnimeList(tx, animeDataList)
        if (!newAnime) return

        newAnime.forEach(async item => {
            // 2. 计算状态
            const lastTs = getLastEpisodeTimestamp({
                firstEpisodeTimestamp: item.firstEpisodeTimestamp,
                totalEpisode: item.totalEpisode,
            })
            const status = getStatus(item.firstEpisodeTimestamp, lastTs)

            // 3. 关联表与日历处理
            if (status === EStatus.serializing) {
                await addSchedule(tx, item.id)
                await createAndBindCalendar(tx, item.id, item)
            } else if (status === EStatus.toBeUpdated) {
                await addToBeUpdatedByAnimeId(tx, item.id)
                if (willUpdateThisWeek(item.firstEpisodeTimestamp)) {
                    await addSchedule(tx, item.id)
                    await createAndBindCalendar(tx, item.id, item)
                }
            }
        })
        // 已完结不做其它处理
    })
}

/**
 * 删除动漫归一化处理
 */
export async function handleDeleteAnime(animeId: number) {
    return await db.transaction(async tx => {
        await deleteScheduleByAnimeId(tx, animeId)
        await deleteToBeUpdatedByAnimeId(tx, animeId)
        await clearCalendarByAnimeId(tx, animeId)
        await deleteAnimeById(tx, animeId)
    })
}

interface IHandleUpdateAnime extends IAddAnimeData {
    animeId: number
}
export async function handleUpdateAnime({
    animeId,
    name,
    cover,
    currentEpisode,
    firstEpisodeTimestamp,
    totalEpisode,
}: IHandleUpdateAnime) {
    return await db.transaction(async tx => {
        const animeData: IAddAnimeData = {
            name,
            cover,
            currentEpisode,
            firstEpisodeTimestamp,
            totalEpisode,
        }
        // 1. 主表数据更新
        await updateAnimeById(tx, { ...animeData, animeId })

        // 2. 计算新状态
        const lastTs = getLastEpisodeTimestamp({
            firstEpisodeTimestamp: animeData.firstEpisodeTimestamp,
            totalEpisode: animeData.totalEpisode,
        })
        const status = getStatus(animeData.firstEpisodeTimestamp, lastTs)

        // 3. 统一清理所有关联表和日历
        await deleteScheduleByAnimeId(tx, animeId)
        await deleteToBeUpdatedByAnimeId(tx, animeId)
        await clearCalendarByAnimeId(tx, animeId)

        // 4. 关联表与日历处理
        if (status === EStatus.serializing) {
            await addSchedule(tx, animeId)
            await createAndBindCalendar(tx, animeId, animeData)
        } else if (status === EStatus.toBeUpdated) {
            await addToBeUpdatedByAnimeId(tx, animeId)
            if (willUpdateThisWeek(animeData.firstEpisodeTimestamp)) {
                await addSchedule(tx, animeId)
                await createAndBindCalendar(tx, animeId, animeData)
            }
        }
        // 已完结：所有表已清理，不做其它处理
    })
}
