import { getAnime, getSchedule } from '@/api'
import Empty from '@/components/lottie/Empty'
import { EWeekday } from '@/enums'
import { blurhash } from '@/styles'
import { TAnimeList } from '@/types'
import { isCurrentWeekdayUpdateTimePassed } from '@/utils/time'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import isoWeek from 'dayjs/plugin/isoWeek'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import React, { createContext, useContext, useState } from 'react'
import { Dimensions, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { SceneMap, TabBar, TabView } from 'react-native-tab-view'

dayjs.extend(customParseFormat)
dayjs.extend(isSameOrBefore)
dayjs.extend(isoWeek)

interface IScheduleContext {
    list: Awaited<ReturnType<typeof getAnime>>
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
    monday: () => <TabViewComponent updateWeekday={EWeekday.monday} />,
    tuesday: () => <TabViewComponent updateWeekday={EWeekday.tuesday} />,
    wednesday: () => <TabViewComponent updateWeekday={EWeekday.wednesday} />,
    thursday: () => <TabViewComponent updateWeekday={EWeekday.thursday} />,
    friday: () => <TabViewComponent updateWeekday={EWeekday.friday} />,
    saturday: () => <TabViewComponent updateWeekday={EWeekday.saturday} />,
    sunday: () => <TabViewComponent updateWeekday={EWeekday.sunday} />,
})
export default function Index() {
    const [index, setIndex] = useState<number>(EWeekday.monday)

    const { data: list = [] } = useQuery({
        queryFn: getSchedule,
        queryKey: ['schedule'],
    })

    return (
        <SafeAreaView edges={['top']}>
            <scheduleContext.Provider value={{ list }}>
                <TabView
                    navigationState={{ index, routes }}
                    renderScene={renderScene}
                    onIndexChange={setIndex}
                    initialLayout={{ width: Dimensions.get('window').width }}
                    renderTabBar={props => (
                        <TabBar {...props} scrollEnabled activeColor="#fb7299" inactiveColor="#9E9E9E" />
                    )}
                ></TabView>
            </scheduleContext.Provider>
        </SafeAreaView>
    )
}

function TabViewComponent({ updateWeekday }: { updateWeekday: typeof EWeekday.valueType }) {
    const { list } = useSchedule()
    const animeList = list.filter(item => dayjs(item.firstEpisodeYYYYMMDDHHmm).isoWeekday() === updateWeekday)
    if (!animeList.length) {
        return <Empty />
    }

    const mapSchedule: Record<string, TAnimeList> = {}
    animeList.forEach(item => {
        if (mapSchedule[item.updateTimeHHmm]) {
            mapSchedule[item.updateTimeHHmm].push(item)
        } else {
            mapSchedule[item.updateTimeHHmm] = [item]
        }
    })

    const updateTimeHHmmList = Object.keys(mapSchedule)
    const sortedTimes = updateTimeHHmmList.sort((a, b) => {
        const timeA = dayjs(`${dayjs().format('YYYY-MM-DD')} ${a}`).unix()
        const timeB = dayjs(`${dayjs().format('YYYY-MM-DD')} ${b}`).unix()
        return timeA - timeB
    })

    return (
        <ScrollView showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}>
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
    const router = useRouter()

    return (
        <View>
            <View>
                <Text>{time}</Text>
            </View>
            <View>
                {animeList.map(item => {
                    return (
                        <TouchableOpacity key={item.id} onPress={() => router.push(`/animeDetail/${item.id}`)}>
                            <View>
                                <Image
                                    source={item.cover}
                                    placeholder={{ blurhash }}
                                    contentFit="cover"
                                    transition={1000}
                                    cachePolicy={'memory-disk'}
                                />
                                <View>
                                    <Text>{item.name}</Text>
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
        return <Text>更新到 第{currentEpisode}集</Text>
    }
    return <Text>即将更新 第{currentEpisode + 1}集</Text>
}
