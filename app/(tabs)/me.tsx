import React from 'react'
import { Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function me() {
    return (
        <SafeAreaView edges={['top']} className="flex-1 bg-white">
            <View>
                <Text>me</Text>
            </View>
        </SafeAreaView>
    )
}
