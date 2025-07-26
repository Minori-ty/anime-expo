import { Bell, BellOff, CalendarCheck, CalendarClock, Clock, Heart, Hourglass, Settings } from 'lucide-react-native'
import { cssInterop } from 'nativewind'
import { memo, useMemo } from 'react'

type IconName = keyof typeof iconMap
type IconProps = { name: IconName; className?: string; size?: number }

const iconMap = {
    Heart,
    CalendarClock,
    Settings,
    BellOff,
    Bell,
    CalendarCheck,
    Clock,
    Hourglass,
} as const

const Icon: React.FC<IconProps> = memo(({ name, className, size = 26 }) => {
    const CustomIcon = useMemo(() => {
        const Icon = iconMap[name]
        Icon.displayName = name

        return cssInterop(Icon, {
            className: {
                target: 'style',
                nativeStyleToProp: {
                    color: true,
                    width: true,
                    height: true,
                },
            },
        })
    }, [name])

    return <CustomIcon className={className} size={size} />
})

export default Icon
Icon.displayName = 'Icon'
