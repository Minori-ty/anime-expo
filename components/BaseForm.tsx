import DatePicker, { type IDatePickerRef } from '@/components/Datepicker'
import { EStatus, EWeekday } from '@/enums'
import { cn } from '@/utils/nativewind'
import { getFirstEpisodeTimestamp } from '@/utils/time'
import { DevTool } from '@hookform/devtools'
import { zodResolver } from '@hookform/resolvers/zod'
import { Picker } from '@react-native-picker/picker'
import dayjs from 'dayjs'
import { useNavigation } from 'expo-router'
import React, { PropsWithChildren, useEffect, useMemo, useRef } from 'react'
import { Controller, FieldError, FieldErrors, SubmitHandler, useForm, useWatch } from 'react-hook-form'
import { Button, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import type { DeepExpand } from 'types-tools'
import { RadioGroup } from './RadioGroup'
import { TFormSchema, formSchema } from './schema'
import { IconSymbol } from './ui/IconSymbol'

interface IBaseFormData {
    name: string
    updateTimeHHmm: string
    totalEpisode: number
    cover: string
}

interface ISerializingExtera {
    status: typeof EStatus.serializing
    updateWeekday: typeof EWeekday.valueType
    currentEpisode: number
}
export type TSerializingForm = DeepExpand<IBaseFormData> & DeepExpand<ISerializingExtera>

type ICompletedExtera = {
    status: typeof EStatus.completed | typeof EStatus.toBeUpdated
    firstEpisodeYYYYMMDDHHmm: string
}

export type TCompletedForm = DeepExpand<IBaseFormData> & DeepExpand<ICompletedExtera>

export type TFormData = DeepExpand<TSerializingForm> | DeepExpand<TCompletedForm>

export interface IBaseAnimeFormProps {
    onSubmit: SubmitHandler<TFormSchema>
    formData: {
        name: string
        updateTimeHHmm: string
        totalEpisode: number
        status: typeof EStatus.valueType
        cover: string
        currentEpisode: number
        updateWeekday: typeof EWeekday.valueType
        firstEpisodeYYYYMMDDHHmm: string
    }
}

export default function BaseForm({ formData, onSubmit: submit }: IBaseAnimeFormProps) {
    const navigation = useNavigation()
    useEffect(() => {
        navigation.setOptions({
            headerTitle: '添加动漫',
            headerTitleAlign: 'center',
        })
    }, [navigation])

    const options = EStatus.toSelect()

    const datepickerRef = useRef<IDatePickerRef>(null)
    const timepickerRef = useRef<IDatePickerRef>(null)
    const {
        control,
        handleSubmit,
        formState: { errors },
        watch,
        register,
    } = useForm<TFormSchema>({
        mode: 'all',
        resolver: zodResolver(formSchema),
        defaultValues: formData,
    })

    const fullErrors: FieldErrors<
        Extract<
            TFormSchema,
            {
                currentEpisode: number
                updateWeekday: typeof EWeekday.valueType
                updateTimeHHmm: string
            }
        >
    > &
        FieldErrors<
            Extract<
                TFormSchema,
                {
                    firstEpisodeYYYYMMDDHHmm: string
                }
            >
        > = errors

    const status = useWatch({ control, name: 'status' })

    const [currentEpisode, totalEpisode, firstEpisodeYYYYMMDDHHmm, updateTimeHHmm, updateWeekday] = watch([
        'currentEpisode',
        'totalEpisode',
        'firstEpisodeYYYYMMDDHHmm',
        'updateTimeHHmm',
        'updateWeekday',
    ])
    const onSubmit: SubmitHandler<TFormSchema> = async data => {
        submit(data)
    }
    const getLastEpisodeDateTime = useMemo<string>(() => {
        if (totalEpisode < 1) {
            return '-'
        }
        if (status === EStatus.serializing) {
            return dayjs
                .unix(getFirstEpisodeTimestamp({ currentEpisode, updateTimeHHmm, updateWeekday }))
                .add(totalEpisode - 1, 'week')
                .format('YYYY-MM-DD HH:mm')
        } else if (status === EStatus.completed) {
            return dayjs(firstEpisodeYYYYMMDDHHmm)
                .add(totalEpisode - 1, 'week')
                .format('YYYY-MM-DD HH:mm')
        } else {
            return dayjs(firstEpisodeYYYYMMDDHHmm)
                .add(totalEpisode - 1, 'week')
                .format('YYYY-MM-DD HH:mm')
        }
    }, [status, currentEpisode, totalEpisode, firstEpisodeYYYYMMDDHHmm, updateTimeHHmm, updateWeekday])
    return (
        <KeyboardAwareScrollView bottomOffset={100} showsVerticalScrollIndicator={false} className="bg-white px-4 pt-5">
            <FormItem label="番剧名称" error={fullErrors.name}>
                <Controller
                    control={control}
                    name="name"
                    render={({ field }) => (
                        <TextInput
                            {...field}
                            className={cn(
                                'h-10 rounded-md border border-[#ccc] p-0 pl-2 pt-1 text-start text-base leading-7',
                                fullErrors.name && 'border-red-500'
                            )}
                            placeholder="请输入番剧名称"
                            onChangeText={field.onChange}
                            value={field.value}
                        />
                    )}
                />
            </FormItem>
            <FormItem label="更新状态" error={fullErrors.status}>
                <Controller
                    control={control}
                    name="status"
                    render={({ field }) => (
                        <RadioGroup
                            {...field}
                            options={options}
                            value={field.value}
                            onChange={(val: typeof EStatus.valueType) => {
                                field.onChange(val)
                            }}
                        />
                    )}
                />
            </FormItem>
            {status !== EStatus.serializing && (
                <FormItem label="首播时间" error={fullErrors.firstEpisodeYYYYMMDDHHmm}>
                    <Controller
                        control={control}
                        name="firstEpisodeYYYYMMDDHHmm"
                        render={({ field }) => (
                            <TouchableOpacity
                                activeOpacity={0.5}
                                className={cn(
                                    'h-10 flex-row items-center rounded-md border border-[#ccc] pl-3',
                                    fullErrors.firstEpisodeYYYYMMDDHHmm && 'border-red-500'
                                )}
                                onPress={() => datepickerRef.current?.open()}
                            >
                                <IconSymbol size={20} name="calendar" color={'#1f1f1f'} />
                                <Text className="ml-3 text-lg">{field.value}</Text>
                            </TouchableOpacity>
                        )}
                    />
                </FormItem>
            )}
            {status !== EStatus.serializing && (
                <FormItem label="最后时间" error={undefined}>
                    <Controller
                        control={control}
                        name="firstEpisodeYYYYMMDDHHmm"
                        render={() => <Text className="text-lg">{getLastEpisodeDateTime}</Text>}
                    />
                </FormItem>
            )}

            {status === EStatus.serializing && (
                <FormItem label="更新周" error={fullErrors.updateWeekday}>
                    <Controller
                        control={control}
                        name="updateWeekday"
                        render={({ field }) => (
                            <Picker
                                {...field}
                                selectedValue={field.value}
                                className={cn('border')}
                                onValueChange={field.onChange}
                            >
                                {EWeekday.toMenu().map(item => {
                                    return <Picker.Item key={item.key} label={item.label} value={item.key} />
                                })}
                            </Picker>
                        )}
                    />
                </FormItem>
            )}
            {status === EStatus.serializing && (
                <FormItem label="更新时间(HH:mm)" error={fullErrors.updateTimeHHmm}>
                    <Controller
                        control={control}
                        name="updateTimeHHmm"
                        render={({ field }) => (
                            <TouchableOpacity
                                activeOpacity={0.5}
                                className={cn(
                                    'h-10 flex-row items-center rounded-md border border-[#ccc] pl-3',
                                    fullErrors.updateTimeHHmm && 'border-red-500'
                                )}
                                onPress={() => timepickerRef.current?.open()}
                            >
                                <IconSymbol size={20} name="calendar" color={'#1f1f1f'} />
                                <Text className="ml-3 text-lg">{dayjs(field.value).format('HH:mm')}</Text>
                            </TouchableOpacity>
                        )}
                    />
                </FormItem>
            )}
            {status === EStatus.serializing && (
                <FormItem label="当前更新集数" error={fullErrors.currentEpisode}>
                    {/* <Controller
                        control={control}
                        name="currentEpisode"
                        render={({ field }) => (
                            <TextInput
                                {...field}
                                className={cn(
                                    'h-10 rounded-md border border-[#ccc] p-0 pl-2 pt-1 text-start text-base leading-7',
                                    fullErrors.currentEpisode && 'border-red-500'
                                )}
                                placeholder="请输入当前更新集数"
                                onChangeText={text => field.onChange(parseInt(text) || 0)}
                                keyboardType="numeric"
                                value={field.value?.toString() || ''}
                            />
                        )}
                    /> */}
                    <TextInput
                        {...register('currentEpisode', {
                            valueAsNumber: true,
                        })}
                        className={cn(
                            'h-10 rounded-md border border-[#ccc] p-0 pl-2 pt-1 text-start text-base leading-7',
                            fullErrors.currentEpisode && 'border-red-500'
                        )}
                        placeholder="请输入当前更新集数"
                        keyboardType="numeric"
                    />
                </FormItem>
            )}
            <FormItem label="总集数" error={fullErrors.totalEpisode}>
                {/* <Controller
                    control={control}
                    name="totalEpisode"
                    render={({ field }) => (
                        <TextInput
                            {...field}
                            className={cn(
                                'h-10 rounded-md border border-[#ccc] p-0 pl-2 pt-1 text-start text-base leading-7',
                                fullErrors.totalEpisode && 'border-red-500'
                            )}
                            placeholder="请输入总集数"
                            onChangeText={text => field.onChange(parseInt(text) || 0)}
                            keyboardType="numeric"
                            value={field.value?.toString() || ''}
                        />
                    )}
                /> */}
                <TextInput
                    {...register('totalEpisode', {
                        valueAsNumber: true,
                    })}
                    className={cn(
                        'h-10 rounded-md border border-[#ccc] p-0 pl-2 pt-1 text-start text-base leading-7',
                        fullErrors.totalEpisode && 'border-red-500'
                    )}
                    placeholder="请输入总集数"
                    keyboardType="numeric"
                />
            </FormItem>
            <FormItem label="封面URL" error={fullErrors.cover}>
                <Controller
                    control={control}
                    name="cover"
                    render={({ field }) => (
                        <TextInput
                            {...field}
                            className={cn(
                                'h-10 rounded-md border border-[#ccc] p-0 pl-2 pt-1 text-start text-base leading-7',
                                fullErrors.cover && 'border-red-500'
                            )}
                            placeholder="请输入封面图片URL"
                            onChangeText={field.onChange}
                            value={field.value}
                        />
                    )}
                />
            </FormItem>
            <View className="mb-10">
                <Button title="提交" onPress={handleSubmit(onSubmit)} />
            </View>
            <Controller
                control={control}
                name="firstEpisodeYYYYMMDDHHmm"
                render={({ field }) => (
                    <DatePicker
                        ref={datepickerRef}
                        date={field.value}
                        onChange={date => {
                            field.onChange(dayjs(date).format('YYYY-MM-DD HH:mm'))
                        }}
                    />
                )}
            />
            <Controller
                control={control}
                name="updateTimeHHmm"
                render={({ field }) => (
                    <DatePicker
                        ref={timepickerRef}
                        date={field.value}
                        hideHeader={true}
                        onChange={date => {
                            field.onChange(dayjs(date).format('YYYY-MM-DD HH:mm'))
                        }}
                    />
                )}
            />
            <DevTool control={control} placement="top-right" />
        </KeyboardAwareScrollView>
    )
}

function FormItem({ children, label, error }: PropsWithChildren<{ label: string; error: FieldError | undefined }>) {
    return (
        <View className="mb-4">
            <Text className="mb-2 text-lg font-medium">{label}</Text>
            {children}
            {error?.message ? <Text className="mt-1 text-base text-red-500">{error.message}</Text> : <></>}
        </View>
    )
}
