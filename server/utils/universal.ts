import { eq } from 'drizzle-orm';
import { db } from '../db';
import { users } from '../db/schema';
import { TRPCError } from '@trpc/server';
import { has } from 'markdown-it/lib/common/utils.mjs';

export async function getUserDetailById(id: string) {
  if (!id) throw new TRPCError({ code: 'BAD_REQUEST', message: '用户ID不能为空' });
  const detail = await db.query.users.findFirst({
    where: eq(users.id, id),
  })
  if (!detail) throw new TRPCError({ code: 'NOT_FOUND', message: '查询失败' });
  return detail;
}

export async function hasBlockWord(content: string) {
  const words = content.match(/\S+/g) || [];

  if (words.length > 0) {
    const blockWords = await db.query.blockWords.findMany();
    const blockWordSet = new Set(blockWords.map(bw => bw.word));
    const hasBlockWord = words.some(word => {
      if (blockWordSet.has(word)) {
        return true;
      }
      return Array.from(blockWordSet).some(bw => word.includes(bw));
    });
    return hasBlockWord;
  }else{
    return false;
  }
}