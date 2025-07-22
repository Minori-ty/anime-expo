import { getCalendarPermission } from '@/permissions'
import dayjs from 'dayjs'
import * as Calendar from 'expo-calendar'
import { isCurrentWeekdayUpdateTimePassed } from './time'

/**
 * 删除日历事件，如果删除失败，则返回false
 * @param eventId
 * @returns
 */
export async function deleteCalendarEvent(eventId: string) {
    // 先获取日历权限
    const granted = await getCalendarPermission()
    if (!granted) return false

    // 获得默认日历ID
    const calendars = await Calendar.getCalendarsAsync()
    const defaultCalendar = calendars.find(cal => cal.allowsModifications)

    if (!defaultCalendar) {
        console.log('没有找到可修改的默认日历')
        return false
    }

    try {
        await Calendar.deleteEventAsync(eventId)
        console.log('删除日历成功')
        return true
    } catch {
        console.log('删除日历失败')
        return false
    }
}

interface ICreateCalendarEventProps {
    name: string
    firstEpisodeTimestamp: number
    currentEpisode: number
    totalEpisode: number
}
/**
 * 传入参数，自动根据时间创建日历事件
 * @param param
 * @returns
 */
export async function createCalendarEvent({
    name,
    firstEpisodeTimestamp,
    currentEpisode,
    totalEpisode,
}: ICreateCalendarEventProps) {
    // 先获取日历权限
    const granted = await getCalendarPermission()
    if (!granted) return false

    // 获得默认日历ID
    const calendars = await Calendar.getCalendarsAsync()
    const defaultCalendar = calendars.find(cal => cal.allowsModifications)

    if (!defaultCalendar) {
        console.log('没有找到可修改的默认日历')
        return false
    }

    const firstday = dayjs.unix(firstEpisodeTimestamp)
    /** 更新对应的星期 */
    const weekday = firstday.isoWeekday()
    /** 更新对应的小时 */
    const hour = firstday.hour()
    /** 更新对应的分钟 */
    const minute = firstday.minute()
    /** 本周更新的时间(但是有可能已经过去了) */
    const updateDayInCurrentWeek = dayjs().isoWeekday(weekday).hour(hour).minute(minute)
    // 如果没超过，则定在本周。如果超过了，则时间定在下周。
    /** 日历开始通知的时间 */
    const startDate = isCurrentWeekdayUpdateTimePassed(updateDayInCurrentWeek.format('YYYY-MM-DD HH:mm'))
        ? updateDayInCurrentWeek.add(7, 'day').toDate()
        : updateDayInCurrentWeek.toDate()
    /** 日历事件结束的时候 */
    const endDate = dayjs(startDate).add(23, 'minute').toDate()

    // 解析输入的时间字符串
    try {
        const eventId = await Calendar.createEventAsync(defaultCalendar.id, {
            title: `${name} 即将更新!`,
            startDate,
            endDate,
            timeZone: 'Asia/Shanghai',
            alarms: [
                { relativeOffset: -10 }, // 提前10分钟通知
                { relativeOffset: -5 }, // 提前5分钟通知
            ],
            recurrenceRule: {
                frequency: Calendar.Frequency.WEEKLY,
                interval: 1,
                occurrence: totalEpisode - currentEpisode,
            },
        })
        console.log('创建日历成功')
        return eventId
    } catch (error) {
        alert(error)
        return '' as const
    }
}
