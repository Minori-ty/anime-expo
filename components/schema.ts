import { EStatus, EWeekday } from '@/enums'
import dayjs from 'dayjs'
import { z, ZodIssueCode } from 'zod'

const statusSchema = z.discriminatedUnion('status', [
    z.object({
        status: z.literal(EStatus.serializing),
        updateWeekday: z.union([
            z.literal(EWeekday.monday),
            z.literal(EWeekday.tuesday),
            z.literal(EWeekday.wednesday),
            z.literal(EWeekday.thursday),
            z.literal(EWeekday.friday),
            z.literal(EWeekday.saturday),
            z.literal(EWeekday.sunday),
        ]),
        currentEpisode: z.coerce.number().min(1, '当前集数至少为1'),
        updateTimeHHmm: z.string().regex(/(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]/, '请输入正确的时间格式HH:mm'),
    }),
    z.object({
        status: z.literal(EStatus.completed),
        firstEpisodeYYYYMMDDHHmm: z.string(),
    }),
    z.object({
        status: z.literal(EStatus.toBeUpdated),
        firstEpisodeYYYYMMDDHHmm: z.string(),
    }),
])
const formSchema = z
    .object({
        name: z.string().min(1, '请输入番剧名称').max(20, '番剧名称长度不能超过20个字符'),
        totalEpisode: z.coerce.number().min(1, '总集数至少为1'),
        cover: z.string().url('请输入有效的URL'),
    })
    .and(statusSchema)
    .superRefine((val, ctx) => {
        if (val.status === EStatus.serializing) {
            if (val.currentEpisode > val.totalEpisode) {
                ctx.addIssue({
                    code: ZodIssueCode.custom,
                    path: ['currentEpisode'],
                    message: '当前集数不能大于总集数',
                })
            }
            if (val.currentEpisode === val.totalEpisode) {
                ctx.addIssue({
                    code: ZodIssueCode.custom,
                    path: ['currentEpisode'],
                    message: '该番剧已完结，请选择已完结状态',
                })
            }
        }

        if (val.status === EStatus.completed) {
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
        }

        if (val.status === EStatus.toBeUpdated) {
            const { firstEpisodeYYYYMMDDHHmm } = val
            const firstEpisodeDateTimeTimestamp = dayjs(`${firstEpisodeYYYYMMDDHHmm}`).unix()

            if (firstEpisodeDateTimeTimestamp < dayjs().unix()) {
                ctx.addIssue({
                    code: ZodIssueCode.custom,
                    path: ['firstEpisodeYYYYMMDDHHmm'],
                    message: '当前番剧已开播，请设置正确的日期',
                })
            }
        }
    })

type FormSchema = z.infer<typeof formSchema>

const formDefaultValues: FormSchema = {
    name: 'asf',
    updateTimeHHmm: dayjs().format('YYYY-MM-DD HH:mm'),
    totalEpisode: 5,
    status: EStatus.serializing,
    cover: 'https://pics4.baidu.com/feed/77094b36acaf2edd67093ad9d7fb12f938019305.jpeg@f_auto?token=dd785ba4307a2c24b9b4c58105475fd4',
    currentEpisode: 3,
    updateWeekday: EWeekday.monday,
}

export { formDefaultValues, formSchema, FormSchema }
