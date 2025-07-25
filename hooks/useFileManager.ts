'use client'

import type { AppData, LocalFile } from '@/types'
import { useCallback, useState } from 'react'

// 模拟文件系统操作
export const useFileManager = () => {
    const [files, setFiles] = useState<LocalFile[]>([
        {
            id: '1',
            name: 'anime_data_2024_01_15.json',
            size: 2048,
            createdAt: '2024-01-15T10:30:00Z',
            type: 'export',
        },
        {
            id: '2',
            name: 'backup_2024_01_10.json',
            size: 1536,
            createdAt: '2024-01-10T15:45:00Z',
            type: 'export',
        },
    ])

    const exportData = useCallback(async (data: AppData): Promise<LocalFile> => {
        const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '_')
        const fileName = `anime_data_${timestamp}.json`

        // 模拟导出操作
        await new Promise(resolve => setTimeout(resolve, 1000))

        const newFile: LocalFile = {
            id: Date.now().toString(),
            name: fileName,
            size: JSON.stringify(data).length,
            createdAt: new Date().toISOString(),
            type: 'export',
        }

        setFiles(prev => [newFile, ...prev])
        return newFile
    }, [])

    const importData = useCallback(async (): Promise<AppData> => {
        // 模拟导入操作
        await new Promise(resolve => setTimeout(resolve, 1000))

        const mockData: AppData = {
            animeEvents: [
                {
                    id: 'import_1',
                    title: '导入的动漫 1',
                    episode: 12,
                    airDate: '2024-02-01T09:00:00Z',
                    isRegistered: true,
                    description: '从文件导入的动漫事件',
                },
            ],
            settings: {
                notifications: true,
                autoSync: false,
            },
            lastUpdated: new Date().toISOString(),
        }

        return mockData
    }, [])

    const deleteFile = useCallback((fileId: string) => {
        setFiles(prev => prev.filter(file => file.id !== fileId))
    }, [])

    const deleteFiles = useCallback((fileIds: string[]) => {
        setFiles(prev => prev.filter(file => !fileIds.includes(file.id)))
    }, [])

    return {
        files,
        exportData,
        importData,
        deleteFile,
        deleteFiles,
    }
}
