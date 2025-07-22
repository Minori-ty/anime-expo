// import { IconSymbol } from '@/components/ui/IconSymbol'
// import { EStatus, EWeekday } from '@/enums'
// import { blurhash } from '@/styles'
// import { useQuery } from '@tanstack/react-query'
// import 'dayjs/locale/zh-cn'
// import { Image } from 'expo-image'
// import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router'
// import React, { useLayoutEffect } from 'react'
// import { SafeAreaView, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native'

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
import React from 'react'
import { Image, ScrollView, Text, View } from 'react-native'

interface AnimeData {
    id: number
    name: string
    currentEpisode: number
    totalEpisode: number
    cover: string
    updateWeekday: 1 | 2 | 3 | 4 | 5 | 6 | 7
    firstEpisodeYYYYMMDDHHmm: string
    lastEpisodeYYYYMMDDHHmm: string
    status: 1 | 2 | 3 // 1: 连载中, 2: 已完结, 3: 即将更新
    updateTimeHHmm: string
}

function AnimeInfoPage() {
    // Sample data - replace with your actual data
    const animeData: AnimeData = {
        id: 1,
        name: '进击的巨人 最终季',
        currentEpisode: 12,
        totalEpisode: 24,
        cover: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop',
        updateWeekday: 7,
        firstEpisodeYYYYMMDDHHmm: '202301011200',
        lastEpisodeYYYYMMDDHHmm: '202312311200',
        status: 1,
        updateTimeHHmm: '1200',
    }

    const getWeekdayText = (weekday: number) => {
        const weekdays = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日']
        return weekdays[weekday]
    }

    const getStatusInfo = (status: number) => {
        const statusMap = {
            1: { text: '连载中', color: 'bg-green-100', textColor: 'text-green-700' },
            2: { text: '已完结', color: 'bg-gray-100', textColor: 'text-gray-700' },
            3: { text: '即将更新', color: 'bg-blue-100', textColor: 'text-blue-700' },
        }
        return statusMap[status as keyof typeof statusMap]
    }

    const formatDateTime = (dateTimeStr: string) => {
        const year = dateTimeStr.slice(0, 4)
        const month = dateTimeStr.slice(4, 6)
        const day = dateTimeStr.slice(6, 8)
        const hour = dateTimeStr.slice(8, 10)
        const minute = dateTimeStr.slice(10, 12)
        return `${year}年${month}月${day}日 ${hour}:${minute}`
    }

    const formatTime = (timeStr: string) => {
        const hour = timeStr.slice(0, 2)
        const minute = timeStr.slice(2, 4)
        return `${hour}:${minute}`
    }

    const statusInfo = getStatusInfo(animeData.status)
    const progress = (animeData.currentEpisode / animeData.totalEpisode) * 100

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
                                source={{ uri: animeData.cover }}
                                className="h-48 w-32 rounded-xl"
                                resizeMode="cover"
                            />
                            {/* Status Badge */}
                            <View className={`absolute -right-2 -top-2 rounded-full px-2 py-1 ${statusInfo.color}`}>
                                <Text className={`text-xs font-medium ${statusInfo.textColor}`}>{statusInfo.text}</Text>
                            </View>
                        </View>

                        {/* Basic Info */}
                        <View className="flex-1">
                            <Text className="mb-3 text-xl font-bold leading-6 text-gray-900">{animeData.name}</Text>

                            {/* Progress Info */}
                            <View className="mb-4">
                                <View className="mb-2 flex-row items-center justify-between">
                                    <Text className="text-sm text-gray-600">更新进度</Text>
                                    <Text className="text-sm font-medium text-blue-600">
                                        {animeData.currentEpisode} / {animeData.totalEpisode} 集
                                    </Text>
                                </View>
                                <View className="h-2 overflow-hidden rounded-full bg-gray-200">
                                    <View
                                        className="h-full rounded-full bg-blue-500"
                                        style={{ width: `${progress}%` }}
                                    />
                                </View>
                                <Text className="mt-1 text-xs text-gray-500">完成度 {Math.round(progress)}%</Text>
                            </View>

                            {/* Quick Stats */}
                            <View className="flex-row justify-between">
                                <View className="items-center">
                                    <Text className="text-lg font-bold text-blue-600">{animeData.totalEpisode}</Text>
                                    <Text className="text-xs text-gray-500">总集数</Text>
                                </View>
                                <View className="items-center">
                                    <Text className="text-lg font-bold text-green-600">{animeData.currentEpisode}</Text>
                                    <Text className="text-xs text-gray-500">已更新</Text>
                                </View>
                                <View className="items-center">
                                    <Text className="text-lg font-bold text-orange-600">
                                        {getWeekdayText(animeData.updateWeekday)}
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
                                    {getWeekdayText(animeData.updateWeekday)} {formatTime(animeData.updateTimeHHmm)}
                                </Text>
                            </View>
                        </View>

                        <View className="flex-row items-center rounded-xl bg-green-50 px-4 py-3">
                            <View className="mr-3 size-8 items-center justify-center rounded-full bg-green-500">
                                <Text className="text-sm text-white">🎬</Text>
                            </View>
                            <View className="flex-1">
                                <Text className="font-medium text-gray-900">首播时间</Text>
                                <Text className="text-sm text-gray-600">
                                    {formatDateTime(animeData.firstEpisodeYYYYMMDDHHmm)}
                                </Text>
                            </View>
                        </View>

                        <View className="flex-row items-center rounded-xl bg-orange-50 px-4 py-3">
                            <View className="mr-3 size-8 items-center justify-center rounded-full bg-orange-500">
                                <Text className="text-sm text-white">🆕</Text>
                            </View>
                            <View className="flex-1">
                                <Text className="font-medium text-gray-900">最新更新</Text>
                                <Text className="text-sm text-gray-600">
                                    {formatDateTime(animeData.lastEpisodeYYYYMMDDHHmm)}
                                </Text>
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

export default AnimeInfoPage
