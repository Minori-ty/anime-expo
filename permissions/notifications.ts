import * as Notifications from 'expo-notifications'

export async function setNotificationChannelAsync() {
    await Notifications.setNotificationChannelAsync('番剧推送', {
        name: '番剧推送',
        importance: Notifications.AndroidImportance.MAX, // MAX 会以悬浮横幅显示
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
    })
}

export function sendNotifications(title: string, body: string) {
    return new Promise((resolve, reject) => {
        try {
            Notifications.scheduleNotificationAsync({
                content: {
                    title,
                    body,
                    priority: Notifications.AndroidNotificationPriority.HIGH, // 高优先级
                },
                trigger: {
                    // type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                    // seconds: 10,
                    channelId: '番剧推送',
                    // repeats: true,
                },
            })
            resolve('通知已发送')
        } catch {
            reject('发送通知失败')
        }
    })
}
