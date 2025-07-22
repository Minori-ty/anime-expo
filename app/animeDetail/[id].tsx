import { getAnimeById } from '@/api'
import { IconSymbol } from '@/components/ui/IconSymbol'
import { EStatus, EWeekday } from '@/enums'
import { useQuery } from '@tanstack/react-query'
import 'dayjs/locale/zh-cn'
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router'
import React, { useLayoutEffect } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'

export default function AnimeDetail() {
    const { id } = useLocalSearchParams<{ id: string }>()
    const navigation = useNavigation()
    const router = useRouter()

    const {
        data: anime = {
            firstEpisodeDateTime: '-',
            lastEpisodeDateTime: '-',
            createdAt: '-',
            id: -1,
            name: '-',
            updateWeekday: EWeekday.monday,
            updateTimeHHmm: '-',
            currentEpisode: 0,
            totalEpisode: 0,
            status: EStatus.serializing,
            cover: '-',
        },
    } = useQuery({
        queryKey: ['anime-detail'],
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
    return (
        <View>
            <Text>[id]</Text>
        </View>
    )
}
