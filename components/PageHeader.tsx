import { cn } from '@/utils/cn'
import { type ClassValue } from 'clsx'
import React, { Fragment } from 'react'
import { Text, View } from 'react-native'

interface IProps {
    title: string
    actions?: React.ReactNode[]
    leading?: React.ReactNode
    className?: ClassValue
}

function PageHeader({ title, actions, leading, className }: IProps) {
    return (
        <View className={cn('h-14 flex-row items-center justify-between px-3', className)}>
            <View className="flex-row items-center">
                {leading}
                <Text className="ml-2 text-2xl font-bold text-gray-900">{title}</Text>
            </View>
            {actions &&
                actions.map((item, index) => {
                    return <Fragment key={index}>{item}</Fragment>
                })}
        </View>
    )
}

export default PageHeader
