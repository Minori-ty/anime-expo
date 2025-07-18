import { Tabs } from 'expo-router'
import React from 'react'
import { Platform } from 'react-native'

import { HapticTab } from '@/components/HapticTab'
import { IconSymbol } from '@/components/ui/IconSymbol'
import TabBarBackground from '@/components/ui/TabBarBackground'

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: '',
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
                    tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
                }}
            />
            <Tabs.Screen
                name="myAnime"
                options={{
                    title: '我的追番',
                    tabBarIcon: ({ color }) => <IconSymbol size={28} name="bookmark.fill" color={color} />,
                }}
            />
            <Tabs.Screen
                name="me"
                options={{
                    title: '我的',
                    tabBarIcon: ({ color }) => <IconSymbol size={28} name="bookmark.fill" color={color} />,
                }}
            />
        </Tabs>
    )
}
