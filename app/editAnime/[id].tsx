import { getAnimeById, updateAnime } from '@/api'
import BaseAnimeForm, { TFormData } from '@/components/BaseForm'
import Loading from '@/components/lottie/Loading'
import { EStatus, EWeekday } from '@/enums'
import { queryClient } from '@/utils/react-query'
import { getFirstEpisodeTimestamp } from '@/utils/time'
import { useMutation, useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { router, useLocalSearchParams, useNavigation } from 'expo-router'
import React, { useEffect } from 'react'

const formData = {
    name: 'asf',
    updateTimeHHmm: dayjs().format('YYYY-MM-DD HH:mm'),
    totalEpisode: 5,
    status: EStatus.serializing,
    cover: 'https://pics4.baidu.com/feed/77094b36acaf2edd67093ad9d7fb12f938019305.jpeg@f_auto?token=dd785ba4307a2c24b9b4c58105475fd4',
    currentEpisode: 3,
    updateWeekday: EWeekday.monday as typeof EWeekday.valueType,
    firstEpisodeYYYYMMDDHHmm: dayjs().format('YYYY-MM-DD HH:mm'),
}

export default function EditAnime() {
    const navigation = useNavigation()
    useEffect(() => {
        navigation.setOptions({
            headerTitle: '编辑动漫信息',
            headerTitleAlign: 'center',
        })
    }, [navigation])

    const { id } = useLocalSearchParams<{ id: string }>()

    const { data, isLoading } = useQuery({
        queryKey: ['anime-edit', id],
        queryFn: () => getAnimeById(Number(id)),
    })
    async function onSubmit(data: TFormData) {
        console.log(data)

        const { name, cover, totalEpisode } = data
        if (data.status === EStatus.serializing) {
            const { currentEpisode } = data
            updateAnimeMution({
                id: Number(id),
                name,
                currentEpisode,
                totalEpisode,
                cover,
                firstEpisodeTimestamp: getFirstEpisodeTimestamp(data),
            })
        } else if (data.status === EStatus.completed) {
            const { firstEpisodeYYYYMMDDHHmm } = data
            updateAnimeMution({
                id: Number(id),
                name,
                currentEpisode: totalEpisode,
                totalEpisode,
                cover,
                firstEpisodeTimestamp: dayjs(firstEpisodeYYYYMMDDHHmm).unix(),
            })
        } else if (data.status === EStatus.toBeUpdated) {
            const { firstEpisodeYYYYMMDDHHmm } = data
            updateAnimeMution({
                id: Number(id),
                name,
                currentEpisode: 0,
                totalEpisode,
                cover,
                firstEpisodeTimestamp: dayjs(firstEpisodeYYYYMMDDHHmm).unix(),
            })
        }
    }

    const { mutate: updateAnimeMution } = useMutation({
        mutationFn: updateAnime,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['my-anime'],
            })
            queryClient.invalidateQueries({
                queryKey: ['schedule'],
            })

            router.back()
        },
        onError: err => {
            alert(err)
        },
    })
    if (isLoading) {
        return <Loading />
    }

    return <BaseAnimeForm formData={data ?? formData} onSubmit={onSubmit} />
}
