import { IAnime } from '@/api/anime'
import * as DocumentPicker from 'expo-document-picker'
import * as FileSystem from 'expo-file-system'
import RNFS from 'react-native-fs'

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

        const path = `${RNFS.ExternalDirectoryPath}/${filename}`
        const content = JSON.stringify(data, null, 2)
        await RNFS.writeFile(path, content, 'utf8')
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
        // 1. 选择文件
        const result = await DocumentPicker.getDocumentAsync({
            type: 'application/json', // 限定只选 JSON 文件
            copyToCacheDirectory: true, // 拷贝一份，确保我们可以读取
        })

        if (result.canceled || !result.assets || result.assets.length === 0) {
            console.log('用户取消选择')
            return { animeList: [] }
        }

        const file = result.assets[0]
        const fileUri = file.uri // 这是缓存路径，可直接读取

        // 2. 读取文件内容
        const content = await FileSystem.readAsStringAsync(fileUri, {
            encoding: FileSystem.EncodingType.UTF8,
        })

        // 3. 尝试解析 JSON
        const data = JSON.parse(content)
        return data
    } catch (error) {
        console.error('读取 JSON 文件失败:', error)
        return { animeList: [] }
    }
}

/**
 * 扫描私有文件夹中的json文件
 * @returns
 */
export async function scanJsonFile() {
    try {
        const files = await RNFS.readDir(RNFS.ExternalDirectoryPath)
        const jsonFiles = files
            .filter(file => file.isFile() && file.name.endsWith('.json'))
            .map(file => {
                return {
                    name: file.name,
                    size: file.size ?? 0,
                }
            }) // 👈 只取文件名
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

        const path = `${RNFS.ExternalDirectoryPath}/${fileName}`
        const exists = await RNFS.exists(path)
        if (!exists) {
            console.warn('文件不存在:', path)
            return false
        }

        await RNFS.unlink(path)
        return true
    } catch (error) {
        console.error('删除 JSON 文件失败:', error)
        return false
    }
}
