import { handleGetAnimeById } from '@/api/anime'
import { hasCalendar } from '@/api/calendar'
import Loading from '@/components/lottie/Loading'
import { IconSymbol } from '@/components/ui/IconSymbol'
import { EStatus, EWeekday } from '@/enums'
import { blurhash } from '@/styles'
import { cn } from '@/utils/nativewind'
import { useQuery } from '@tanstack/react-query'
import { type ClassValue } from 'clsx'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import { Image } from 'expo-image'
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router'
import { throttle } from 'lodash-es'
import React, { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import DateTimePicker, {
    type CalendarComponents,
    type CalendarDay,
    type DateType,
    useDefaultStyles,
} from 'react-native-ui-datepicker'

const animeDetailContext = createContext<IAnimeDetailContext | null>(null)

const useAnimeDetailContext = () => {
    const ctx = useContext(animeDetailContext)
    if (!ctx) throw new Error('缺少provider')
    return ctx
}

interface IAnimeDetailContext {
    firstEpisodeYYYYMMDDHHmm: string
    currentEpisode: number
    totalEpisode: number
}
function AnimeDetail() {
    const { id } = useLocalSearchParams<{ id: string }>()
    const navigation = useNavigation()
    const router = useRouter()

    const {
        data: anime = {
            id: -1,
            name: '',
            currentEpisode: 0,
            totalEpisode: 0,
            cover: '',
            updateWeekday: EWeekday.monday,
            firstEpisodeYYYYMMDDHHmm: '',
            lastEpisodeYYYYMMDDHHmm: '',
            status: EStatus.serializing,
            updateTimeHHmm: '',
        },
        isLoading,
    } = useQuery({
        queryKey: ['anime-detail', id],
        queryFn: () => handleGetAnimeById(Number(id)),
    })

    const [date, setDate] = useState<DateType>(anime.firstEpisodeYYYYMMDDHHmm && dayjs().format('YYYY-MM-DD HH:mm'))
    useEffect(() => {
        setDate(anime.firstEpisodeYYYYMMDDHHmm)
    }, [isLoading, anime])

    const handlePress = useCallback(() => {
        const throttledPush = throttle(() => {
            router.push(`/editAnime/${anime.id}`)
        }, 300)

        throttledPush()

        return () => throttledPush.cancel()
    }, [router, anime.id])

    useLayoutEffect(() => {
        navigation.setOptions({
            headerTitle: '动漫详情',
            headerTitleAlign: 'center',
            headerRight: () => {
                return (
                    <TouchableOpacity onPress={handlePress}>
                        <IconSymbol size={28} name="text.append" color={'black'} />
                    </TouchableOpacity>
                )
            },
        })
    }, [navigation, handlePress])

    const progress = useMemo(() => {
        return Math.round((anime.currentEpisode / anime.totalEpisode) * 100)
    }, [anime.currentEpisode, anime.totalEpisode])

    const defaultStyles = useDefaultStyles()

    const { data: calendar = false } = useQuery({
        queryKey: ['anime-calendar', id],
        queryFn: () => hasCalendar(Number(id)),
    })

    if (isLoading || !anime) {
        return <Loading />
    }

    const mapColor: Record<typeof EStatus.valueType, { bgColor: ClassValue; textColor: ClassValue }> = {
        [EStatus.completed]: {
            bgColor: 'bg-red-100',
            textColor: 'text-red-900',
        },
        [EStatus.serializing]: {
            bgColor: 'bg-green-100',
            textColor: 'text-green-900',
        },
        [EStatus.toBeUpdated]: {
            bgColor: 'bg-orange-100',
            textColor: 'text-orange-900',
        },
    }
    const components: CalendarComponents = {
        Day: (day: CalendarDay) => <Day day={day} />,
    }

    return (
        <View className="flex-1 bg-gray-50">
            {/* Header */}
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                <animeDetailContext.Provider
                    value={{
                        firstEpisodeYYYYMMDDHHmm: anime.firstEpisodeYYYYMMDDHHmm,
                        currentEpisode: anime.currentEpisode,
                        totalEpisode: anime.totalEpisode,
                    }}
                >
                    {/* Cover Image Section */}
                    <View className="bg-white">
                        <View className="flex-row p-6">
                            {/* Cover Image */}
                            <View className="mr-4">
                                <Image
                                    source={anime.cover}
                                    placeholder={{ blurhash }}
                                    contentFit="cover"
                                    transition={1000}
                                    cachePolicy={'memory-disk'}
                                    style={styles.cover}
                                />
                                {/* Status Badge */}
                                <View
                                    className={cn(
                                        `absolute -right-2 -top-2 rounded-full px-2 py-1`,
                                        mapColor[anime.status].bgColor
                                    )}
                                >
                                    <Text className={cn(`text-xs font-medium`, mapColor[anime.status].textColor)}>
                                        {EStatus.raw(anime.status).label}
                                    </Text>
                                </View>
                            </View>

                            {/* Basic Info */}
                            <View className="flex-1">
                                <Text className="mb-3 text-xl font-bold leading-6 text-gray-900">{anime.name}</Text>

                                {/* Progress Info */}
                                <View className="mb-4">
                                    <View className="mb-2 flex-row items-center justify-between">
                                        <Text className="text-sm text-gray-600">更新进度</Text>
                                        <Text className="text-sm font-medium text-blue-600">
                                            {anime.currentEpisode} / {anime.totalEpisode} 集
                                        </Text>
                                    </View>
                                    <View className="h-2 overflow-hidden rounded-full bg-gray-200">
                                        <View
                                            className="h-full rounded-full bg-blue-500"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </View>
                                    <Text className="mt-1 text-xs text-gray-500">完成度 {progress}%</Text>
                                </View>

                                {/* Quick Stats */}
                                <View className="flex-row justify-between">
                                    <View className="items-center">
                                        <Text className="text-lg font-bold text-blue-600">{anime.totalEpisode}</Text>
                                        <Text className="text-xs text-gray-500">总集数</Text>
                                    </View>
                                    <View className="items-center">
                                        <Text className="text-lg font-bold text-green-600">{anime.currentEpisode}</Text>
                                        <Text className="text-xs text-gray-500">已更新</Text>
                                    </View>
                                    <View className="items-center">
                                        <Text className="text-lg font-bold text-orange-600">
                                            {EWeekday.raw(anime.updateWeekday).label}
                                        </Text>
                                        <Text className="text-xs text-gray-500">更新日</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Update Schedule */}
                    <View className="mt-2 bg-white p-6">
                        <Text className="mb-4 text-lg font-semibold text-gray-900">更新时间表</Text>

                        <View className="space-y-4">
                            <View className="flex-row items-center rounded-xl bg-blue-50 px-4 py-3">
                                <View className="mr-3 size-8 items-center justify-center rounded-full bg-blue-500">
                                    <Text className="text-sm text-white">📅</Text>
                                </View>
                                <View className="flex-1">
                                    <Text className="font-medium text-gray-900">每周更新</Text>
                                    <Text className="text-sm text-gray-600">
                                        {EWeekday.raw(anime.updateWeekday).label}{' '}
                                        {dayjs(anime.updateTimeHHmm).format('HH:mm')}
                                    </Text>
                                </View>
                            </View>

                            <View className="my-3 flex-row items-center rounded-xl bg-green-50 px-4 py-3">
                                <View className="mr-3 size-8 items-center justify-center rounded-full bg-green-500">
                                    <Text className="text-sm text-white">🎬</Text>
                                </View>
                                <View className="flex-1">
                                    <Text className="font-medium text-gray-900">首播时间</Text>
                                    <Text className="text-sm text-gray-600">{anime.firstEpisodeYYYYMMDDHHmm}</Text>
                                </View>
                            </View>

                            <View className="flex-row items-center rounded-xl bg-orange-50 px-4 py-3">
                                <View className="mr-3 size-8 items-center justify-center rounded-full bg-orange-500">
                                    <Text className="text-sm text-white">🆕</Text>
                                </View>
                                <View className="flex-1">
                                    <Text className="font-medium text-gray-900">结局时间</Text>
                                    <Text className="text-sm text-gray-600">{anime.lastEpisodeYYYYMMDDHHmm}</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* 有完结的时候才显示这个订阅 */}
                    {!calendar && (
                        <View className="mt-2 bg-white p-6">
                            <TouchableOpacity
                                className="mt-3 flex-row items-center justify-center rounded-xl bg-green-500 py-4"
                                activeOpacity={0.5}
                            >
                                <Text className="mr-2 text-lg text-white">🔔</Text>
                                <Text className="font-medium text-white">设置更新提醒</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {calendar && (
                        <View className="mt-2 bg-white p-6">
                            <TouchableOpacity
                                className="mt-3 flex-row items-center justify-center rounded-xl bg-red-500 py-4"
                                activeOpacity={0.5}
                            >
                                <Text className="mr-2 text-lg text-white">🔕</Text>
                                <Text className="font-medium text-white">取消更新提醒</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    <View className="mb-16 mt-2 rounded-md bg-white px-10 py-5">
                        <DateTimePicker
                            styles={defaultStyles}
                            mode="single"
                            date={date}
                            onChange={day => setDate(day.date)}
                            firstDayOfWeek={1}
                            multiRangeMode
                            showOutsideDays
                            locale="zh"
                            components={components}
                        />
                    </View>
                </animeDetailContext.Provider>
            </ScrollView>
        </View>
    )
}

export default AnimeDetail

function Day({ day }: { day: CalendarDay }) {
    const { isSelected, isCurrentMonth } = day
    const { totalEpisode, currentEpisode, firstEpisodeYYYYMMDDHHmm } = useAnimeDetailContext()

    const episode = useMemo(() => {
        return checkEpisodeUpdate({ date: day.date, totalEpisode, currentEpisode, firstEpisodeYYYYMMDDHHmm })
    }, [day.date, totalEpisode, currentEpisode, firstEpisodeYYYYMMDDHHmm])

    return (
        <View className="items-center">
            <Text
                className={cn(
                    'font-archivo text-foreground',
                    isSelected && 'text-white',
                    !isCurrentMonth && 'text-gray-200'
                )}
            >
                {day.text}
            </Text>
            {episode && (
                <View className="absolute -bottom-2 w-full">
                    <Text
                        style={styles.episodeText}
                        className={cn(
                            'font-archivo text-foreground text-center',
                            isSelected && 'text-white',
                            !isCurrentMonth && 'text-gray-200'
                        )}
                    >
                        {episode}
                    </Text>
                </View>
            )}
        </View>
    )
}

interface ICheckEpisodeUpdate {
    firstEpisodeYYYYMMDDHHmm: string
    currentEpisode: number
    totalEpisode: number
    date: string
}
function checkEpisodeUpdate({
    date,
    firstEpisodeYYYYMMDDHHmm,
    currentEpisode,
    totalEpisode,
}: ICheckEpisodeUpdate): string {
    // 使用Day.js解析输入日期
    const inputDate = dayjs(date)

    // 使用Day.js解析第一集日期（保持输入格式的灵活性）
    const firstDate = dayjs(firstEpisodeYYYYMMDDHHmm)

    // 计算输入日期与第一集日期之间的周数差（向下取整）
    const weeksDiff = Math.floor(inputDate.diff(firstDate, 'day') / 7)

    // 如果输入日期早于第一集或已超过总集数，返回空字符串
    if (inputDate.isBefore(firstDate) || weeksDiff + 1 > totalEpisode) {
        return ''
    }

    // 计算理论上的更新日期（第一集日期 + 周数差 * 7天）
    const theoreticalUpdateDate = firstDate.add(weeksDiff * 7, 'day')

    // 如果输入日期与理论更新日期相同，则为更新日
    if (inputDate.isSame(theoreticalUpdateDate, 'day')) {
        return `第${weeksDiff + 1}集`
    }

    // 非更新日返回空字符串
    return ''
}

const styles = StyleSheet.create({
    cover: {
        width: 128,
        height: 192,
        borderRadius: 12,
    },
    episodeText: {
        fontSize: 6,
    },
})
