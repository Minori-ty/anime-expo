import { getAnimeById } from '@/api'
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
import React, { useLayoutEffect, useMemo } from 'react'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

// export default function AnimeDetail() {
//     const { id } = useLocalSearchParams<{ id: string }>()
//     const navigation = useNavigation()
//     const router = useRouter()

//     const {
//         data: anime = {
//             firstEpisodeDateTime: '-',
//             lastEpisodeDateTime: '-',
//             createdAt: '-',
//             id: -1,
//             name: '-',
//             updateWeekday: EWeekday.monday,
//             updateTimeHHmm: '-',
//             currentEpisode: 0,
//             totalEpisode: 0,
//             status: EStatus.serializing,
//             cover: '-',
//         },
//     } = useQuery({
//         queryKey: ['anime-detail'],
//         queryFn: () => {},
//     })

//     useLayoutEffect(() => {
//         navigation.setOptions({
//             headerTitle: '动漫详情',
//             headerTitleAlign: 'center',
//             headerRight: () => {
//                 return (
//                     <TouchableOpacity onPress={() => router.push(`/editAnime/${anime.id}`)}>
//                         <IconSymbol size={28} name="text.append" color={'black'} />
//                     </TouchableOpacity>
//                 )
//             },
//         })
//     }, [navigation, , anime.id, router])
//     return (
//         <SafeAreaView className="flex-1 bg-white">
//             <ScrollView className="pb-5">
//                 <View className="h-64 w-full overflow-hidden">
//                     <Image
//                         source={{ uri: anime.cover }}
//                         style={styles.cover}
//                         contentFit="cover"
//                         placeholder={{ blurhash }}
//                     />
//                 </View>

//                 <View>

//                 </View>
//             </ScrollView>
//         </SafeAreaView>
//     )
// }

// const styles = StyleSheet.create({
//     cover: {
//         width: '100%',
//         height: '100%',
//     },
// })

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
        queryFn: () => getAnimeById(Number(id)),
    })

    useLayoutEffect(() => {
        navigation.setOptions({
            headerTitle: '动漫详情',
            headerTitleAlign: 'center',
            headerRight: () => {
                return (
                    <TouchableOpacity onPress={() => router.push(`/editAnime/${anime.id}`)}>
                        <IconSymbol size={28} name="text.append" color={'black'} />
                    </TouchableOpacity>
                )
            },
        })
    }, [navigation, , anime.id, router])

    const progress = useMemo(() => {
        return Math.round((anime.currentEpisode / anime.totalEpisode) * 100)
    }, [anime.currentEpisode, anime.totalEpisode])

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
    return (
        <View className="flex-1 bg-gray-50">
            {/* Header */}

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
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

                {/* Bottom Spacing */}
                <View className="h-8" />
            </ScrollView>
        </View>
    )
}

export default AnimeDetail

const styles = StyleSheet.create({
    cover: {
        width: 128,
        height: 192,
        borderRadius: 12,
    },
})
