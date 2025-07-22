import DatePicker, { type IDatePickerRef } from '@/components/Datepicker'
import { EStatus, EWeekday } from '@/enums'
import { cn } from '@/utils/nativewind'
import { zodResolver } from '@hookform/resolvers/zod'
import { Picker } from '@react-native-picker/picker'
import dayjs from 'dayjs'
import { useNavigation } from 'expo-router'
import React, { PropsWithChildren, useEffect, useRef, useState } from 'react'
import { Controller, FieldError, FieldErrors, useForm } from 'react-hook-form'
import { Button, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import type { DeepExpand } from 'types-tools'
import { z, ZodIssueCode, ZodTypeAny } from 'zod'
import { RadioGroup } from './RadioGroup'
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
function isSerializingErrors(errors: FieldErrors<TFormData>): errors is FieldErrors<TSerializingForm> {
    return 'currentEpisode' in errors
}
function isCompletedErrors(errors: FieldErrors<TFormData>): errors is FieldErrors<TCompletedForm> {
    return 'firstEpisodeYYYYMMDDHHmm' in errors
}
export interface IBaseAnimeFormProps {
    onSubmit: (data: TFormData) => void
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
export interface IBaseAnimeFormRef {
    onSubmit: (data: TFormData) => Promise<TFormData>
}

const baseScheme = z.object({
    name: z.string().min(1, '请输入番剧名称').max(20, '番剧名称长度不能超过20个字符'),
    status: z.union([z.literal(EStatus.completed), z.literal(EStatus.serializing), z.literal(EStatus.toBeUpdated)]),
    updateTimeHHmm: z.string().regex(/(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]/, '请输入正确的时间格式HH:mm'),
    totalEpisode: z.coerce.number().min(1, '总集数至少为1'),
    cover: z.string().url('请输入有效的URL'),
})

function createSchema(status: typeof EStatus.valueType): ZodTypeAny {
    let dynamicFields
    if (status === EStatus.serializing) {
        dynamicFields = {
            updateWeekday: z.coerce.number().int().min(1, '请选择更新周').max(7, '更新周必须在1-7之间'),
            currentEpisode: z.coerce.number().min(1, '当前集数至少为1'),
            status: z.number(),
        }
        return baseScheme.extend(dynamicFields).superRefine((val, ctx) => {
            if (val.currentEpisode > val.totalEpisode) {
                ctx.addIssue({
                    code: ZodIssueCode.custom,
                    path: ['currentEpisode'],
                    message: '当前集数不能大于总集数',
                })
            }
        })
    } else if (status === EStatus.completed) {
        dynamicFields = {
            firstEpisodeYYYYMMDDHHmm: z.string(),
            status: z.number(),
        }
        return baseScheme.extend(dynamicFields).superRefine((val, ctx) => {
            const { totalEpisode, firstEpisodeYYYYMMDDHHmm } = val
            const firstEpisodeDateTimeTimestamp = dayjs(`${firstEpisodeYYYYMMDDHHmm}`).unix()
            if (firstEpisodeDateTimeTimestamp > dayjs().unix()) {
                ctx.addIssue({
                    code: ZodIssueCode.custom,
                    path: ['firstEpisodeYYYYMMDDHHmm'],
                    message: '当前番剧还未播出，请设置正确的日期',
                })
            }
            const lastEpisodeDateTimeTimestamp = dayjs(`${firstEpisodeYYYYMMDDHHmm}`)
                .add((totalEpisode - 1) * 7, 'day')
                .unix()

            if (lastEpisodeDateTimeTimestamp > dayjs().unix()) {
                ctx.addIssue({
                    code: ZodIssueCode.custom,
                    path: ['firstEpisodeYYYYMMDDHHmm'],
                    message: '当前番剧还未完结，请设置正确的日期',
                })
            }
        })
    } else if (status === EStatus.toBeUpdated) {
        dynamicFields = {
            firstEpisodeYYYYMMDDHHmm: z.string(),
            status: z.number(),
        }
        return baseScheme.extend(dynamicFields).superRefine((val, ctx) => {
            const { firstEpisodeYYYYMMDDHHmm } = val
            const firstEpisodeDateTimeTimestamp = dayjs(`${firstEpisodeYYYYMMDDHHmm}`).unix()

            if (firstEpisodeDateTimeTimestamp < dayjs().unix()) {
                ctx.addIssue({
                    code: ZodIssueCode.custom,
                    path: ['firstEpisodeDateTimeYYYYMMDDHHmm'],
                    message: '当前番剧已开播，请设置正确的日期',
                })
            }
        })
    }
    return baseScheme
}

export default function BaseForm({ formData, onSubmit: submit }: IBaseAnimeFormProps) {
    const navigation = useNavigation()
    useEffect(() => {
        navigation.setOptions({
            headerTitle: '添加动漫',
            headerTitleAlign: 'center',
        })
    }, [navigation])

    const [status, setStatus] = useState(formData.status)

    useEffect(() => {
        setStatus(formData.status)
    }, [formData])

    const options = EStatus.toSelect()

    const formSchema = createSchema(status)
    const datepickerRef = useRef<IDatePickerRef>(null)
    const timepickerRef = useRef<IDatePickerRef>(null)
    const {
        control,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<TFormData>({
        resolver: zodResolver(formSchema),
        defaultValues: formData,
    })

    const onSubmit = async (data: TFormData) => {
        submit(data)
    }
    return (
        <KeyboardAwareScrollView bottomOffset={100} showsVerticalScrollIndicator={false} className="bg-white px-4 pt-5">
            <FormItem label="番剧名称" error={errors.name}>
                <Controller
                    control={control}
                    name="name"
                    render={({ field }) => (
                        <TextInput
                            {...field}
                            className={cn(
                                'h-10 rounded-md border border-[#ccc] p-0 pl-2 pt-1 text-start text-base leading-7',
                                errors.name && 'border-red-500'
                            )}
                            placeholder="请输入番剧名称"
                            onChangeText={field.onChange}
                            value={field.value}
                        />
                    )}
                />
            </FormItem>
            <FormItem label="番剧名称" error={errors.status}>
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
                                setStatus(val)
                            }}
                        />
                    )}
                />
            </FormItem>
            {status !== EStatus.serializing && (
                <FormItem
                    label="首播时间"
                    error={isCompletedErrors(errors) ? errors.firstEpisodeYYYYMMDDHHmm : undefined}
                >
                    <Controller
                        control={control}
                        name="firstEpisodeYYYYMMDDHHmm"
                        render={({ field }) => (
                            <TouchableOpacity
                                activeOpacity={0.5}
                                className={cn(
                                    'border-1 h-10 flex-row items-center rounded-md border-[#ccc] pl-3',
                                    isCompletedErrors(errors) && errors.firstEpisodeYYYYMMDDHHmm && 'border-red-500'
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
            {status === EStatus.serializing && (
                <FormItem label="更新周" error={isSerializingErrors(errors) ? errors.updateWeekday : undefined}>
                    <Controller
                        control={control}
                        name="updateWeekday"
                        render={({ field }) => (
                            <Picker
                                {...field}
                                selectedValue={field.value}
                                className={cn('border-1')}
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
                <FormItem
                    label="更新时间(HH:mm)"
                    error={isSerializingErrors(errors) ? errors.updateTimeHHmm : undefined}
                >
                    <Controller
                        control={control}
                        name="updateTimeHHmm"
                        render={({ field }) => (
                            <TouchableOpacity
                                activeOpacity={0.5}
                                className={cn(
                                    'border-1 h-10 flex-row items-center rounded-md border-[#ccc] pl-3',
                                    isSerializingErrors(errors) && errors.updateTimeHHmm && 'border-red-500'
                                )}
                                onPress={() => datepickerRef.current?.open()}
                            >
                                <IconSymbol size={20} name="calendar" color={'#1f1f1f'} />
                                <Text className="ml-3 text-lg">{dayjs(field.value).format('HH:mm')}</Text>
                            </TouchableOpacity>
                        )}
                    />
                </FormItem>
            )}
            {status === EStatus.serializing && (
                <FormItem label="当前更新集数" error={isSerializingErrors(errors) ? errors.currentEpisode : undefined}>
                    <Controller
                        control={control}
                        name="currentEpisode"
                        render={({ field }) => (
                            <TextInput
                                {...field}
                                className={cn(
                                    'h-10 rounded-md border border-[#ccc] p-0 pl-2 pt-1 text-start text-base leading-7',
                                    isSerializingErrors(errors) && errors.currentEpisode && 'border-red-500'
                                )}
                                placeholder="请输入当前更新集数"
                                onChangeText={text => field.onChange(parseInt(text) || 0)}
                                keyboardType="numeric"
                                value={field.value?.toString() || ''}
                            />
                        )}
                    />
                </FormItem>
            )}
            <FormItem label="总集数" error={errors.totalEpisode}>
                <Controller
                    control={control}
                    name="totalEpisode"
                    render={({ field }) => (
                        <TextInput
                            {...field}
                            className={cn(
                                'h-10 rounded-md border border-[#ccc] p-0 pl-2 pt-1 text-start text-base leading-7',
                                errors.totalEpisode && 'border-red-500'
                            )}
                            placeholder="请输入总集数"
                            onChangeText={text => field.onChange(parseInt(text) || 0)}
                            keyboardType="numeric"
                            value={field.value?.toString() || ''}
                        />
                    )}
                />
            </FormItem>
            <FormItem label="封面URL" error={errors.cover}>
                <Controller
                    control={control}
                    name="cover"
                    render={({ field }) => (
                        <TextInput
                            {...field}
                            className={cn(
                                'h-10 rounded-md border border-[#ccc] p-0 pl-2 pt-1 text-start text-base leading-7',
                                errors.cover && 'border-red-500'
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
        </KeyboardAwareScrollView>
    )
}

function FormItem({ children, label, error }: PropsWithChildren<{ label: string; error: FieldError | undefined }>) {
    return (
        <View className="mb-4">
            <Text className="mb-2 text-lg font-medium">{label}</Text>
            {children}
            {error && <ErrorMessage error={error} />}
        </View>
    )
}

function ErrorMessage({ error }: { error: FieldError | undefined }) {
    return error?.message ? <Text className="mt-1 text-base text-red-500">{error.message}</Text> : <></>
}
