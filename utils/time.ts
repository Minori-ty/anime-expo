import { TSerializingForm } from '@/components/BaseForm'
import { EStatus } from '@/enums'
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
 * @param firstEpisodeYYYYMMDDHHmm
 * @returns
 */
export function isCurrentWeekdayUpdateTimePassed(YYYYMMDDHHmm: string) {
    const now = dayjs()
    const updateWeekday = getUpdateWeekday(YYYYMMDDHHmm)
    const currentWeekday = now.isoWeekday()

    if (currentWeekday !== updateWeekday) {
        return currentWeekday > updateWeekday
    }
    const hour = dayjs(YYYYMMDDHHmm).hour()
    const minute = dayjs(YYYYMMDDHHmm).minute()
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
 * 获取本周日的结束的时间戳
 */
export function getSundayTimestampInThisWeek() {
    return dayjs().isoWeekday(7).hour(23).minute(59).second(59).unix()
}

/**
 * 获取本周一的开始的时间戳
 */
export function getMondayTimestampInThisWeek() {
    return dayjs().isoWeekday(1).hour(0).minute(0).second(0).unix()
}

export function getFirstEpisodeTimestamp(data: TSerializingForm) {
    const { currentEpisode, updateTimeHHmm, updateWeekday } = data
    const [hour, minute] = updateTimeHHmm.split(':')
    const updatetime = dayjs().isoWeekday(updateWeekday).hour(Number(hour)).minute(Number(minute))
    const offest = isCurrentWeekdayUpdateTimePassed(dayjs().format('YYYY-MM-DD HH:mm'))
        ? currentEpisode
        : currentEpisode + 1
    return updatetime.subtract(offest - 1, 'week').unix()
}
