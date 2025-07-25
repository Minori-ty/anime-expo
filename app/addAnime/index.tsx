import { addAnime } from '@/api'
import BaseAnimeForm from '@/components/BaseForm'
import { type TFormSchema } from '@/components/schema'
import { EStatus, EWeekday } from '@/enums'
import { queryClient } from '@/utils/react-query'
import { getFirstEpisodeTimestamp } from '@/utils/time'
import { useMutation } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { router, useNavigation } from 'expo-router'
import React, { useLayoutEffect } from 'react'
import { type SubmitHandler } from 'react-hook-form'

const formData = {
    name: 'asf',
    updateTimeHHmm: dayjs().format('YYYY-MM-DD HH:mm'),
    totalEpisode: 5,
    status: EStatus.serializing,
    cover: 'https://pics4.baidu.com/feed/77094b36acaf2edd67093ad9d7fb12f938019305.jpeg@f_auto?token=dd785ba4307a2c24b9b4c58105475fd4',
    currentEpisode: 3,
    updateWeekday: EWeekday.monday,
    firstEpisodeYYYYMMDDHHmm: dayjs().format('YYYY-MM-DD HH:mm'),
}

export default function Index() {
    const navigation = useNavigation()
    useLayoutEffect(() => {
        navigation.setOptions({
            headerTitle: '添加动漫',
            headerTitleAlign: 'center',
        })
    }, [navigation])

    const onSubmit: SubmitHandler<TFormSchema> = data => {
        const { name, cover, totalEpisode } = data
        if (data.status === EStatus.serializing) {
            const { currentEpisode } = data
            addAnimeMution({
                name,
                currentEpisode,
                totalEpisode,
                cover,
                firstEpisodeTimestamp: getFirstEpisodeTimestamp(data),
            })
        } else if (data.status === EStatus.completed) {
            const { firstEpisodeYYYYMMDDHHmm } = data
            addAnimeMution({
                name,
                currentEpisode: totalEpisode,
                totalEpisode,
                cover,
                firstEpisodeTimestamp: dayjs(firstEpisodeYYYYMMDDHHmm).unix(),
            })
        } else if (data.status === EStatus.toBeUpdated) {
            const { firstEpisodeYYYYMMDDHHmm } = data
            addAnimeMution({
                name,
                currentEpisode: 0,
                totalEpisode,
                cover,
                firstEpisodeTimestamp: dayjs(firstEpisodeYYYYMMDDHHmm).unix(),
            })
        }
    }

    const { mutate: addAnimeMution } = useMutation({
        mutationFn: addAnime,
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

    return <BaseAnimeForm formData={formData} onSubmit={onSubmit} />
}
