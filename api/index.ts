import { db } from '@/db'
import { EStatus } from '@/enums'
import {
    calcEpisodeThisWeek,
    getLastEpisodeTimestamp,
    getMondayTimestampInThisWeek,
    getStatus,
    isCurrentWeekdayUpdateTimePassed,
    willUpdateThisWeek,
} from '@/utils/time'
import dayjs from 'dayjs'
import { addAnime, addAnimeList, deleteAnimeById, updateAnimeById, type IAddAnimeData } from './anime'
import { clearCalendarByAnimeId } from './calendar'
import { addSchedule, deleteScheduleByAnimeId, getScheduleList, handleAddSchedule } from './schedule'
import { addToBeUpdatedByAnimeId, deleteToBeUpdatedByAnimeId, getToBeUpdatedList } from './toBeUpdated'
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
            await handleAddSchedule(tx, newAnime.id, animeData)
        } else if (status === EStatus.toBeUpdated) {
            await addToBeUpdatedByAnimeId(tx, newAnime.id)
            if (willUpdateThisWeek(animeData.firstEpisodeTimestamp)) {
                await handleAddSchedule(tx, newAnime.id, animeData)
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
                await handleAddSchedule(tx, item.id, item)
            } else if (status === EStatus.toBeUpdated) {
                await addToBeUpdatedByAnimeId(tx, item.id)
                if (willUpdateThisWeek(item.firstEpisodeTimestamp)) {
                    await handleAddSchedule(tx, item.id, item)
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
        const lastEpisodeTimestamp = getLastEpisodeTimestamp({
            firstEpisodeTimestamp: animeData.firstEpisodeTimestamp,
            totalEpisode: animeData.totalEpisode,
        })
        const status = getStatus(animeData.firstEpisodeTimestamp, lastEpisodeTimestamp)

        // 3. 统一清理所有关联表和日历
        await deleteScheduleByAnimeId(tx, animeId)
        await deleteToBeUpdatedByAnimeId(tx, animeId)
        await clearCalendarByAnimeId(tx, animeId)

        // 4. 关联表与日历处理
        if (status === EStatus.serializing) {
            await handleAddSchedule(tx, animeId, animeData)
        } else if (status === EStatus.toBeUpdated) {
            await addToBeUpdatedByAnimeId(tx, animeId)
            if (willUpdateThisWeek(animeData.firstEpisodeTimestamp)) {
                await handleAddSchedule(tx, animeId, animeData)
            }
        } else if (status === EStatus.completed) {
            // 是在本周内完结的，继续添加到更新表中
            if (lastEpisodeTimestamp >= getMondayTimestampInThisWeek()) {
                await addSchedule(tx, animeId)
            }
        }
        // 已完结：所有表已清理，不做其它处理
    })
}

/**
 * 更新整张连载表
 */
export async function updateScheduleTable() {
    return await db.transaction(async tx => {
        const scheduleList = await getScheduleList()

        return await Promise.all(
            scheduleList.map(async anime => {
                const { id, firstEpisodeYYYYMMDDHHmm, totalEpisode, currentEpisode, cover, name } = anime
                const firstEpisodeTimestamp = dayjs(firstEpisodeYYYYMMDDHHmm).second(0).unix()
                const shouldEpisodeNum = calcEpisodeThisWeek(firstEpisodeTimestamp)

                if (shouldEpisodeNum === 0) return
                if (shouldEpisodeNum <= totalEpisode) {
                    if (currentEpisode < shouldEpisodeNum) {
                        await handleUpdateAnime({
                            animeId: id,
                            cover,
                            firstEpisodeTimestamp,
                            name,
                            currentEpisode: shouldEpisodeNum,
                            totalEpisode,
                        })
                    }
                    return true
                } else {
                    console.log('错误走了删除逻辑')

                    // 已完结，清理
                    await deleteScheduleByAnimeId(tx, id)
                    await clearCalendarByAnimeId(tx, id)
                    return true
                }
            })
        )
    })
}

/**
 * 更新整张即将更新表
 * @returns
 */
export async function updateToBeUpdatedTable() {
    return await db.transaction(async tx => {
        const toBeUpdatedList = await getToBeUpdatedList(tx)

        return await Promise.all(
            toBeUpdatedList.map(async anime => {
                const { id, firstEpisodeTimestamp, totalEpisode, cover, name } = anime.anime
                const lastEpisodeTimestamp = getLastEpisodeTimestamp({ firstEpisodeTimestamp, totalEpisode })
                const status = getStatus(firstEpisodeTimestamp, lastEpisodeTimestamp)
                if (status === EStatus.completed) {
                    await deleteToBeUpdatedByAnimeId(tx, id)
                    await clearCalendarByAnimeId(tx, id)
                    return true
                }
                if (status === EStatus.toBeUpdated) {
                    if (!willUpdateThisWeek(firstEpisodeTimestamp)) return true
                }

                await deleteToBeUpdatedByAnimeId(tx, id)
                const shouldEpisodeNum = calcEpisodeThisWeek(firstEpisodeTimestamp)
                await handleAddSchedule(tx, id, {
                    name,
                    currentEpisode: isCurrentWeekdayUpdateTimePassed(
                        dayjs.unix(firstEpisodeTimestamp).format('YYYY-MM-DD HH:mm')
                    )
                        ? shouldEpisodeNum
                        : shouldEpisodeNum - 1,
                    totalEpisode,
                    cover,
                    firstEpisodeTimestamp,
                })
                return true
            })
        )
    })
}
