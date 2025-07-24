import DatePicker, { type IDatePickerRef } from '@/components/Datepicker'
import { EStatus, EWeekday } from '@/enums'
import { cn } from '@/utils/nativewind'
import { getFirstEpisodeTimestamp } from '@/utils/time'
import { zodResolver } from '@hookform/resolvers/zod'
import { Picker } from '@react-native-picker/picker'
import dayjs from 'dayjs'
import { useNavigation } from 'expo-router'
import React, { PropsWithChildren, useEffect, useMemo, useRef } from 'react'
import { Controller, FieldError, FieldErrors, SubmitHandler, useForm, useWatch } from 'react-hook-form'
import { Button, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import type { DeepExpand } from 'types-tools'
import { z, ZodIssueCode, ZodTypeAny } from 'zod'
import { RadioGroup } from './RadioGroup'
import { FormSchema, formSchema } from './schema'
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
    onSubmit: SubmitHandler<FormSchema>
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
                    path: ['firstEpisodeYYYYMMDDHHmm'],
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

    // const [status, setStatus] = useState(formData.status)

    // useEffect(() => {
    //     setStatus(formData.status)
    // }, [formData])

    const options = EStatus.toSelect()

    // const formSchema = createSchema(status)
    const datepickerRef = useRef<IDatePickerRef>(null)
    const timepickerRef = useRef<IDatePickerRef>(null)
    const {
        control,
        handleSubmit,
        formState: { errors },
        watch,
    } = useForm<FormSchema>({
        mode: 'all',
        resolver: zodResolver(formSchema),
        defaultValues: formData,
    })

    const fullErrors: FieldErrors<
        Extract<
            FormSchema,
            {
                currentEpisode: number
                updateWeekday: typeof EWeekday.valueType
                updateTimeHHmm: string
            }
        >
    > &
        FieldErrors<
            Extract<
                FormSchema,
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
    const onSubmit: SubmitHandler<FormSchema> = async data => {
        submit(data)
    }
    const getLastEpisodeDateTime = useMemo<string>(() => {
        if (totalEpisode <= 1) {
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
                                    'h-10 flex-row items-center rounded-md border-1 border-[#ccc] pl-3',
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
                        render={({ field }) => <Text className="text-lg">{getLastEpisodeDateTime}</Text>}
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
                <FormItem label="更新时间(HH:mm)" error={fullErrors.updateTimeHHmm}>
                    <Controller
                        control={control}
                        name="updateTimeHHmm"
                        render={({ field }) => (
                            <TouchableOpacity
                                activeOpacity={0.5}
                                className={cn(
                                    'h-10 flex-row items-center rounded-md border-1 border-[#ccc] pl-3',
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
                    <Controller
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
                    />
                </FormItem>
            )}
            <FormItem label="总集数" error={fullErrors.totalEpisode}>
                <Controller
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
