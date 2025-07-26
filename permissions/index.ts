import * as Calendar from 'expo-calendar'
import * as FileSystem from 'expo-file-system'
import * as Notifications from 'expo-notifications'
import { setNotificationChannelAsync } from './notifications'

/**
 * 获取日历权限
 * @returns
 */
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

/**
 * 获取通知权限
 * @returns
 */
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

/**
 * 获取文件存储权限和目录
 * @returns
 */
export async function getFileExportsPermission() {
    try {
        const settings = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync()
        if (settings.granted) {
            return settings.directoryUri
        }
        alert('获取文件存储权限失败')
        return false
    } catch (error) {
        alert('获取文件存储权限失败' + error)
        return false
    }
}
