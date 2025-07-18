import { EStatus } from '@/enums'
import dayjs from 'dayjs'

function getUpdateWeekday(firstEpisodeYYYYMMDDHHmm: string) {
    return dayjs(firstEpisodeYYYYMMDDHHmm).isoWeekday()
}

/**
 * 根据时间获取更新状态
 * @param firstEpisodeYYYYMMDDHHmm
 * @param lastEpisodeYYYYMMDDHHmm
 * @returns
 */
export function getStatus(firstEpisodeYYYYMMDDHHmm: string, lastEpisodeYYYYMMDDHHmm: string) {
    const firstEpisodeTimestamp = dayjs(firstEpisodeYYYYMMDDHHmm).unix()
    const lastEpisodeTimestamp = dayjs(lastEpisodeYYYYMMDDHHmm).unix()
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
export function isCurrentWeekdayUpdateTimePassed(firstEpisodeYYYYMMDDHHmm: string) {
    const updateWeekday = getUpdateWeekday(firstEpisodeYYYYMMDDHHmm)
    const now = dayjs()
    const currentWeekday = now.isoWeekday()

    if (currentWeekday !== updateWeekday) {
        return currentWeekday > updateWeekday
    }
    const hour = dayjs(firstEpisodeYYYYMMDDHHmm).hour()
    const minute = dayjs(firstEpisodeYYYYMMDDHHmm).minute()
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
