import * as FileSystem from 'expo-file-system'

const { StorageAccessFramework } = FileSystem

export async function saveJsonToPublicDirectory(filename: string, jsonData: Record<string, any>) {
    // 请求用户选择一个目录
    const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync()
    if (!permissions.granted) {
        alert('未获得目录访问权限')
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
