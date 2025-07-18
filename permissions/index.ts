import * as Calendar from 'expo-calendar'
import * as Notifications from 'expo-notifications'
import { setNotificationChannelAsync } from './notifications'

/** 获取日历权限 */
export async function getCalendarPermission() {
    try {
        const settings = await Calendar.getCalendarPermissionsAsync()
        if (settings.granted) {
            return true
        }

        const status = await Calendar.requestCalendarPermissionsAsync()
        return status.granted
    } catch (error) {
        alert('获取日历权限失败' + error)
        return false
    }
}

export async function getNotificationPermission() {
    try {
        const settings = await Notifications.getPermissionsAsync()
        if (settings.granted) {
            return true
        }

        const status = await Notifications.requestPermissionsAsync({
            ios: {
                allowAlert: true,
                allowBadge: true,
                allowSound: true,
            },
        })
        await setNotificationChannelAsync()

        return status.granted
    } catch (error) {
        alert('获取消息推送权限失败' + error)
        return false
    }
}
