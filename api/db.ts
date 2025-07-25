import { db } from '@/db'
import { EStatus } from '@/enums'
import { createCalendarEvent, deleteCalendarEvent } from '@/utils/calendar'
import {
    getLastEpisodeTimestamp,
    getMondayTimestampInThisWeek,
    getStatus,
    getSundayTimestampInThisWeek,
} from '@/utils/time'
import dayjs from 'dayjs'
import { addAnime, deleteAnimeById, getAnimeById, updateAnimeById } from './anime'
import { addCalendar, deleteCalendarByAnimeId, getCalendarByAnimeId } from './calendar'
import { addSchedule, deleteScheduleByAnimeId } from './schedule'
import { addToBeUpdatedByAnimeId, deleteToBeUpdatedByAnimeId } from './toBeUpdated'

interface IAddAnimeData {
    name: string
    currentEpisode: number
    totalEpisode: number
    cover: string
    firstEpisodeTimestamp: number
}

// 依赖：addAnime、getStatus、getLastEpisodeTimestamp、getSundayTimestampInThisWeek、addSchedule、addToBeUpdatedByAnimeId、createCalendarEvent、addCalendar

export async function addAnimeFull(data: IAddAnimeData) {
    db.transaction(async tx => {
        // 1. 添加动漫
        const newAnime = await addAnime(tx, data)
        if (!newAnime) {
            return
        }

        // 2. 获取状态
        const firstEpisodeTimestamp = data.firstEpisodeTimestamp
        const lastEpisodeTimestamp = getLastEpisodeTimestamp({
            firstEpisodeTimestamp,
            totalEpisode: data.totalEpisode,
        })
        const status = getStatus(firstEpisodeTimestamp, lastEpisodeTimestamp)

        // 3. 分状态处理
        if (status === EStatus.completed) {
            // 已完结，判断是否本周完结
            const sundayTimestamp = getSundayTimestampInThisWeek()
            if (lastEpisodeTimestamp >= getMondayTimestampInThisWeek() && lastEpisodeTimestamp <= sundayTimestamp) {
                // 本周完结，添加到动漫更新表
                await addSchedule(tx, newAnime.id)
            }
            // 非本周完结，不做其它操作
            return
        }

        if (status === EStatus.toBeUpdated) {
            // 即将更新，添加到即将更新表
            await addToBeUpdatedByAnimeId(tx, newAnime.id)
            // 创建日历事件
            const eventId = await createCalendarEvent({
                name: data.name,
                firstEpisodeTimestamp: data.firstEpisodeTimestamp,
                currentEpisode: data.currentEpisode,
                totalEpisode: data.totalEpisode,
            })
            // 若创建成功，写入日历事件表
            if (eventId) await addCalendar(tx, newAnime.id, eventId)
            return
        }

        if (status === EStatus.serializing) {
            // 连载中，添加到动漫更新表
            await addSchedule(tx, newAnime.id)
            // 创建日历事件
            const eventId = await createCalendarEvent({
                name: data.name,
                firstEpisodeTimestamp: data.firstEpisodeTimestamp,
                currentEpisode: data.currentEpisode,
                totalEpisode: data.totalEpisode,
            })
            // 若创建成功，写入日历事件表
            if (eventId) await addCalendar(tx, newAnime.id, eventId)
            return
        }
    })
}

export async function updateAnimeUnified(animeId: number, newData: IAddAnimeData) {
    return await db.transaction(async tx => {
        // 1. 查询旧数据
        const oldAnime = await getAnimeById(tx, animeId)
        if (!oldAnime) return

        const newStatus = getStatus(
            newData.firstEpisodeTimestamp,
            getLastEpisodeTimestamp({
                firstEpisodeTimestamp: newData.firstEpisodeTimestamp,
                totalEpisode: newData.totalEpisode,
            })
        )

        // 3. 主表统一更新
        await updateAnimeById(tx, { ...newData, animeId })

        // 4. 清理所有相关的旧表数据
        await deleteScheduleByAnimeId(tx, animeId)
        await deleteToBeUpdatedByAnimeId(tx, animeId)
        const oldCalendar = await getCalendarByAnimeId(tx, animeId)
        if (oldCalendar) {
            await deleteCalendarEvent(oldCalendar.calendarId)
            await deleteCalendarByAnimeId(tx, animeId)
        }

        // 5. 判断是否需要日历事件和/或表关系
        // 是否本周要更新
        function willUpdateThisWeek(firstEpisodeTimestamp: number) {
            const updateWeekday = dayjs.unix(firstEpisodeTimestamp).isoWeekday()
            const weekStart = getMondayTimestampInThisWeek()
            const weekEnd = getSundayTimestampInThisWeek()
            const updateTime = dayjs()
                .isoWeekday(updateWeekday)
                .hour(dayjs.unix(firstEpisodeTimestamp).hour())
                .minute(dayjs.unix(firstEpisodeTimestamp).minute())
                .unix()
            return updateTime >= weekStart && updateTime <= weekEnd
        }
        const isWeekUpdate = willUpdateThisWeek(newData.firstEpisodeTimestamp)

        // 6. 状态归一化处理
        if (newStatus === EStatus.completed) {
            // 只有本周完结才进更新表，不创建日历
            const lastTs = getLastEpisodeTimestamp({
                firstEpisodeTimestamp: newData.firstEpisodeTimestamp,
                totalEpisode: newData.totalEpisode,
            })
            if (lastTs >= getMondayTimestampInThisWeek() && lastTs <= getSundayTimestampInThisWeek()) {
                await addSchedule(tx, animeId)
            }
            return
        }

        // 即将更新状态
        if (newStatus === EStatus.toBeUpdated) {
            await addToBeUpdatedByAnimeId(tx, animeId)
            if (isWeekUpdate) {
                await addSchedule(tx, animeId)
                const eventId = await createCalendarEvent({
                    name: newData.name,
                    firstEpisodeTimestamp: newData.firstEpisodeTimestamp,
                    currentEpisode: newData.currentEpisode,
                    totalEpisode: newData.totalEpisode,
                })
                if (eventId) await addCalendar(tx, animeId, eventId)
            }
            return
        }

        // 连载中
        if (newStatus === EStatus.serializing) {
            await addSchedule(tx, animeId)
            const eventId = await createCalendarEvent({
                name: newData.name,
                firstEpisodeTimestamp: newData.firstEpisodeTimestamp,
                currentEpisode: newData.currentEpisode,
                totalEpisode: newData.totalEpisode,
            })
            if (eventId) await addCalendar(tx, animeId, eventId)
            return
        }
    })
}

export async function deleteAnimeFull(animeId: number) {
    return await db.transaction(async tx => {
        // 1. 删除动漫更新表
        await deleteScheduleByAnimeId(tx, animeId)

        // 2. 删除即将更新表
        await deleteToBeUpdatedByAnimeId(tx, animeId)

        // 3. 删除日历事件与日历事件表
        const calendar = await getCalendarByAnimeId(tx, animeId)
        if (calendar) {
            await deleteCalendarEvent(calendar.calendarId)
            await deleteCalendarByAnimeId(tx, animeId)
        }

        // 4. 删除动漫主表
        await deleteAnimeById(tx, animeId)
    })
}
