import { getAnimeList, handleDeleteAnime } from '@/api'
import CustomModal from '@/components/CustomModal'
import Loading from '@/components/lottie/Loading'
import PageHeader from '@/components/PageHeader'
import Icon from '@/components/ui/Icon'
import { IconSymbol } from '@/components/ui/IconSymbol'
import { EStatus } from '@/enums'
import { blurhash, themeColorPurple } from '@/styles'
import { TAnimeList } from '@/types'
import { cn } from '@/utils/nativewind'
import { queryClient } from '@/utils/react-query'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { throttle } from 'lodash-es'
import React, { createContext, useCallback, useContext, useState } from 'react'
import {
    Dimensions,
    FlatList,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

interface ModalContextValue {
    modalVisible: boolean
    setModalVisible: React.Dispatch<React.SetStateAction<boolean>>
    animeData: { name: string; id: number }
    setAnimeData: React.Dispatch<
        React.SetStateAction<{
            name: string
            id: number
        }>
    >
}

const GAP = 10
const ModalContext = createContext<ModalContextValue | null>(null)
const useModal = () => {
    const ctx = useContext(ModalContext)
    if (!ctx) throw new Error('useModal 没有用 ModalProvider 包裹')
    return ctx
}

export default function MyAnime() {
    const [modalVisible, setModalVisible] = useState(false)
    const [animeData, setAnimeData] = useState({
        name: '',
        id: -1,
    })
    const router = useRouter()

    const {
        data: list = [],
        refetch,
        isLoading,
    } = useQuery({
        queryKey: ['my-anime'],
        queryFn: getAnimeList,
    })

    function onRefetch() {
        refetch()
        queryClient.invalidateQueries({ queryKey: ['update-anime-currentEpisode'] })
    }

    async function onDeleteAnime() {
        const result = await handleDeleteAnime(animeData.id)
        setModalVisible(false)
        return result
    }
    const { mutate: deleteAnimeMutation } = useMutation({
        mutationFn: onDeleteAnime,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['search'],
            })
            queryClient.invalidateQueries({
                queryKey: ['my-anime'],
            })
            queryClient.invalidateQueries({
                queryKey: ['schedule'],
            })
            queryClient.invalidateQueries({
                queryKey: ['settings-calendar'],
            })
        },
    })

    const handlePress = useCallback(() => {
        const throttledPush = throttle(() => {
            router.push('/addAnime')
        }, 300)

        throttledPush()

        return () => throttledPush.cancel()
    }, [router])

    interface IAnimeContainerProps {
        list: TAnimeList
    }
    function AnimeContainer({ list }: IAnimeContainerProps) {
        return (
            <FlatList
                data={list}
                keyExtractor={item => item.id.toString()}
                numColumns={3}
                columnWrapperStyle={{ gap: GAP }}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ gap: GAP, paddingHorizontal: GAP }}
                renderItem={({ item }) => <AnimeContainerItem data={item} />}
                refreshControl={
                    <RefreshControl
                        refreshing={isLoading}
                        onRefresh={onRefetch}
                        className="text-theme"
                        colors={[themeColorPurple]}
                    />
                }
            />
        )
    }

    return (
        <ModalContext.Provider value={{ modalVisible, setModalVisible, animeData, setAnimeData }}>
            <SafeAreaView edges={['top']} className="flex-1 bg-white pt-4">
                <PageHeader
                    title="我的追番"
                    actions={[
                        <TouchableOpacity onPress={handlePress} key={'header'}>
                            <IconSymbol size={35} name="plus.app.fill" color="black" />
                        </TouchableOpacity>,
                    ]}
                    leading={<Icon name="Heart" size={24} />}
                    className="px-6"
                />
                {list.length > 0 ? <AnimeContainer list={list} /> : <Empty />}
            </SafeAreaView>
            <CustomModal visible={modalVisible} onClose={() => setModalVisible(false)}>
                <View pointerEvents="box-none" className="w-80 rounded-3xl bg-white px-5 pb-9 pt-8">
                    <View>
                        <Text className="mb-4 text-xl font-bold">确认删除</Text>
                        <Text className="text-sm">你确定要删除 &quot;{animeData.name}&quot; 吗？</Text>
                    </View>
                    <View className="mt-5 flex-row justify-end">
                        <View className="">
                            <Pressable
                                onPress={() => setModalVisible(false)}
                                className="h-7 w-16 items-center justify-center"
                            >
                                <Text className="text-theme text-base">取消</Text>
                            </Pressable>
                        </View>
                        <View>
                            <Pressable
                                onPress={() => deleteAnimeMutation()}
                                className="h-7 w-16 items-center justify-center"
                            >
                                <Text className="text-theme text-base">删除</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </CustomModal>
        </ModalContext.Provider>
    )
}

function Empty() {
    const queryState = queryClient.getQueryState(['my-anime'])

    const isLoading = queryState?.fetchStatus === 'fetching'
    function refetch() {
        queryClient.invalidateQueries({ queryKey: ['my-anime'] })
    }
    return (
        <ScrollView
            contentContainerStyle={styles.center}
            refreshControl={
                <RefreshControl
                    refreshing={isLoading}
                    onRefresh={refetch}
                    className="text-theme"
                    colors={[themeColorPurple]}
                />
            }
        >
            {isLoading ? <Loading /> : <Text>暂无动漫数据，请先到右上角添加动漫</Text>}
        </ScrollView>
    )
}
interface IAnimeContainerItemProps {
    data: TAnimeList[number]
}
function AnimeContainerItem({ data }: IAnimeContainerItemProps) {
    const { setModalVisible, setAnimeData } = useModal()
    const router = useRouter()
    function toAnimeDetail() {
        router.push(`/animeDetail/${data.id}`)
    }
    return (
        <Pressable
            onPress={toAnimeDetail}
            onLongPress={() => {
                setModalVisible(true)
                setAnimeData({
                    name: data.name,
                    id: data.id,
                })
            }}
            delayLongPress={300}
            style={{ width: (Dimensions.get('window').width - GAP * 4) / 3 }}
        >
            <View className="flex-1 overflow-hidden rounded-lg bg-sky-300">
                <Image
                    source={data.cover}
                    placeholder={{ blurhash }}
                    contentFit="cover"
                    transition={1000}
                    cachePolicy={'memory-disk'}
                    style={styles.image}
                />
                <UpdateLabel status={data.status} />
            </View>
            <Text numberOfLines={1} className="font-semibold">
                {data.name}
            </Text>
            <Text className="mt-1 text-sm text-gray-500">更新 第{data.currentEpisode}集</Text>
        </Pressable>
    )
}

interface IUpdateLabelProps {
    status: typeof EStatus.valueType
}
function UpdateLabel({ status }: IUpdateLabelProps) {
    return (
        <View
            className={cn('absolute bottom-0 left-0 h-8 items-center justify-center rounded-tr-lg px-2')}
            style={{ backgroundColor: EStatus.raw(status).color }}
        >
            <Text className="truncate text-white">{EStatus.raw(status).label}</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    image: {
        width: (Dimensions.get('window').width - GAP * 4) / 3,
        height: ((Dimensions.get('window').width - GAP * 4) / 3) * 1.5,
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
    },
})
