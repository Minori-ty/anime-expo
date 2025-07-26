import { getAnimeList } from '@/api'
import { getCalendarWithAnimeList, handleCalendarByAnimeIdList, handleClearCalendarByAnimeId } from '@/api/calendar'
import Checkbox from '@/components/Checkbox'
import { pickAndReadJson } from '@/utils/file'
import { exportJsonWithRNFS } from '@/utils/file.android'
import { queryClient } from '@/utils/react-query'
import { useMutation, useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { throttle } from 'lodash-es'
import { Calendar, Download, Settings, Trash2, Upload } from 'lucide-react-native'
import { useCallback, useState } from 'react'
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

type CheckboxState = 'unchecked' | 'checked' | 'indeterminate'

export default function Setting() {
    const [selectedAnimeIdList, setSelectedAnimeIdList] = useState<number[]>([])
    const [isExporting, setIsExporting] = useState(false)
    const [isImporting, setIsImporting] = useState(false)
    const [json, setJson] = useState({})
    // const list = [
    //     {
    //         calendar: {
    //             id: 1,
    //             animeId: 1,
    //             calendarId: 'string',
    //         },
    //         anime: {
    //             id: 1,
    //             name: 'string',
    //             currentEpisode: 1,
    //             totalEpisode: 1,
    //             cover: 'string',
    //             createdAt: 1,
    //             firstEpisodeTimestamp: 1,
    //         },
    //     },
    //     {
    //         calendar: {
    //             id: 1,
    //             animeId: 1,
    //             calendarId: 'string',
    //         },
    //         anime: {
    //             id: 2,
    //             name: 'string',
    //             currentEpisode: 1,
    //             totalEpisode: 1,
    //             cover: 'string',
    //             createdAt: 1,
    //             firstEpisodeTimestamp: 1,
    //         },
    //     },
    // ]
    const { data: list = [] } = useQuery({
        queryKey: ['settings'],
        queryFn: getCalendarWithAnimeList,
    })
    const { mutate: handleClearCalendarByAnimeIdMution } = useMutation({
        mutationFn: handleClearCalendarByAnimeId,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['anime-calendar'],
            })
            queryClient.invalidateQueries({
                queryKey: ['settings'],
            })
        },
        onError: err => {
            alert(err)
        },
    })

    /** 删除日历事件 */
    const handleUnsubscribe = useCallback(
        (id: number) => {
            const throttledPush = throttle(() => {
                handleClearCalendarByAnimeIdMution(id)
            }, 300)

            throttledPush()

            return () => throttledPush.cancel()
        },
        [handleClearCalendarByAnimeIdMution]
    )

    const { mutate: handleCalendarByAnimeIdListMution } = useMutation({
        mutationFn: handleCalendarByAnimeIdList,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['anime-calendar'],
            })
            queryClient.invalidateQueries({
                queryKey: ['settings'],
            })
            setSelectedAnimeIdList([])
        },
        onError: err => {
            alert(err)
        },
    })

    /** 删除所有日历事件 */
    const handleUnsubscribeAll = useCallback(() => {
        const throttledPush = throttle(() => {
            handleCalendarByAnimeIdListMution(selectedAnimeIdList)
        }, 300)

        throttledPush()

        return () => throttledPush.cancel()
    }, [handleCalendarByAnimeIdListMution, selectedAnimeIdList])

    const handleEventSelectAll = (state: CheckboxState) => {
        if (state === 'checked') {
            setSelectedAnimeIdList(list.map(item => item.anime.id))
        } else {
            setSelectedAnimeIdList([])
        }
    }

    // 事件全选状态管理
    const eventSelectAllState: CheckboxState =
        selectedAnimeIdList.length === 0
            ? 'unchecked'
            : selectedAnimeIdList.length === list.length
              ? 'checked'
              : 'indeterminate'

    function onHandleDeleteAll() {
        if (selectedAnimeIdList.length === 0) return

        Alert.alert('确认删除', `确定要删除选中的 ${selectedAnimeIdList.length} 个日历事件吗？`, [
            { text: '取消', style: 'cancel' },
            {
                text: '删除',
                style: 'destructive',
                onPress: () => {
                    handleUnsubscribeAll()
                },
            },
        ])
    }

    const handleEventSelect = (animeId: number, checked: boolean) => {
        if (checked) {
            setSelectedAnimeIdList(prev => [...prev, animeId])
        } else {
            setSelectedAnimeIdList(prev => prev.filter(id => id !== animeId))
        }
    }

    /**
     * 导出数据为本地json文件
     */
    async function handleExportData() {
        const data = await getAnimeList()
        await exportJsonWithRNFS({ animeList: data }, `anime_data_${dayjs().format('YYYY_MM_DD')}.json`)
    }

    /**
     * 导入本地json为数据
     */
    async function handleImportData() {
        const jsonData = await pickAndReadJson()
        console.log(jsonData)
        setJson(jsonData)
    }

    return (
        <SafeAreaView edges={['top']} className="flex-1 bg-gray-50">
            <ScrollView showsVerticalScrollIndicator={false}>
                <View className="p-4">
                    {/* 标题 */}
                    <View className="mb-6 flex-row items-center">
                        <Settings size={24} color="#374151" />
                        <Text className="ml-2 text-2xl font-bold text-gray-900">管理中心</Text>
                    </View>
                    {/* 数据管理区域 */}
                    <View className="mb-6 rounded-lg bg-white p-4 shadow-sm">
                        <Text className="mb-4 text-lg font-semibold text-gray-900">数据管理</Text>

                        <View className="mb-4 flex-row gap-3">
                            <TouchableOpacity
                                className={`flex-1 flex-row items-center justify-center rounded-lg px-4 py-3 ${
                                    isExporting ? 'bg-gray-300' : 'bg-blue-600'
                                }`}
                                onPress={handleExportData}
                                disabled={isExporting}
                            >
                                <Download size={16} color="white" />
                                <Text className="ml-2 font-medium text-white">
                                    {isExporting ? '导出中...' : '导出数据'}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                className={`flex-1 flex-row items-center justify-center rounded-lg px-4 py-3 ${
                                    isImporting ? 'bg-gray-300' : 'bg-green-600'
                                }`}
                                onPress={handleImportData}
                                disabled={isImporting}
                            >
                                <Upload size={16} color="white" />
                                <Text className="ml-2 font-medium text-white">
                                    {isImporting ? '导入中...' : '导入数据'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* 日历事件管理 */}
                    <View className="rounded-lg bg-white p-4 shadow-sm">
                        <View className="mb-4 h-10 flex-row items-center justify-between">
                            <View className="flex-row items-center">
                                <Calendar size={20} color="#374151" />
                                <Text className="ml-2 text-lg font-semibold text-gray-900">动漫日历事件</Text>
                            </View>
                            {selectedAnimeIdList.length > 0 && (
                                <TouchableOpacity
                                    className="flex-row items-center rounded-lg bg-red-100 px-3 py-2"
                                    onPress={onHandleDeleteAll}
                                >
                                    <Trash2 size={14} color="#dc2626" />
                                    <Text className="ml-1 text-sm font-medium text-red-600">
                                        删除 ({selectedAnimeIdList.length})
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {list.length > 0 && (
                            <View className="mb-3">
                                <Checkbox
                                    label="全选"
                                    allowIndeterminate
                                    state={eventSelectAllState}
                                    onStateChange={handleEventSelectAll}
                                />
                            </View>
                        )}

                        {list.length === 0 ? (
                            <Text className="py-8 text-center text-gray-500">暂无日历事件</Text>
                        ) : (
                            <View className="space-y-3">
                                {list.map(item => {
                                    return (
                                        <View
                                            key={item.anime.id}
                                            className="mb-2 flex-row items-start rounded-lg bg-gray-50 p-3"
                                        >
                                            <Checkbox
                                                state={
                                                    selectedAnimeIdList.includes(item.anime.id)
                                                        ? 'checked'
                                                        : 'unchecked'
                                                }
                                                onStateChange={state =>
                                                    handleEventSelect(item.anime.id, state === 'checked')
                                                }
                                                className="mt-1"
                                            />
                                            <View className="ml-3 flex-1">
                                                <Text className="font-medium text-gray-900">{item.anime.name}</Text>
                                            </View>

                                            <TouchableOpacity
                                                className="p-2"
                                                onPress={() => {
                                                    Alert.alert('确认删除', `确定要删除事件 ${item.anime.name} 吗？`, [
                                                        { text: '取消', style: 'cancel' },
                                                        {
                                                            text: '删除',
                                                            style: 'destructive',
                                                            onPress: () => handleUnsubscribe(item.anime.id),
                                                        },
                                                    ])
                                                }}
                                            >
                                                <Trash2 size={16} color="#ef4444" />
                                            </TouchableOpacity>
                                        </View>
                                    )
                                })}
                            </View>
                        )}
                    </View>
                </View>

                <Text>{JSON.stringify(json)}</Text>
            </ScrollView>
        </SafeAreaView>
    )
}
