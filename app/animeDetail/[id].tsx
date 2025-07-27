import { handleGetAnimeById } from '@/api/anime'
import { handleClearCalendarByAnimeId, handleCreateAndBindCalendar, hasCalendar } from '@/api/calendar'
import Loading from '@/components/lottie/Loading'
import Icon from '@/components/ui/Icon'
import { IconSymbol } from '@/components/ui/IconSymbol'
import { EStatus, EWeekday } from '@/enums'
import { blurhash, themeColorPurple } from '@/styles'
import { cn } from '@/utils/nativewind'
import { queryClient } from '@/utils/react-query'
import { getStatus } from '@/utils/time'
import { useMutation, useQuery } from '@tanstack/react-query'
import { type ClassValue } from 'clsx'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import { Image } from 'expo-image'
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router'
import { debounce } from 'lodash-es'
import React, { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import DateTimePicker, {
    type CalendarComponents,
    type CalendarDay,
    type DateType,
    useDefaultStyles,
} from 'react-native-ui-datepicker'

interface IAnimeDetailContext {
    firstEpisodeYYYYMMDDHHmm: string
    currentEpisode: number
    totalEpisode: number
}
const animeDetailContext = createContext<IAnimeDetailContext | null>(null)

const useAnimeDetailContext = () => {
    const ctx = useContext(animeDetailContext)
    if (!ctx) throw new Error('缺少provider')
    return ctx
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
            firstEpisodeYYYYMMDDHHmm: dayjs().format('YYYY-MM-DD HH:mm'),
            lastEpisodeYYYYMMDDHHmm: dayjs().format('YYYY-MM-DD HH:mm'),
            status: EStatus.serializing,
            updateTimeHHmm: '',
        },
        isLoading,
    } = useQuery({
        queryKey: ['anime-detail', id],
        queryFn: () => handleGetAnimeById(Number(id)),
    })

    const [firstEpisodeYYYYMMDDHHmm, setFirstEpisodeYYYYMMDDHHmm] = useState<DateType>(
        anime.firstEpisodeYYYYMMDDHHmm && dayjs().format('YYYY-MM-DD HH:mm')
    )
    useEffect(() => {
        setFirstEpisodeYYYYMMDDHHmm(anime.firstEpisodeYYYYMMDDHHmm)
    }, [isLoading, anime])

    const handlePress = useCallback(() => {
        const debounceHandler = debounce(
            () => {
                router.push(`/editAnime/${anime.id}`)
            },
            300,
            { leading: true, trailing: false }
        )

        debounceHandler()

        return () => debounceHandler.cancel()
    }, [router, anime.id])

    /** 添加订阅 */
    const { mutate: handleCreateAndBindCalendarMution, isPending: isHandleCreateAndBindCalendarMutionLoading } =
        useMutation({
            mutationFn: handleCreateAndBindCalendar,
            onSuccess: () => {
                queryClient.invalidateQueries({
                    queryKey: ['anime-calendar', id],
                })
                queryClient.invalidateQueries({
                    queryKey: ['settings-calendar'],
                })
            },
            onError: err => {
                alert(`创建日历失败 ${err}`)
            },
        })

    /** 添加订阅 */
    const handleSubscribe = useCallback(() => {
        const debounceHandler = debounce(
            () => {
                handleCreateAndBindCalendarMution({
                    animeId: Number(id),
                    ...anime,
                    firstEpisodeTimestamp: dayjs(anime.firstEpisodeYYYYMMDDHHmm, 'YYYY-MM-DD HH:mm').unix(),
                })
            },
            300,
            {
                leading: true,
                trailing: false,
            }
        )

        debounceHandler()

        return () => debounceHandler.cancel()
    }, [anime, id, handleCreateAndBindCalendarMution])

    /** 删除订阅 */
    const { mutate: handleClearCalendarByAnimeIdMution, isPending: isHandleClearCalendarByAnimeIdMutionLoading } =
        useMutation({
            mutationFn: handleClearCalendarByAnimeId,
            onSuccess: () => {
                queryClient.invalidateQueries({
                    queryKey: ['anime-calendar', id],
                })
                queryClient.invalidateQueries({
                    queryKey: ['settings-calendar'],
                })
            },
            onError: err => {},
        })

    /** 删除订阅 */
    const handleUnsubscribe = useCallback(() => {
        const debounceHandler = debounce(
            () => {
                handleClearCalendarByAnimeIdMution(Number(id))
            },
            300,
            { leading: true, trailing: false }
        )

        debounceHandler()

        return () => debounceHandler.cancel()
    }, [id, handleClearCalendarByAnimeIdMution])

    const status = useMemo<typeof EStatus.valueType>(() => {
        const firstEpisodeTimestamp = dayjs(anime.firstEpisodeYYYYMMDDHHmm).second(0).unix()
        const lastEpisodeTimestamp = dayjs(anime.lastEpisodeYYYYMMDDHHmm).second(0).unix()
        return getStatus(firstEpisodeTimestamp, lastEpisodeTimestamp)
    }, [anime.firstEpisodeYYYYMMDDHHmm, anime.lastEpisodeYYYYMMDDHHmm])

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

    const { data: calendar = false, isLoading: isGetCalendarLoading } = useQuery({
        queryKey: ['anime-calendar', id],
        queryFn: () => hasCalendar(Number(id)),
        refetchOnWindowFocus: true,
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

    function onRefetch() {
        queryClient.invalidateQueries({
            queryKey: ['anime-calendar', id],
        })
        queryClient.invalidateQueries({
            queryKey: ['anime-detail', id],
        })
        queryClient.invalidateQueries({ queryKey: ['update-anime-currentEpisode'] })
    }

    return (
        <View className="flex-1 bg-gray-50">
            {/* Header */}
            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isLoading}
                        onRefresh={onRefetch}
                        className="text-theme"
                        colors={[themeColorPurple]}
                    />
                }
            >
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
                                    transition={500}
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
                                    <Icon name="CalendarClock" size={14} className="text-white" />
                                </View>
                                <View className="flex-1">
                                    <Text className="font-medium text-gray-900">每周更新</Text>
                                    <Text className="text-sm text-gray-600">
                                        {EWeekday.raw(anime.updateWeekday).label}{' '}
                                        {dayjs(anime.firstEpisodeYYYYMMDDHHmm).format('HH:mm')}
                                    </Text>
                                </View>
                            </View>

                            <View className="my-3 flex-row items-center rounded-xl bg-green-50 px-4 py-3">
                                <View className="mr-3 size-8 items-center justify-center rounded-full bg-green-500">
                                    <Icon name="Clock" size={14} className="text-white" />
                                </View>
                                <View className="flex-1">
                                    <Text className="font-medium text-gray-900">首播时间</Text>
                                    <Text className="text-sm text-gray-600">{anime.firstEpisodeYYYYMMDDHHmm}</Text>
                                </View>
                            </View>

                            <View className="flex-row items-center rounded-xl bg-orange-50 px-4 py-3">
                                <View className="mr-3 size-8 items-center justify-center rounded-full bg-orange-500">
                                    <Icon name="CalendarCheck" size={14} className="text-white" />
                                </View>
                                <View className="flex-1">
                                    <Text className="font-medium text-gray-900">完结时间</Text>
                                    <Text className="text-sm text-gray-600">{anime.lastEpisodeYYYYMMDDHHmm}</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* 有完结的时候才显示这个订阅 */}
                    {status !== EStatus.completed && !calendar && (
                        <View className="mt-2 bg-white p-6">
                            <TouchableOpacity
                                className={cn(
                                    'mt-3 flex-row items-center justify-center rounded-xl bg-green-500 py-4',
                                    isGetCalendarLoading && 'bg-gray-400'
                                )}
                                activeOpacity={0.5}
                                onPress={handleSubscribe}
                                disabled={isHandleCreateAndBindCalendarMutionLoading}
                            >
                                <Icon name="Bell" className="mr-2 text-white" size={20} />
                                <Text className="font-medium text-white">设置更新提醒</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {status !== EStatus.completed && calendar && (
                        <View className="mt-2 bg-white p-6">
                            <TouchableOpacity
                                className={cn(
                                    'mt-3 flex-row items-center justify-center rounded-xl bg-red-500 py-4',
                                    isGetCalendarLoading && 'bg-gray-400'
                                )}
                                activeOpacity={0.5}
                                onPress={handleUnsubscribe}
                                disabled={isHandleClearCalendarByAnimeIdMutionLoading}
                            >
                                <Icon name="BellOff" className="mr-2 text-white" size={20} />
                                <Text className="font-medium text-white">取消更新提醒</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    <View className="mb-16 mt-2 rounded-md bg-white px-10 py-5">
                        <DateTimePicker
                            styles={defaultStyles}
                            mode="single"
                            date={firstEpisodeYYYYMMDDHHmm}
                            onChange={day => setFirstEpisodeYYYYMMDDHHmm(day.date)}
                            firstDayOfWeek={1}
                            multiRangeMode
                            showOutsideDays
                            locale="zh"
                            components={components}
                        />
                        <View className="h-16 items-end">
                            {dayjs(firstEpisodeYYYYMMDDHHmm).format('YYYY-MM-DD') !== dayjs().format('YYYY-MM-DD') && (
                                <TouchableOpacity
                                    // eslint-disable-next-line tailwindcss/no-custom-classname
                                    className="elevation-lg size-16 items-center justify-center rounded-full bg-blue-500"
                                    onPress={() => setFirstEpisodeYYYYMMDDHHmm(dayjs())}
                                    activeOpacity={0.5}
                                >
                                    <Text className="text-3xl text-white">今</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </animeDetailContext.Provider>
            </ScrollView>
        </View>
    )
}

export default AnimeDetail

function Day({ day }: { day: CalendarDay }) {
    const { isSelected, isCurrentMonth, isToday } = day
    const { totalEpisode, firstEpisodeYYYYMMDDHHmm, currentEpisode } = useAnimeDetailContext()

    const episode = useMemo(() => {
        return checkEpisodeUpdate({ date: day.date, totalEpisode, firstEpisodeYYYYMMDDHHmm, currentEpisode })
    }, [day.date, totalEpisode, firstEpisodeYYYYMMDDHHmm, currentEpisode])

    return (
        <View
            className={cn(
                'relative w-full flex-1 items-center rounded border border-transparent bg-white',
                isSelected && 'border border-blue-500',
                isSelected && isToday && 'bg-blue-500'
            )}
        >
            <Text
                className={cn(
                    'font-archivo text-foreground top-2',
                    !isCurrentMonth && 'text-gray-200',
                    isSelected && isToday && 'text-white',
                    !isSelected && isToday && 'text-blue-500'
                )}
            >
                {day.text}
            </Text>
            {
                <View className="absolute bottom-2 w-full">
                    <Text
                        style={styles.episodeText}
                        className={cn(
                            'font-archivo text-foreground text-center',
                            !isCurrentMonth && 'text-gray-200',
                            isSelected && isToday && 'text-white',
                            episode && 'text-orange-500'
                        )}
                    >
                        {episode}
                    </Text>
                </View>
            }
        </View>
    )
}

interface ICheckEpisodeUpdate {
    firstEpisodeYYYYMMDDHHmm: string
    totalEpisode: number
    date: string
    currentEpisode: number
}
function checkEpisodeUpdate({ date, firstEpisodeYYYYMMDDHHmm, totalEpisode }: ICheckEpisodeUpdate): string {
    const firstDate = dayjs(firstEpisodeYYYYMMDDHHmm, 'YYYYMMDDHHmm')
    const targetDate = dayjs(date)

    // 计算 targetDate 与 firstDate 相差的周数
    const diffInWeeks = targetDate.startOf('day').diff(firstDate.startOf('day'), 'week')

    if (diffInWeeks < 0 || diffInWeeks >= totalEpisode) {
        return ''
    }

    const expectedUpdateDate = firstDate.add(diffInWeeks, 'week')

    // 判断是否与某一集的更新时间相同（只比较年月日）
    if (targetDate.isSame(expectedUpdateDate, 'day')) {
        return `第${diffInWeeks + 1}集` // 集数从 1 开始
    }

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
