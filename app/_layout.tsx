import { DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { useFonts } from 'expo-font'
import { Stack } from 'expo-router'
import 'react-native-reanimated'

import { refreshScheduleAndCalendar, registerBackgroundTask, taskDefined } from '@/backgroundTasks'
import Error from '@/components/lottie/Error'
import Loading from '@/components/lottie/Loading'
import { db, expo } from '@/db'
import migrations from '@/drizzle/migrations'
import { getCalendarPermission, getNotificationPermission } from '@/permissions'
import '@/styles/global.css'
import { queryClient } from '@/utils/react-query'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { QueryClientProvider } from '@tanstack/react-query'
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator'
import { useDrizzleStudio } from 'expo-drizzle-studio-plugin'
import * as Notifications from 'expo-notifications'
import { startTransition } from 'react'
import { Text } from 'react-native'
import ErrorBoundary from 'react-native-error-boundary'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { KeyboardProvider } from 'react-native-keyboard-controller'

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
})

taskDefined()
export default function RootLayout() {
    const { success, error } = useMigrations(db, migrations)
    const [loaded] = useFonts({
        SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    })
    useDrizzleStudio(expo)

    startTransition(() => {
        getNotificationPermission()
        getCalendarPermission()
        registerBackgroundTask()
        refreshScheduleAndCalendar()
    })

    function errorHandler(error: Error, stackTrace: string) {
        console.log(error)
    }

    if (!loaded) {
        // Async font loading only occurs in development.
        return <Loading />
    }

    if (error) {
        return <Text>Migration 错误: {error.message}</Text>
    }
    if (!success) {
        return <Text>正在 Migration...</Text>
    }

    return (
        <KeyboardProvider>
            <ErrorBoundary FallbackComponent={Error} onError={errorHandler}>
                <QueryClientProvider client={queryClient}>
                    <GestureHandlerRootView>
                        <BottomSheetModalProvider>
                            <ThemeProvider value={DefaultTheme}>
                                <Stack>
                                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                                    <Stack.Screen name="+not-found" />
                                </Stack>
                                {/* <StatusBar style="auto" /> */}
                            </ThemeProvider>
                        </BottomSheetModalProvider>
                    </GestureHandlerRootView>
                </QueryClientProvider>
            </ErrorBoundary>
        </KeyboardProvider>
    )
}
