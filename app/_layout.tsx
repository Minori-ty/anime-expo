import { registerBackgroundTask, taskDefined } from '@/backgroundTasks'
import Error from '@/components/lottie/Error'
import Loading from '@/components/lottie/Loading'
import Modal from '@/components/Modal/Modal'
import { db, expo } from '@/db'
import migrations from '@/drizzle/migrations'
import { useAppStateRefresh } from '@/hooks/useAppStateRefresh'
import { getCalendarPermission, getNotificationPermission } from '@/permissions'
import '@/styles/global.css'
import { queryClient } from '@/utils/react-query'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { QueryClientProvider } from '@tanstack/react-query'
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator'
import { useDrizzleStudio } from 'expo-drizzle-studio-plugin'
import { useFonts } from 'expo-font'
import * as Notifications from 'expo-notifications'
import { Stack } from 'expo-router'
import { startTransition, useEffect } from 'react'
import { Text } from 'react-native'
import ErrorBoundary from 'react-native-error-boundary'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { KeyboardProvider } from 'react-native-keyboard-controller'
import 'react-native-reanimated'
import Toast from 'react-native-toast-message'

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

    useEffect(() => {}, [])

    startTransition(() => {
        getNotificationPermission()
        getCalendarPermission()
        registerBackgroundTask()
    })
    useAppStateRefresh()

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
                                <Toast />
                                <Modal />
                                {/* <StatusBar style="auto" /> */}
                            </ThemeProvider>
                        </BottomSheetModalProvider>
                    </GestureHandlerRootView>
                </QueryClientProvider>
            </ErrorBoundary>
        </KeyboardProvider>
    )
}
