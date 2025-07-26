import * as DocumentPicker from 'expo-document-picker'
import * as FileSystem from 'expo-file-system'

export async function pickAndReadJson(): Promise<object> {
    try {
        // 1. 让用户选择文件
        const res = await DocumentPicker.getDocumentAsync({
            type: 'application/json', // 只允许选 JSON 文件
            copyToCacheDirectory: true, // 确保复制到缓存目录，才能读取
            multiple: false,
        })

        if (res.canceled || !res.assets || res.assets.length === 0) {
            console.log('用户取消选择')
            return {}
        }

        const file = res.assets[0]
        console.log('选择的文件信息:', file)

        // 2. 读取文件内容
        const content = await FileSystem.readAsStringAsync(file.uri, {
            encoding: FileSystem.EncodingType.UTF8,
        })

        // 3. 解析 JSON
        const data = JSON.parse(content)
        console.log('读取到的 JSON 数据:', data)

        return data
    } catch (error) {
        console.error('读取 JSON 文件失败:', error)
        return {}
    }
}
