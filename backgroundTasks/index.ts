import * as BackgroundTask from 'expo-background-task'
import * as TaskManager from 'expo-task-manager'

/** 定时更新动漫更新表和动漫即将更新表 */
const BACKGROUND_TASK_NAME = 'REFRESH_SCHEDULE_AND_CALENDAR'

export function taskDefined() {
    const isTaskDefined = TaskManager.isTaskDefined(BACKGROUND_TASK_NAME)
    if (!isTaskDefined) {
        TaskManager.defineTask(BACKGROUND_TASK_NAME, async () => {
            try {
                await refreshScheduleAndCalendar()
                return BackgroundTask.BackgroundTaskResult.Success
            } catch {
                return BackgroundTask.BackgroundTaskResult.Failed
            }
        })
    }
}

/**
 * 在App初始化时注册任务
 * @returns
 */
export async function registerBackgroundTask() {
    /** 是否注册了任务 */
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK_NAME)
    if (isRegistered) return
    // 注册任务（iOS/Android 通用 API）
    BackgroundTask.registerTaskAsync(BACKGROUND_TASK_NAME, {
        minimumInterval: 15, // 最少15分钟触发（单位：分钟）
    })
}

export function refreshScheduleAndCalendar() {}
