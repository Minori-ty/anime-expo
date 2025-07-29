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
 * 计算到本周应该更新多少集 大于0
 * @tips     不是已经更新的集数, 所以会大于totalEpisode
 * @param    firstEpisodeTimestamp - 第一集时间戳（秒）
 * @returns 本周应该更新到第几集
 */
export function calcEpisodeThisWeek(firstEpisodeTimestamp: number): number {
    const firstEpisodeDayjs = dayjs.unix(firstEpisodeTimestamp)
    const sundaayDay = dayjs.unix(getSundayTimestampInThisWeek())
    const diffWeeks = sundaayDay.diff(firstEpisodeDayjs, 'week')
    return Math.max(0, diffWeeks + 1)
}

interface IGetcurrentEpisode {
    firstEpisodeTimestamp: number
    lastEpisodeTimestamp: number
    totalEpisode: number
}
export function getcurrentEpisode({ firstEpisodeTimestamp, lastEpisodeTimestamp, totalEpisode }: IGetcurrentEpisode) {
    /** 本周应该更新的集数(不是已经更新的集数, 所以shouldEpisodeNum会大于totalEpisode) */
    const shouldEpisodeNum = calcEpisodeThisWeek(firstEpisodeTimestamp)

    const status = getStatus(firstEpisodeTimestamp, lastEpisodeTimestamp)

    if (status === EStatus.completed) {
        return totalEpisode
    }

    if (status === EStatus.toBeUpdated) {
        return 0
    }

    if (status === EStatus.serializing) {
        return Math.max(
            1,
            isCurrentWeekdayUpdateTimePassed(dayjs.unix(firstEpisodeTimestamp).format('YYYY-MM-DD HH:mm'))
                ? shouldEpisodeNum
                : shouldEpisodeNum - 1
        )
    }
    return -999
}
