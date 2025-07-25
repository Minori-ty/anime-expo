import type { AnimeEvent } from '@/types'
import { useCallback, useState } from 'react'

export const useAnimeEvents = () => {
    const [events, setEvents] = useState<AnimeEvent[]>([
        {
            id: '1',
            title: '进击的巨人 最终季',
            episode: 24,
            airDate: '2024-02-15T09:00:00Z',
            isRegistered: true,
            description: '最终决战篇',
        },
        {
            id: '2',
            title: '鬼灭之刃 锻刀村篇',
            episode: 11,
            airDate: '2024-02-16T10:30:00Z',
            isRegistered: true,
            description: '炭治郎的新冒险',
        },
        {
            id: '3',
            title: '咒术回战 第二季',
            episode: 23,
            airDate: '2024-02-17T11:00:00Z',
            isRegistered: false,
            description: '涉谷事变篇',
        },
        {
            id: '4',
            title: '间谍过家家 第二季',
            episode: 12,
            airDate: '2024-02-18T08:30:00Z',
            isRegistered: true,
            description: '阿尼亚的学校生活',
        },
        {
            id: '5',
            title: '链锯人',
            episode: 12,
            airDate: '2024-02-19T09:30:00Z',
            isRegistered: false,
            description: '电次的恶魔猎人之路',
        },
    ])

    const deleteEvent = useCallback((eventId: string) => {
        setEvents(prev => prev.filter(event => event.id !== eventId))
    }, [])

    const deleteEvents = useCallback((eventIds: string[]) => {
        setEvents(prev => prev.filter(event => !eventIds.includes(event.id)))
    }, [])

    const updateEvent = useCallback((eventId: string, updates: Partial<AnimeEvent>) => {
        setEvents(prev => prev.map(event => (event.id === eventId ? { ...event, ...updates } : event)))
    }, [])

    const addImportedEvents = useCallback((newEvents: AnimeEvent[]) => {
        setEvents(prev => [...prev, ...newEvents])
    }, [])

    return {
        events,
        deleteEvent,
        deleteEvents,
        updateEvent,
        addImportedEvents,
    }
}
