import { IAnime } from '@/api/anime'
import * as DocumentPicker from 'expo-document-picker'
import * as FileSystem from 'expo-file-system'

const DIR = FileSystem.documentDirectory // 使用应用内私有目录

/**
 * 导出数据为json文件
 * @param data
 * @param filename
 * @returns
 */
export async function exportJsonFile(data: object, filename: string) {
    try {
        if (!filename.endsWith('.json')) {
            filename += '.json'
        }

        const path = `${DIR}${filename}`
        const content = JSON.stringify(data, null, 2)
        await FileSystem.writeAsStringAsync(path, content, {
            encoding: FileSystem.EncodingType.UTF8,
        })
        return true
    } catch (error) {
        console.error('创建 JSON 文件失败:', error)
        return false
    }
}

/**
 * 导入json文件数据
 * @returns
 */
export async function importJsonFile(): Promise<{ animeList: IAnime[] }> {
    try {
        const result = await DocumentPicker.getDocumentAsync({
            type: 'application/json',
            copyToCacheDirectory: true,
        })

        if (result.canceled || !result.assets || result.assets.length === 0) {
            console.log('用户取消选择')
            return { animeList: [] }
        }

        const file = result.assets[0]
        const content = await FileSystem.readAsStringAsync(file.uri, {
            encoding: FileSystem.EncodingType.UTF8,
        })

        const data = JSON.parse(content)
        return data
    } catch (error) {
        console.error('读取 JSON 文件失败:', error)
        return { animeList: [] }
    }
}

/**
 * 扫描应用私有目录中的json文件
 * @returns
 */
export async function scanJsonFile() {
    if (!DIR) return []
    try {
        const files = await FileSystem.readDirectoryAsync(DIR)
        const jsonFiles: { name: string; size: number }[] = []

        for (const fileName of files) {
            if (fileName.endsWith('.json')) {
                const info = await FileSystem.getInfoAsync(`${DIR}${fileName}`)
                if (info.exists) {
                    jsonFiles.push({
                        name: fileName,
                        size: info.size ?? 0,
                    })
                }
            }
        }

        return jsonFiles
    } catch (error) {
        console.error('扫描 JSON 文件失败:', error)
        return []
    }
}

/**
 * 删除json文件
 * @param fileName
 * @returns
 */
export async function deleteJsonFile(fileName: string): Promise<boolean> {
    try {
        if (!fileName.endsWith('.json')) {
            fileName += '.json'
        }

        const path = `${DIR}${fileName}`
        const info = await FileSystem.getInfoAsync(path)
        if (!info.exists) {
            console.warn('文件不存在:', path)
            return false
        }

        await FileSystem.deleteAsync(path)
        return true
    } catch (error) {
        console.error('删除 JSON 文件失败:', error)
        return false
    }
}
