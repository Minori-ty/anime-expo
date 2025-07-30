import { getAnimeList, handleAddAnime } from '@/api'
import { getCalendarWithAnimeList, handleCalendarByAnimeIdList, handleClearCalendarByAnimeId } from '@/api/calendar'
import Checkbox from '@/components/Checkbox'
import { Modal } from '@/components/Modal/index'
import PageHeader from '@/components/PageHeader'
import Icon from '@/components/ui/Icon'
import { EStatus, EWeekday } from '@/enums'
import { themeColorPurple } from '@/styles'
import { deleteJsonFile, exportJsonFile, importJsonFile, scanJsonFile } from '@/utils/file.android'
import { queryClient } from '@/utils/react-query'
import { getFirstEpisodeTimestamp } from '@/utils/time'
import { useMutation, useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { debounce, differenceBy } from 'lodash-es'
import { Calendar, Download, FileText, Trash2, Upload } from 'lucide-react-native'
import { useCallback, useState } from 'react'
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'
import { z } from 'zod'

type CheckboxState = 'unchecked' | 'checked' | 'indeterminate'

export default function Setting() {
    const [selectedAnimeIdList, setSelectedAnimeIdList] = useState<number[]>([])
    const [selectedJsonFileList, setSelectedJsonFileList] = useState<string[]>([])

    const {
        data: calendarList = [],
        refetch,
        isLoading,
    } = useQuery({
        queryKey: ['settings-calendar'],
        queryFn: getCalendarWithAnimeList,
        refetchOnWindowFocus: true,
    })
    const { data: fileList = [] } = useQuery({
        queryKey: ['settings-json-file'],
        queryFn: scanJsonFile,
        refetchOnWindowFocus: true,
    })
    const { mutate: handleClearCalendarByAnimeIdMution } = useMutation({
        mutationFn: handleClearCalendarByAnimeId,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['anime-calendar'],
            })
            queryClient.invalidateQueries({
                queryKey: ['settings-calendar'],
            })
        },
        onError: err => {
            Toast.show({
                type: 'error',
                text1: `获取日历事件失败 ${err}`,
            })
        },
    })

    /** 删除日历事件 */
    const handleUnsubscribe = useCallback(
        (id: number) => {
            const debounceHandler = debounce(
                () => {
                    handleClearCalendarByAnimeIdMution(id)
                },
                300,
                { leading: true, trailing: false }
            )

            debounceHandler()

            return () => debounceHandler.cancel()
        },
        [handleClearCalendarByAnimeIdMution]
    )

    /** 删除日历事件 */
    const { mutate: handleCalendarByAnimeIdListMution, isPending: isHandleCalendarByAnimeIdListMutionLoading } =
        useMutation({
            mutationFn: handleCalendarByAnimeIdList,
            onSuccess: () => {
                queryClient.invalidateQueries({
                    queryKey: ['anime-calendar'],
                })
                queryClient.invalidateQueries({
                    queryKey: ['settings-calendar'],
                })
                setSelectedAnimeIdList([])
            },
            onError: err => {},
        })

    /** 删除所有日历事件 */
    const handleUnsubscribeAll = useCallback(() => {
        const debounceHandler = debounce(
            () => {
                handleCalendarByAnimeIdListMution(selectedAnimeIdList)
            },
            300,
            { leading: true, trailing: false }
        )

        debounceHandler()

        return () => debounceHandler.cancel()
    }, [handleCalendarByAnimeIdListMution, selectedAnimeIdList])

    const handleEventSelectAll = (state: CheckboxState) => {
        if (state === 'checked') {
            setSelectedAnimeIdList(calendarList.map(item => item.anime.id))
        } else {
            setSelectedAnimeIdList([])
        }
    }

    // 事件全选状态管理
    const eventSelectAllState: CheckboxState =
        selectedAnimeIdList.length === 0
            ? 'unchecked'
            : selectedAnimeIdList.length === calendarList.length
              ? 'checked'
              : 'indeterminate'

    const handleEventSelect = (animeId: number, checked: boolean) => {
        if (checked) {
            setSelectedAnimeIdList(prev => [...prev, animeId])
        } else {
            setSelectedAnimeIdList(prev => prev.filter(id => id !== animeId))
        }
    }

    /**
     * 导出数据为json文件
     */
    async function exportDataToJsonFile() {
        const data = await getAnimeList()
        await exportJsonFile({ animeList: data }, `anime_data_${dayjs().format('YYYY_MM_DD')}.json`)
        return dayjs().format('YYYY_MM_DD')
    }

    const { mutate: exportDataToJsonFileMutation, isPending: isExportDataToJsonFileMutationLoading } = useMutation({
        mutationFn: exportDataToJsonFile,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['settings-json-file'],
            })

            Toast.show({
                type: 'success',
                text1: '导出成功！',
            })
        },
        onError: err => {
            Toast.show({
                type: 'error',
                text1: '导入失败！' + err,
            })
        },
    })

    const validateJsonData = z.object({
        animeList: z.array(
            z.object({
                id: z.number(),
                name: z.string(),
                currentEpisode: z.number(),
                totalEpisode: z.number(),
                cover: z.string(),
                updateWeekday: z.union([
                    z.literal(EWeekday.monday),
                    z.literal(EWeekday.tuesday),
                    z.literal(EWeekday.wednesday),
                    z.literal(EWeekday.thursday),
                    z.literal(EWeekday.friday),
                    z.literal(EWeekday.saturday),
                    z.literal(EWeekday.sunday),
                ]),
                firstEpisodeYYYYMMDDHHmm: z.string(),
                lastEpisodeYYYYMMDDHHmm: z.string(),
                updateTimeHHmm: z.string(),
                status: z.union([
                    z.literal(EStatus.completed),
                    z.literal(EStatus.serializing),
                    z.literal(EStatus.toBeUpdated),
                ]),
            })
        ),
    })

    /**
     * 导入json文件为数据
     */
    async function handleImportJsonFileToData() {
        const jsonData = await importJsonFile()
        const result = validateJsonData.safeParse(jsonData)
        if (!result.success) {
            console.log('json数据校验失败，不符合格式')
            return
        }
        const data = await getAnimeList()
        /** 与本地数据库中不同的数据 */
        const res = differenceBy(jsonData.animeList, data, 'name')
        const animeList = res.map(({ id, ...reset }) => reset)

        return await Promise.all(
            animeList.map(item => {
                const { name, cover, totalEpisode } = item

                if (item.status === EStatus.serializing) {
                    const { currentEpisode } = item
                    return handleAddAnime({
                        name,
                        currentEpisode,
                        totalEpisode,
                        cover,
                        firstEpisodeTimestamp: getFirstEpisodeTimestamp(item),
                    })
                }

                if (item.status === EStatus.completed) {
                    const { firstEpisodeYYYYMMDDHHmm } = item
                    return handleAddAnime({
                        name,
                        currentEpisode: totalEpisode,
                        totalEpisode,
                        cover,
                        firstEpisodeTimestamp: dayjs(firstEpisodeYYYYMMDDHHmm).unix(),
                    })
                }

                if (item.status === EStatus.toBeUpdated) {
                    const { firstEpisodeYYYYMMDDHHmm } = item
                    return handleAddAnime({
                        name,
                        currentEpisode: 0,
                        totalEpisode,
                        cover,
                        firstEpisodeTimestamp: dayjs(firstEpisodeYYYYMMDDHHmm).unix(),
                    })
                }

                // 如果 status 不匹配任何情况，返回一个 resolved Promise
                return Promise.resolve()
            })
        )
    }

    const { mutate: handleImportJsonFileToDataMution, isPending: handleImportJsonFileToDataMutionLoading } =
        useMutation({
            mutationFn: handleImportJsonFileToData,
            onSuccess: () => {
                queryClient.invalidateQueries({
                    queryKey: ['my-anime'],
                })
                queryClient.invalidateQueries({
                    queryKey: ['schedule'],
                })
                queryClient.invalidateQueries({
                    queryKey: ['settings-calendar'],
                })
                Toast.show({
                    type: 'success',
                    text1: '导入成功！',
                })
            },
            onError: err => {
                Toast.show({
                    type: 'error',
                    text1: err.message,
                })
            },
        })

    const { mutate: deleteJsonFileMution } = useMutation({
        mutationFn: deleteJsonFile,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['my-anime'],
            })
            queryClient.invalidateQueries({
                queryKey: ['schedule'],
            })
            queryClient.invalidateQueries({
                queryKey: ['settings-calendar'],
            })
            queryClient.invalidateQueries({
                queryKey: ['settings-json-file'],
            })
        },
        onError: err => {},
    })

    async function deleteJsonFileList(fileNameList: string[]) {
        return await Promise.all(fileNameList.map(deleteJsonFile))
    }
    const { mutate: deleteJsonFileListMution } = useMutation({
        mutationFn: deleteJsonFileList,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['my-anime'],
            })
            queryClient.invalidateQueries({
                queryKey: ['schedule'],
            })
            queryClient.invalidateQueries({
                queryKey: ['settings-calendar'],
            })
            queryClient.invalidateQueries({
                queryKey: ['settings-json-file'],
            })
            setSelectedJsonFileList([])
            Modal.hide()
        },
        onError: err => {},
    })

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    }

    const handleFileSelectAll = (state: CheckboxState) => {
        if (state === 'checked') {
            setSelectedJsonFileList(fileList.map(file => file.name))
        } else {
            setSelectedJsonFileList([])
        }
    }
    // 文件全选状态管理
    const fileSelectAllState: CheckboxState =
        selectedJsonFileList.length === 0
            ? 'unchecked'
            : selectedJsonFileList.length === fileList.length
              ? 'checked'
              : 'indeterminate'

    const handleFileSelect = (fileName: string, checked: boolean) => {
        if (checked) {
            setSelectedJsonFileList(prev => [...prev, fileName])
        } else {
            setSelectedJsonFileList(prev => prev.filter(name => name !== fileName))
        }
    }
    return (
        <>
            <SafeAreaView edges={['top']} className="flex-1 bg-gray-50">
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={isLoading}
                            onRefresh={refetch}
                            className="text-theme"
                            colors={[themeColorPurple]}
                        />
                    }
                >
                    <View className="p-4">
                        {/* 标题 */}
                        <PageHeader title="数据管理" leading={<Icon size={24} name="Settings" />}></PageHeader>

                        {/* 数据管理区域 */}
                        <View className="mb-6 rounded-lg bg-white p-4 shadow-sm">
                            <Text className="mb-4 text-lg font-semibold text-gray-900">数据管理</Text>

                            <View className="mb-4 flex-row gap-3">
                                <TouchableOpacity
                                    className={`flex-1 flex-row items-center justify-center rounded-lg px-4 py-3 ${
                                        isExportDataToJsonFileMutationLoading ? 'bg-gray-300' : 'bg-blue-600'
                                    }`}
                                    onPress={() => {
                                        exportDataToJsonFileMutation()
                                    }}
                                    disabled={isExportDataToJsonFileMutationLoading}
                                >
                                    <Download size={16} color="white" />
                                    <Text className="ml-2 font-medium text-white">
                                        {isExportDataToJsonFileMutationLoading ? '导出中...' : '导出数据'}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    className={`flex-1 flex-row items-center justify-center rounded-lg px-4 py-3 ${
                                        handleImportJsonFileToDataMutionLoading ? 'bg-gray-300' : 'bg-green-600'
                                    }`}
                                    onPress={() => handleImportJsonFileToDataMution()}
                                    disabled={handleImportJsonFileToDataMutionLoading}
                                >
                                    <Upload size={16} color="white" />
                                    <Text className="ml-2 font-medium text-white">
                                        {handleImportJsonFileToDataMutionLoading ? '导入中...' : '导入数据'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* 本地文件管理 */}
                        <View className="mb-6 rounded-lg bg-white p-4 shadow-sm">
                            <View className="mb-4 h-10 flex-row items-center justify-between">
                                <View className="flex-row items-center">
                                    <FileText size={20} color="#374151" />
                                    <Text className="ml-2 text-lg font-semibold text-gray-900">本地文件</Text>
                                </View>
                                {selectedJsonFileList.length > 0 && (
                                    <TouchableOpacity
                                        className="flex-row items-center rounded-lg bg-red-100 px-3 py-2"
                                        onPress={() => {
                                            Modal.show({
                                                body: (
                                                    <Text className="text-sm">
                                                        你确定要删除{selectedJsonFileList.length}个文件吗
                                                    </Text>
                                                ),
                                                onConfirm: () => deleteJsonFileListMution(selectedJsonFileList),
                                            })
                                        }}
                                    >
                                        <Trash2 size={14} color="#dc2626" />
                                        <Text className="ml-1 text-sm font-medium text-red-600">
                                            删除 ({selectedJsonFileList.length})
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>

                            {fileList.length > 0 && (
                                <View className="mb-3">
                                    <Checkbox
                                        label="全选"
                                        allowIndeterminate
                                        state={fileSelectAllState}
                                        onStateChange={handleFileSelectAll}
                                    />
                                </View>
                            )}

                            {fileList.length === 0 ? (
                                <Text className="py-8 text-center text-gray-500">暂无本地文件</Text>
                            ) : (
                                <View className="space-y-3">
                                    {fileList.map(file => (
                                        <View key={file.name} className="flex-row rounded-lg bg-gray-50 p-3">
                                            <View className="mt-2">
                                                <Checkbox
                                                    state={
                                                        selectedJsonFileList.includes(file.name)
                                                            ? 'checked'
                                                            : 'unchecked'
                                                    }
                                                    onStateChange={state =>
                                                        handleFileSelect(file.name, state === 'checked')
                                                    }
                                                />
                                            </View>
                                            <View className="ml-3 flex-1">
                                                <Text className="font-medium text-gray-900">{file.name}</Text>
                                                <View className="mt-1 flex-row items-center">
                                                    <Text className="text-sm text-gray-500">
                                                        {formatFileSize(file.size)}
                                                    </Text>
                                                    <Text className="mx-2 text-sm text-gray-400">•</Text>
                                                </View>
                                                <View>
                                                    <Text className="text-xs text-gray-500" numberOfLines={1}>
                                                        路径：/Android/data/com.minority.app.com/files/*
                                                    </Text>
                                                </View>
                                            </View>

                                            <TouchableOpacity
                                                className="p-2"
                                                onPress={() => {
                                                    Modal.show({
                                                        body: (
                                                            <Text className="text-sm">
                                                                你确定要删除文件 {file.name} 吗？
                                                            </Text>
                                                        ),
                                                        onConfirm: () => deleteJsonFileMution(file.name),
                                                    })
                                                }}
                                            >
                                                <Trash2 size={16} color="#ef4444" />
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </View>
                            )}
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
                                        onPress={() => {
                                            Modal.show({
                                                body: (
                                                    <Text className="text-sm">
                                                        你确定要删除{selectedAnimeIdList.length}个动漫日历事件吗？
                                                    </Text>
                                                ),
                                                onConfirm: handleUnsubscribeAll,
                                            })
                                        }}
                                        disabled={isHandleCalendarByAnimeIdListMutionLoading}
                                    >
                                        <Trash2 size={14} color="#dc2626" />
                                        <Text className="ml-1 text-sm font-medium text-red-600">
                                            删除 ({selectedAnimeIdList.length})
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>

                            {calendarList.length > 0 && (
                                <View className="mb-3">
                                    <Checkbox
                                        label="全选"
                                        allowIndeterminate
                                        state={eventSelectAllState}
                                        onStateChange={handleEventSelectAll}
                                    />
                                </View>
                            )}

                            {calendarList.length === 0 ? (
                                <Text className="py-8 text-center text-gray-500">暂无日历事件</Text>
                            ) : (
                                <View className="space-y-3">
                                    {calendarList.map(item => {
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
                                                        Modal.show({
                                                            body: (
                                                                <Text className="text-sm">
                                                                    确定要删除事件 {item.anime.name} 吗？
                                                                </Text>
                                                            ),
                                                            onConfirm: () => handleUnsubscribe(item.anime.id),
                                                        })
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
                </ScrollView>
            </SafeAreaView>
        </>
    )
}
