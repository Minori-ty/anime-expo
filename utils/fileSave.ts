import * as FileSystem from 'expo-file-system'

const { StorageAccessFramework } = FileSystem

export async function saveJsonToPublicDirectory(filename: string, jsonData: object) {
    // 请求用户选择一个目录
    const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync()
    if (!permissions.granted) {
        return
    }
    const directoryUri = permissions.directoryUri

    // 创建文件并写入内容
    await StorageAccessFramework.createFileAsync(directoryUri, filename, 'application/json')
        .then(async fileUri => {
            await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(jsonData))
            alert('保存成功')
        })
        .catch(e => {
            alert('保存失败: ' + e.message)
        })
}

// 导出数据到文件
export async function exportToFile(fileName: string, data: object) {
    try {
        // 构建文件路径（使用应用专属文档目录）
        const fileUri = FileSystem.documentDirectory + fileName

        // 将数据转换为JSON字符串（如果是JSON数据）
        const content = typeof data === 'object' ? JSON.stringify(data) : data

        // 写入文件
        await FileSystem.writeAsStringAsync(fileUri, content, {
            encoding: FileSystem.EncodingType.UTF8,
        })

        alert(`文件已成功导出到: ${fileUri}`)
        return fileUri
    } catch (error) {
        console.error('导出文件时出错:', error)
        return null
    }
}
