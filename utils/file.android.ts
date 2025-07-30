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
    if (!filename.endsWith('.json')) {
        filename += '.json'
    }

    const path = `${DIR}${filename}`
    const content = JSON.stringify(data, null, 2)
    await FileSystem.writeAsStringAsync(path, content, {
        encoding: FileSystem.EncodingType.UTF8,
    })
    return true
}

/**
 * 导入json文件数据
 * @returns
 */
export async function importJsonFile(): Promise<{ animeList: IAnime[] }> {
    const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
    })

    if (result.canceled || !result.assets || result.assets.length === 0) {
        throw Error('用户取消选择')
    }

    const file = result.assets[0]
    const content = await FileSystem.readAsStringAsync(file.uri, {
        encoding: FileSystem.EncodingType.UTF8,
    })

    const data = JSON.parse(content)
    return data
}

/**
 * 扫描应用私有目录中的json文件
 * @returns
 */
export async function scanJsonFile() {
    if (!DIR) return []
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
}

/**
 * 删除json文件
 * @param fileName
 * @returns
 */
export async function deleteJsonFile(fileName: string): Promise<boolean> {
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
}
