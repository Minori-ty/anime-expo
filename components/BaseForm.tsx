import { type IDatePickerRef } from '@/components/Datepicker'
import { EStatus, EWeekday } from '@/enums'
import type { ToZodType } from '@/types'
import { cn } from '@/utils/nativewind'
import { zodResolver } from '@hookform/resolvers/zod'
import dayjs from 'dayjs'
import { useNavigation } from 'expo-router'
import React, { PropsWithChildren, useEffect, useRef, useState } from 'react'
import { Controller, FieldError, useForm } from 'react-hook-form'
import { Text, TextInput, View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import type { DeepExpand } from 'types-tools'
import { z, ZodIssueCode, ZodTypeAny } from 'zod'

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
type TSerializingForm = DeepExpand<IBaseFormData> & DeepExpand<ISerializingExtera>

type ICompletedExtera = {
    status: typeof EStatus.completed | typeof EStatus.toBeUpdated
    firstEpisodeYYYYMMDDHHmm: string
}

type ICompletedForm = DeepExpand<IBaseFormData> & DeepExpand<ICompletedExtera>

export type TFormData = DeepExpand<TSerializingForm> | DeepExpand<ICompletedForm>
export interface IBaseAnimeFormProps {
    formData: TSerializingForm | ICompletedForm
    onSubmit: (data: TFormData) => void
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
    let dynamicFields: ToZodType<ICompletedExtera> | ToZodType<ISerializingExtera>
    if (status === EStatus.serializing) {
        dynamicFields = {
            updateWeekday: z.coerce.number().int().min(1, '请选择更新周').max(7, '更新周必须在1-7之间'),
            currentEpisode: z.coerce.number().min(1, '当前集数至少为1'),
            status: z.coerce.number().int().min(2).max(2),
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
            status: z.coerce.number().int().min(2).max(2),
        } satisfies ToZodType<ICompletedExtera>
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
            status: z.coerce.number().int().min(2).max(2),
        } satisfies ToZodType<ICompletedExtera>
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
        return data
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
                                'h-10 rounded-md border border-white p-0 pl-2 pt-1 text-center text-base leading-7',
                                errors.name && 'border-red-500'
                            )}
                            placeholder="请输入番剧名称"
                            onChangeText={field.onChange}
                            value={field.value}
                        />
                    )}
                />
            </FormItem>
        </KeyboardAwareScrollView>
    )
}

function FormItem({ children, label, error }: PropsWithChildren<{ label: string; error: FieldError | undefined }>) {
    return (
        <View className="mb-4">
            <Text className="mb-2 text-xs font-medium">{label}</Text>
            {children}
            {error && <ErrorMessage error={error} />}
        </View>
    )
}

function ErrorMessage({ error }: { error: FieldError | undefined }) {
    return error?.message ? <Text className="mt-1 text-xl text-red-500">{error.message}</Text> : <></>
}
