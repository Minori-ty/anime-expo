import { getAnimeById } from '@/api'
import BaseAnimeForm, { TFormData } from '@/components/BaseForm'
import { EStatus, EWeekday } from '@/enums'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useLocalSearchParams, useNavigation } from 'expo-router'
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

export default function AnimeDetail() {
    const navigation = useNavigation()
    useEffect(() => {
        navigation.setOptions({
            headerTitle: '编辑动漫信息',
            headerTitleAlign: 'center',
        })
    }, [navigation])

    const { id } = useLocalSearchParams()

    const { data } = useQuery({
        queryKey: ['anime-edit'],
        queryFn: () => getAnimeById(Number(id)),
    })
    async function onSubmit(data: TFormData) {
        const { name, cover, totalEpisode } = data
    }

    // const { mutate: addAnimeMution } = useMutation({
    //     mutationFn: () => {},
    //     onSuccess: () => {
    //         queryClient.invalidateQueries({
    //             queryKey: ['my-anime'],
    //         })
    //         queryClient.invalidateQueries({
    //             queryKey: ['schedule'],
    //         })

    //         router.back()
    //     },
    //     onError: err => {
    //         alert(err)
    //     },
    // })

    return <BaseAnimeForm formData={data ?? formData} onSubmit={onSubmit} />
}
