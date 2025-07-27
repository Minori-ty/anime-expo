import { EStatus, EWeekday } from '@/enums'
import dayjs from 'dayjs'

function getUpdateWeekday(YYYYMMDDHHmm: string) {
    return dayjs(YYYYMMDDHHmm).isoWeekday()
}

/**
 * 根据时间获取更新状态
 * @param firstEpisodeTimestamp
 * @param lastEpisodeTimestamp
 * @returns
 */
export function getStatus(firstEpisodeTimestamp: number, lastEpisodeTimestamp: number) {
    const now = dayjs().unix()
    if (now < firstEpisodeTimestamp) {
        return EStatus.toBeUpdated
    } else if (now >= firstEpisodeTimestamp && now <= lastEpisodeTimestamp) {
        return EStatus.serializing
    } else {
        return EStatus.completed
    }
}

/**
 * 判断连载中的动漫是否到了更新时间点
 * @param YYYYMMDDHHmm
 * @returns
 */
export function isCurrentWeekdayUpdateTimePassed(YYYYMMDDHHmm: string) {
    const now = dayjs()
    const updateWeekday = getUpdateWeekday(YYYYMMDDHHmm)
    const currentWeekday = now.isoWeekday()

    if (currentWeekday !== updateWeekday) {
        return currentWeekday > updateWeekday
    }
    const hour = dayjs(YYYYMMDDHHmm, 'YYYY-MM-DD HH:mm').hour()
    const minute = dayjs(YYYYMMDDHHmm, 'YYYY-MM-DD HH:mm').minute()
    const currentHour = now.hour()
    const currentMinute = now.minute()

    if (hour !== currentHour) {
        return currentHour > hour
    }
    if (minute !== currentMinute) {
        return currentMinute > minute
    }
    return true
}

/**
 * 判断是否本周更新
 * @param firstEpisodeTimestamp
 */
export function willUpdateThisWeek(firstEpisodeTimestamp: number) {
    const weekStartTimestamp = getMondayTimestampInThisWeek()
    const weekEndTimestamp = getSundayTimestampInThisWeek()
    return firstEpisodeTimestamp >= weekStartTimestamp && firstEpisodeTimestamp <= weekEndTimestamp
}

/**
 * 获取本周日的结束的时间戳
 */
export function getSundayTimestampInThisWeek() {
    return dayjs().isoWeekday(7).endOf('day').unix()
}

/**
 * 获取本周一的开始的时间戳
 */
export function getMondayTimestampInThisWeek() {
    return dayjs().isoWeekday(1).startOf('day').unix()
}

interface IGetFirstEpisodeTimestamp {
    currentEpisode: number
    updateTimeHHmm: string
    updateWeekday: typeof EWeekday.valueType
}
/**
 * 获取第一集更新的时间戳
 * @param data
 * @returns
 */
export function getFirstEpisodeTimestamp(data: IGetFirstEpisodeTimestamp) {
    const { currentEpisode, updateTimeHHmm, updateWeekday } = data
    const hour = dayjs(updateTimeHHmm).hour()
    const minute = dayjs(updateTimeHHmm).minute()
    /** 本周的更新时间 */
    const updatetime = dayjs()
        .isoWeekday(updateWeekday)
        .hour(Number(hour))
        .minute(Number(minute))
        .second(0)
        .millisecond(0)

    const offest = isCurrentWeekdayUpdateTimePassed(updatetime.format('YYYY-MM-DD HH:mm'))
        ? currentEpisode - 1
        : currentEpisode
    return updatetime.subtract(offest, 'week').unix()
}

interface IGetLastEpisodeTimestamp {
    firstEpisodeTimestamp: number
    totalEpisode: number
}
/**
 * 获取最后一集更新的时间戳
 */
export function getLastEpisodeTimestamp({ firstEpisodeTimestamp, totalEpisode }: IGetLastEpisodeTimestamp) {
    return dayjs
        .unix(firstEpisodeTimestamp)
        .second(0)
        .add((totalEpisode - 1) * 7, 'day')
        .unix()
}

/**
 * 计算到本周应该更新多少集
 * @param    firstEpisodeTimestamp - 第一集时间戳（秒）
 * @returns 本周应该更新到第几集
 */
export function calcEpisodeThisWeek(firstEpisodeTimestamp: number): number {
    const firstEp = dayjs.unix(firstEpisodeTimestamp)
    const mondayThisWeek = dayjs().isoWeekday(1).startOf('day')

    // 如果第一集还没发布，本周不应有新集
    if (firstEp.isAfter(mondayThisWeek)) return 0

    // 距离第一集过去了多少个周一（本周一-第一集的周一）/7天
    const firstEpMonday = firstEp.isoWeekday(1).startOf('day')
    const diffWeeks = mondayThisWeek.diff(firstEpMonday, 'week')

    // 本周应该更新到第几集 = 1（第一周）+ diffWeeks
    return diffWeeks + 1
}
