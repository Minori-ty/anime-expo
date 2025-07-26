import { PermissionsAndroid, Platform } from 'react-native'
import RNFS from 'react-native-fs'

/**
 * 导出数据为本地json
 * @param data
 * @param filename
 * @returns
 */
export async function exportJsonWithRNFS(data: object, filename = 'export.json') {
    try {
        const json = JSON.stringify(data, null, 2)

        let filePath = ''

        if (Platform.OS === 'android') {
            // Android 10 及以下需要权限
            const androidVersion = parseInt(String(Platform.Version), 10)
            if (androidVersion <= 29) {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
                    {
                        title: '存储权限',
                        message: '应用需要写入存储权限以保存文件',
                        buttonPositive: '允许',
                    }
                )
                if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                    alert('无法导出，未获得存储权限')
                    return
                }
            }

            // Android 10+ 默认支持写入 DownloadDirectoryPath
            filePath = `${RNFS.DownloadDirectoryPath}/${filename}`
        } else {
            // iOS：写入应用内沙盒（无法访问下载目录）
            filePath = `${RNFS.DocumentDirectoryPath}/${filename}`
        }

        await RNFS.writeFile(filePath, json, 'utf8')

        alert(`导出成功，文件已保存到:\n${filePath}`)
        console.log('导出成功:', filePath)
    } catch (error) {
        console.error('导出失败:', error)
        alert('导出失败，请检查日志')
    }
}
