import { getCalendarPermission } from '@/permissions'
import * as Calendar from 'expo-calendar'

// 删除日历事件
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
        return false
    }
}
