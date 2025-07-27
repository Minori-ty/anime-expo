import { getScheduleList } from '@/api/schedule'
import Empty from '@/components/lottie/Empty'
import Loading from '@/components/lottie/Loading'
import { EWeekday } from '@/enums'
import { blurhash, themeColorPurple } from '@/styles'
import type { TAnimeList } from '@/types'
import { queryClient } from '@/utils/react-query'
import { isCurrentWeekdayUpdateTimePassed } from '@/utils/time'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import isoWeek from 'dayjs/plugin/isoWeek'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import utc from 'dayjs/plugin/utc'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import React, { createContext, useContext, useState } from 'react'
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { SceneMap, TabBar, TabView } from 'react-native-tab-view'

dayjs.extend(customParseFormat)
dayjs.extend(isSameOrBefore)
dayjs.extend(isoWeek)
dayjs.extend(utc)
dayjs.extend(isSameOrAfter)

interface IScheduleContext {
    list: TAnimeList
}

const scheduleContext = createContext<IScheduleContext | null>(null)

const useSchedule = () => {
    const ctx = useContext(scheduleContext)
    if (!ctx) throw new Error('缺少provider')
    return ctx
}

const routes = EWeekday.toMenu().map(item => {
    return {
        key: item.key,
        title: item.label,
    }
})

const renderScene = SceneMap({
    [EWeekday.monday]: () => <TabViewComponent updateWeekday={EWeekday.monday} />,
    [EWeekday.tuesday]: () => <TabViewComponent updateWeekday={EWeekday.tuesday} />,
    [EWeekday.wednesday]: () => <TabViewComponent updateWeekday={EWeekday.wednesday} />,
    [EWeekday.thursday]: () => <TabViewComponent updateWeekday={EWeekday.thursday} />,
    [EWeekday.friday]: () => <TabViewComponent updateWeekday={EWeekday.friday} />,
    [EWeekday.saturday]: () => <TabViewComponent updateWeekday={EWeekday.saturday} />,
    [EWeekday.sunday]: () => <TabViewComponent updateWeekday={EWeekday.sunday} />,
})
export default function Index() {
    const [index, setIndex] = useState<number>(dayjs().isoWeekday() - 1)

    const { data: list = [] } = useQuery({
        queryFn: getScheduleList,
        queryKey: ['schedule'],
    })

    return (
        <SafeAreaView edges={['top']} className="flex-1 bg-white">
            <scheduleContext.Provider value={{ list }}>
                <TabView
                    navigationState={{ index, routes }}
                    renderScene={renderScene}
                    onIndexChange={setIndex}
                    overScrollMode={'auto'}
                    renderTabBar={props => (
                        <TabBar
                            {...props}
                            scrollEnabled
                            activeColor={themeColorPurple}
                            inactiveColor="#9E9E9E"
                            tabStyle={styles.tabBarTab}
                            style={styles.tabBar}
                        />
                    )}
                />
            </scheduleContext.Provider>
        </SafeAreaView>
    )
}

function TabViewComponent({ updateWeekday }: { updateWeekday: typeof EWeekday.valueType }) {
    const { list } = useSchedule()
    const animeList = list.filter(item => dayjs(item.firstEpisodeYYYYMMDDHHmm).isoWeekday() === updateWeekday)
    const queryState = queryClient.getQueryState(['my-anime'])

    const isLoading = queryState?.fetchStatus === 'fetching'
    function refetch() {
        queryClient.invalidateQueries({ queryKey: ['my-anime'] })
    }
    if (animeList.length === 0) {
        return (
            <ScrollView
                contentContainerStyle={styles.center}
                refreshControl={
                    <RefreshControl
                        refreshing={isLoading}
                        onRefresh={refetch}
                        className="text-theme"
                        colors={[themeColorPurple]}
                    />
                }
            >
                {isLoading ? <Loading /> : <Empty />}
            </ScrollView>
        )
    }

    const mapSchedule: Record<string, TAnimeList> = {}
    animeList.forEach(item => {
        const HHmm = dayjs(item.firstEpisodeYYYYMMDDHHmm, 'YYYY-MM-DD HH:mm').format('HH:mm')
        if (mapSchedule[HHmm]) {
            mapSchedule[HHmm].push(item)
        } else {
            mapSchedule[HHmm] = [item]
        }
    })

    const updateTimeHHmmList = Object.keys(mapSchedule)
    const sortedTimes = updateTimeHHmmList.sort((a, b) => {
        const timeA = dayjs(`${dayjs().format('YYYY-MM-DD')} ${a}`).unix()
        const timeB = dayjs(`${dayjs().format('YYYY-MM-DD')} ${b}`).unix()
        return timeA - timeB
    })

    return (
        <ScrollView
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
            refreshControl={
                <RefreshControl
                    refreshing={isLoading}
                    onRefresh={refetch}
                    className="text-theme"
                    colors={[themeColorPurple]}
                />
            }
        >
            {sortedTimes.map((time, index) => {
                return <AnimeCardItem time={time} animeList={mapSchedule[time]} key={index} />
            })}
        </ScrollView>
    )
}
interface IAnimeCardItemProps {
    time: string
    animeList: TAnimeList
}

function AnimeCardItem({ time, animeList }: IAnimeCardItemProps) {
    return (
        <View className="my-2 flex-row">
            <View className="w-16 items-center justify-start">
                <Text className="font-medium">{time}</Text>
            </View>
            <View className="flex-1">
                {animeList.map(item => {
                    return (
                        <TouchableOpacity
                            key={item.id}
                            activeOpacity={0.5}
                            onPress={() => router.push(`/animeDetail/${item.id}`)}
                        >
                            <View className="mb-3 h-28 flex-1 flex-row">
                                <Image
                                    source={item.cover}
                                    placeholder={{ blurhash }}
                                    contentFit="cover"
                                    transition={1000}
                                    cachePolicy={'memory-disk'}
                                    style={styles.cover}
                                />
                                <View className="flex-1">
                                    <Text className="font-black">{item.name}</Text>
                                    <EpisodeTip
                                        currentEpisode={item.currentEpisode}
                                        firstEpisodeYYYYMMDDHHmm={item.firstEpisodeYYYYMMDDHHmm}
                                    />
                                </View>
                            </View>
                        </TouchableOpacity>
                    )
                })}
            </View>
        </View>
    )
}

interface IEpisodeTipProps {
    currentEpisode: number
    firstEpisodeYYYYMMDDHHmm: string
}
function EpisodeTip({ currentEpisode, firstEpisodeYYYYMMDDHHmm }: IEpisodeTipProps) {
    if (isCurrentWeekdayUpdateTimePassed(firstEpisodeYYYYMMDDHHmm)) {
        return <Text className="mt-3 text-sm text-[#fb7299]">更新到 第{currentEpisode}集</Text>
    }
    return <Text className="mt-3 text-sm text-[#9E9E9E]">即将更新 第{currentEpisode + 1}集</Text>
}

const styles = StyleSheet.create({
    tabBar: {
        elevation: 0, // 移除 Android 阴影
        shadowOpacity: 0, // 移除 iOS 阴影
        shadowRadius: 0, // 移除 iOS 阴影
        shadowOffset: { height: 0, width: 0 }, // 移除 iOS 阴影
        borderBottomWidth: 0, // 移除可能的底部边框
        backgroundColor: '#fff',
    },
    tabBarTab: {
        width: 80,
        backgroundColor: '#fff',
    },
    cover: {
        width: 70,
        borderRadius: 5,
        marginRight: 10,
        height: 70 * 1.5,
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
    },
})
