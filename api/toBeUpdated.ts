import { toBeUpdatedTable } from '@/db/schema'
import { TTx } from '@/types'
import { eq } from 'drizzle-orm'

/**
 * 根据动漫id添加到即将更新表中
 * @param tx
 * @param animeId
 * @returns
 */
export async function addToBeUpdatedByAnimeId(tx: TTx, animeId: number) {
    const result = await getToBeUpdatedByAnimeId(tx, animeId)
    if (result) {
        console.log('已经有对应的即将更新表数据了，就不再创建了')
        return
    }
    await tx.insert(toBeUpdatedTable).values({
        animeId,
    })

    console.log('添加到即将更新表成功')
}

/**
 * 根据动漫id删除即将更新表中的数据
 * @param tx
 * @param animeId
 * @returns
 */
export async function deleteToBeUpdatedByAnimeId(tx: TTx, animeId: number) {
    const result = await getToBeUpdatedByAnimeId(tx, animeId)
    if (!result) {
        console.log('对应的即将更新表数据不存在，就不删除了')
        return
    }
    await tx.delete(toBeUpdatedTable).where(eq(toBeUpdatedTable.animeId, animeId))
    console.log('删除即将更新表数据成功')
}

/**
 * 根据动漫id判断即将更新表中的数据是否存在
 * @param tx
 * @param animeId
 * @returns
 */
export async function getToBeUpdatedByAnimeId(tx: TTx, animeId: number) {
    const result = await tx.select().from(toBeUpdatedTable).where(eq(toBeUpdatedTable.animeId, animeId))
    if (result.length === 0) {
        console.log('对应的即将更新表数据不存在')
        return
    }

    return result[0]
}
