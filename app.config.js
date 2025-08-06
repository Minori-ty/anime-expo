import pkg from './package.json' assert { type: 'json' }
/**
 * @type {import('expo/config').ExpoConfig}
 */
const config = {
    expo: {
        name: pkg.name,
        slug: 'anime',
        version: pkg.version,
        orientation: 'portrait',
        icon: './assets/images/icon.png',
        scheme: 'anime',
        userInterfaceStyle: 'automatic',
        newArchEnabled: true,
        ios: {
            supportsTablet: true,
        },
        android: {
            adaptiveIcon: {
                foregroundImage: './assets/images/adaptive-icon.png',
                backgroundColor: '#ffffff',
            },
            edgeToEdgeEnabled: true,
            package: 'com.minority.app',
            permissions: [
                'ACCESS_NETWORK_STATE',
                'FOREGROUND_SERVICE',
                'RECEIVE_BOOT_COMPLETED',
                'WAKE_LOCK',
                'SCHEDULE_EXACT_ALARM', // 可选，用于高频任务
                'ACCESS_COARSE_LOCATION',
                'ACCESS_FINE_LOCATION',
                'ACCESS_BACKGROUND_LOCATION',
                'FOREGROUND_SERVICE_LOCATION',
                'IGNORE_BATTERY_OPTIMIZATION',
                'READ_CALENDAR',
                'WRITE_CALENDAR',
                'WRITE_EXTERNAL_STORAGE', // 写入存储权限（Android 10及以下需要）
                'MANAGE_EXTERNAL_STORAGE', // Android 11+ 需要的所有文件访问权限（可选）
            ],
        },
        web: {
            bundler: 'metro',
            output: 'static',
            favicon: './assets/images/favicon.png',
        },
        plugins: [
            'expo-router',
            'expo-background-task',
            [
                'expo-sqlite',
                {
                    enableFTS: true,
                    useSQLCipher: true,
                    android: {
                        // Override the shared configuration for Android
                        enableFTS: false,
                        useSQLCipher: false,
                    },
                    ios: {
                        // You can also override the shared configurations for iOS
                        customBuildFlags: ['-DSQLITE_ENABLE_DBSTAT_VTAB=1 -DSQLITE_ENABLE_SNAPSHOT=1'],
                    },
                },
            ],
            [
                'expo-notifications',
                {
                    color: '#ffffff',
                    defaultChannel: '番剧推送',
                    enableBackgroundRemoteNotifications: false,
                    backgroundFetchEnabled: true,
                },
            ],
            [
                'expo-splash-screen',
                {
                    image: './assets/images/splash-icon.png',
                    imageWidth: 200,
                    resizeMode: 'contain',
                    backgroundColor: '#ffffff',
                },
            ],
            [
                'expo-build-properties',
                {
                    android: {
                        compileSdkVersion: 35,
                        targetSdkVersion: 35,
                        buildToolsVersion: '35.0.0',
                        ndkVersion: '27.1.12297006',
                    },
                    ios: {
                        deploymentTarget: '15.1',
                    },
                },
            ],
            [
                'expo-calendar',
                {
                    calendarPermission: '申请获取日历权限，以便添加动漫更新事件',
                },
            ],
            'expo-image-picker',
            [
                'expo-document-picker',
                {
                    iCloudContainerEnvironment: 'Production',
                },
            ],
        ],
        experiments: {
            typedRoutes: true,
        },
        extra: {
            eas: {
                projectId: '277b7d6d-d578-473a-99f9-534f0cb4bcfa',
            },
        },
    },
}

export default config
