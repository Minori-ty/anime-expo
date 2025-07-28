import { handleUpdateAnime } from '@/api'
import { getAnimeByNameExceptItself, handleGetAnimeById } from '@/api/anime'
import BaseAnimeForm from '@/components/BaseForm'
import Loading from '@/components/lottie/Loading'
import { TFormSchema } from '@/components/schema'
import { EStatus, EWeekday } from '@/enums'
import { queryClient } from '@/utils/react-query'
import { getFirstEpisodeTimestamp } from '@/utils/time'
import { useMutation, useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { router, useLocalSearchParams, useNavigation } from 'expo-router'
import React, { useEffect } from 'react'
import { type SubmitHandler } from 'react-hook-form'
import Toast from 'react-native-toast-message'

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

    const { data: data = formData, isLoading } = useQuery({
        queryKey: ['anime-edit', id],
        queryFn: () => handleGetAnimeById(Number(id)),
        staleTime: 0,
    })

    const onSubmit: SubmitHandler<TFormSchema> = async data => {
        const { name, cover, totalEpisode } = data
        const result = await handleValidateAnimeNameIsExist(name, Number(id))
        if (result) return
        if (data.status === EStatus.serializing) {
            const { currentEpisode, updateTimeHHmm, updateWeekday } = data
            if (updateWeekday === '') return
            updateAnimeMution({
                animeId: Number(id),
                name,
                currentEpisode,
                totalEpisode,
                cover,
                firstEpisodeTimestamp: getFirstEpisodeTimestamp({ currentEpisode, updateTimeHHmm, updateWeekday }),
            })
        } else if (data.status === EStatus.completed) {
            const { firstEpisodeYYYYMMDDHHmm } = data
            updateAnimeMution({
                animeId: Number(id),
                name,
                currentEpisode: totalEpisode,
                totalEpisode,
                cover,
                firstEpisodeTimestamp: dayjs(firstEpisodeYYYYMMDDHHmm, 'YYYY-MM-DD HH:mm').second(0).unix(),
            })
        } else if (data.status === EStatus.toBeUpdated) {
            const { firstEpisodeYYYYMMDDHHmm } = data
            updateAnimeMution({
                animeId: Number(id),
                name,
                currentEpisode: 0,
                totalEpisode,
                cover,
                firstEpisodeTimestamp: dayjs(firstEpisodeYYYYMMDDHHmm, 'YYYY-MM-DD HH:mm').second(0).unix(),
            })
        }
    }

    const { mutate: updateAnimeMution } = useMutation({
        mutationFn: handleUpdateAnime,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['my-anime'],
            })
            queryClient.invalidateQueries({
                queryKey: ['schedule'],
            })
            queryClient.invalidateQueries({
                queryKey: ['anime-detail', id],
            })
            queryClient.invalidateQueries({
                queryKey: ['anime-edit', id],
            })
            queryClient.invalidateQueries({
                queryKey: ['settings-calendar'],
            })
            queryClient.invalidateQueries({
                queryKey: ['anime-calendar', id],
            })

            router.back()
        },
        onError: err => {
            alert(err)
        },
    })
    /**
     * 校验动漫名是否存在
     * @param name
     */
    async function handleValidateAnimeNameIsExist(name: string, id: number) {
        const result = await getAnimeByNameExceptItself(name, id)
        if (result) {
            Toast.show({
                type: 'error',
                text1: '该动漫已存在，请勿重复添加。如需修改，请编辑该动漫。',
            })
            return true
        }
        return false
    }

    if (isLoading) {
        return <Loading />
    }

    return <BaseAnimeForm formData={data} onSubmit={onSubmit} />
}
