import { addAnime } from '@/api'
import BaseAnimeForm, { TFormData, type TCompletedForm, type TSerializingForm } from '@/components/BaseForm'
import { EStatus } from '@/enums'
import { queryClient } from '@/utils/react-query'
import { getFirstEpisodeTimestamp } from '@/utils/time'
import { useMutation } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { router, useNavigation } from 'expo-router'
import React, { useLayoutEffect } from 'react'

export default function Index() {
    const navigation = useNavigation()
    useLayoutEffect(() => {
        navigation.setOptions({
            headerTitle: '添加动漫',
            headerTitleAlign: 'center',
        })
    }, [navigation])

    async function onSubmit(data: TFormData) {
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

    function createDefaultValues(
        status: typeof EStatus.valueType = EStatus.serializing
    ): TSerializingForm | TCompletedForm {
        if (status === EStatus.serializing) {
            return {
                name: '',
                updateTimeHHmm: dayjs().format('YYYY-MM-DD HH:mm'),
                totalEpisode: 0,
                status: status,
                cover: '-',
                currentEpisode: 0,
                updateWeekday: 1,
            }
        } else {
            return {
                name: '',
                updateTimeHHmm: dayjs().format('YYYY-MM-DD HH:mm'),
                totalEpisode: 0,
                status: status,
                cover: '-',
                firstEpisodeYYYYMMDDHHmm: dayjs().format('YYYY-MM-DD HH:mm'),
            }
        }
    }

    return (
        <BaseAnimeForm
            formData={createDefaultValues(EStatus.serializing)}
            onSubmit={onSubmit}
            createDefaultValues={createDefaultValues}
        />
    )
}
