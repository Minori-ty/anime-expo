import React, { Fragment } from 'react'
import { Text, View } from 'react-native'

interface IProps {
    title: string
    actions?: React.ReactNode[]
}

function PageHeader({ title, actions }: IProps) {
    return (
        <View className="h-14 flex-row items-center justify-between px-3">
            <Text className="text-2xl font-bold">{title}</Text>
            {actions &&
                actions.map((item, index) => {
                    return <Fragment key={index}>{item}</Fragment>
                })}
        </View>
    )
}

export default PageHeader
