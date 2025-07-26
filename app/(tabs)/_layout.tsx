import { Tabs } from 'expo-router'
import React from 'react'
import { Platform } from 'react-native'

import { HapticTab } from '@/components/HapticTab'
import Icon from '@/components/ui/Icon'
import TabBarBackground from '@/components/ui/TabBarBackground'
import { cn } from '@/utils/nativewind'

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: '#3b82f6',
                headerShown: false,
                tabBarButton: HapticTab,
                tabBarBackground: TabBarBackground,
                tabBarStyle: Platform.select({
                    ios: {
                        // Use a transparent background on iOS to show the blur effect
                        position: 'absolute',
                    },
                    default: {},
                }),
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: '更新表',
                    tabBarIcon: ({ color, focused }) => (
                        <Icon name="CalendarClock" className={cn('text-gray-500', focused && 'text-blue-500')} />
                    ),
                }}
            />
            <Tabs.Screen
                name="myAnime"
                options={{
                    title: '我的追番',
                    tabBarIcon: ({ color, focused }) => (
                        <Icon name="Heart" className={cn('text-gray-500', focused && 'text-blue-500')} />
                    ),
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: '数据管理',
                    tabBarIcon: ({ color, focused }) => (
                        <Icon name="Settings" className={cn('text-gray-500', focused && 'text-blue-500')} />
                    ),
                }}
            />
        </Tabs>
    )
}
