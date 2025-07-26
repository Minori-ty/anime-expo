import Checkbox from '@/components/Checkbox'
import { useAnimeEvents } from '@/hooks/useAnimeEvents'
import { useFileManager } from '@/hooks/useFileManager'
import type { AppData } from '@/types'
import { saveJsonToPublicDirectory } from '@/utils/fileSave'
import { Calendar, Clock, Download, FileText, Settings, Trash2, Upload } from 'lucide-react-native'
import { useState } from 'react'
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

type CheckboxState = 'unchecked' | 'checked' | 'indeterminate'

export default function ManagementCenter() {
    const { files, exportData, importData, deleteFile, deleteFiles } = useFileManager()
    const { events, deleteEvent, deleteEvents, addImportedEvents } = useAnimeEvents()

    const [selectedFiles, setSelectedFiles] = useState<string[]>([])
    const [selectedEvents, setSelectedEvents] = useState<string[]>([])
    const [isExporting, setIsExporting] = useState(false)
    const [isImporting, setIsImporting] = useState(false)

    // 文件全选状态管理
    const fileSelectAllState: CheckboxState =
        selectedFiles.length === 0 ? 'unchecked' : selectedFiles.length === files.length ? 'checked' : 'indeterminate'

    // 事件全选状态管理
    const eventSelectAllState: CheckboxState =
        selectedEvents.length === 0
            ? 'unchecked'
            : selectedEvents.length === events.length
              ? 'checked'
              : 'indeterminate'

    const handleFileSelectAll = (state: CheckboxState) => {
        if (state === 'checked') {
            setSelectedFiles(files.map(file => file.id))
        } else {
            setSelectedFiles([])
        }
    }

    const handleEventSelectAll = (state: CheckboxState) => {
        if (state === 'checked') {
            setSelectedEvents(events.map(event => event.id))
        } else {
            setSelectedEvents([])
        }
    }

    const handleFileSelect = (fileId: string, checked: boolean) => {
        if (checked) {
            setSelectedFiles(prev => [...prev, fileId])
        } else {
            setSelectedFiles(prev => prev.filter(id => id !== fileId))
        }
    }

    const handleEventSelect = (eventId: string, checked: boolean) => {
        if (checked) {
            setSelectedEvents(prev => [...prev, eventId])
        } else {
            setSelectedEvents(prev => prev.filter(id => id !== eventId))
        }
    }

    const handleExportData = async () => {
        setIsExporting(true)
        try {
            const appData: AppData = {
                animeEvents: events,
                settings: {
                    notifications: true,
                    autoSync: true,
                },
                lastUpdated: new Date().toISOString(),
            }

            const exportedFile = await exportData(appData)
            const data = { foo: 'bar', count: 42 }
            await saveJsonToPublicDirectory('app_data.json', data)
            Alert.alert('导出成功', `数据已导出为 ${exportedFile.name}`)
        } catch {
            Alert.alert('导出失败', '请稍后重试')
        } finally {
            setIsExporting(false)
        }
    }

    const handleImportData = async () => {
        setIsImporting(true)
        try {
            const importedData = await importData()
            addImportedEvents(importedData.animeEvents)
            Alert.alert('导入成功', `已导入 ${importedData.animeEvents.length} 个动漫事件`)
        } catch {
            Alert.alert('导入失败', '请稍后重试')
        } finally {
            setIsImporting(false)
        }
    }

    const handleDeleteSelectedFiles = () => {
        if (selectedFiles.length === 0) return

        Alert.alert('确认删除', `确定要删除选中的 ${selectedFiles.length} 个文件吗？`, [
            { text: '取消', style: 'cancel' },
            {
                text: '删除',
                style: 'destructive',
                onPress: () => {
                    deleteFiles(selectedFiles)
                    setSelectedFiles([])
                },
            },
        ])
    }

    const handleDeleteSelectedEvents = () => {
        if (selectedEvents.length === 0) return

        Alert.alert('确认删除', `确定要删除选中的 ${selectedEvents.length} 个日历事件吗？`, [
            { text: '取消', style: 'cancel' },
            {
                text: '删除',
                style: 'destructive',
                onPress: () => {
                    deleteEvents(selectedEvents)
                    setSelectedEvents([])
                },
            },
        ])
    }

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('zh-CN')
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

                    {/* 本地文件管理 */}
                    <View className="mb-6 rounded-lg bg-white p-4 shadow-sm">
                        <View className="mb-4 h-10 flex-row items-center justify-between">
                            <View className="flex-row items-center">
                                <FileText size={20} color="#374151" />
                                <Text className="ml-2 text-lg font-semibold text-gray-900">本地文件</Text>
                            </View>
                            {selectedFiles.length > 0 && (
                                <TouchableOpacity
                                    className="flex-row items-center rounded-lg bg-red-100 px-3 py-2"
                                    onPress={handleDeleteSelectedFiles}
                                >
                                    <Trash2 size={14} color="#dc2626" />
                                    <Text className="ml-1 text-sm font-medium text-red-600">
                                        删除 ({selectedFiles.length})
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {files.length > 0 && (
                            <View className="mb-3">
                                <Checkbox
                                    label="全选"
                                    allowIndeterminate
                                    state={fileSelectAllState}
                                    onStateChange={handleFileSelectAll}
                                />
                            </View>
                        )}

                        {files.length === 0 ? (
                            <Text className="py-8 text-center text-gray-500">暂无本地文件</Text>
                        ) : (
                            <View className="space-y-3">
                                {files.map(file => (
                                    <View key={file.id} className="flex-row items-center rounded-lg bg-gray-50 p-3">
                                        <Checkbox
                                            state={selectedFiles.includes(file.id) ? 'checked' : 'unchecked'}
                                            onStateChange={state => handleFileSelect(file.id, state === 'checked')}
                                        />
                                        <View className="ml-3 flex-1">
                                            <Text className="font-medium text-gray-900">{file.name}</Text>
                                            <View className="mt-1 flex-row items-center">
                                                <Text className="text-sm text-gray-500">
                                                    {formatFileSize(file.size)}
                                                </Text>
                                                <Text className="mx-2 text-sm text-gray-400">•</Text>
                                                <Text className="text-sm text-gray-500">
                                                    {formatDate(file.createdAt)}
                                                </Text>
                                            </View>
                                        </View>
                                        <TouchableOpacity
                                            className="p-2"
                                            onPress={() => {
                                                Alert.alert('确认删除', `确定要删除文件 ${file.name} 吗？`, [
                                                    { text: '取消', style: 'cancel' },
                                                    {
                                                        text: '删除',
                                                        style: 'destructive',
                                                        onPress: () => deleteFile(file.id),
                                                    },
                                                ])
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
                            {selectedEvents.length > 0 && (
                                <TouchableOpacity
                                    className="flex-row items-center rounded-lg bg-red-100 px-3 py-2"
                                    onPress={handleDeleteSelectedEvents}
                                >
                                    <Trash2 size={14} color="#dc2626" />
                                    <Text className="ml-1 text-sm font-medium text-red-600">
                                        删除 ({selectedEvents.length})
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {events.length > 0 && (
                            <View className="mb-3">
                                <Checkbox
                                    label="全选"
                                    allowIndeterminate
                                    state={eventSelectAllState}
                                    onStateChange={handleEventSelectAll}
                                />
                            </View>
                        )}

                        {events.length === 0 ? (
                            <Text className="py-8 text-center text-gray-500">暂无日历事件</Text>
                        ) : (
                            <View className="space-y-3">
                                {events.map(event => (
                                    <View key={event.id} className="flex-row items-start rounded-lg bg-gray-50 p-3">
                                        <Checkbox
                                            state={selectedEvents.includes(event.id) ? 'checked' : 'unchecked'}
                                            onStateChange={state => handleEventSelect(event.id, state === 'checked')}
                                            className="mt-1"
                                        />
                                        <View className="ml-3 flex-1">
                                            <Text className="font-medium text-gray-900">{event.title}</Text>
                                            <Text className="mt-1 text-sm text-gray-600">第 {event.episode} 集</Text>
                                            {event.description && (
                                                <Text className="mt-1 text-sm text-gray-500">{event.description}</Text>
                                            )}
                                            <View className="mt-2 flex-row items-center">
                                                <Clock size={12} color="#6b7280" />
                                                <Text className="ml-1 text-xs text-gray-500">
                                                    {formatDate(event.airDate)}
                                                </Text>
                                                <View
                                                    className={`ml-2 rounded-full px-2 py-1 ${event.isRegistered ? 'bg-green-100' : 'bg-gray-100'}`}
                                                >
                                                    <Text
                                                        className={`text-xs ${event.isRegistered ? 'text-green-700' : 'text-gray-600'}`}
                                                    >
                                                        {event.isRegistered ? '已注册' : '未注册'}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>
                                        <TouchableOpacity
                                            className="p-2"
                                            onPress={() => {
                                                Alert.alert('确认删除', `确定要删除事件 ${event.title} 吗？`, [
                                                    { text: '取消', style: 'cancel' },
                                                    {
                                                        text: '删除',
                                                        style: 'destructive',
                                                        onPress: () => deleteEvent(event.id),
                                                    },
                                                ])
                                            }}
                                        >
                                            <Trash2 size={16} color="#ef4444" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}
