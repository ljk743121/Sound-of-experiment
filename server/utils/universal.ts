import { TRPCError } from "@trpc/server";
import { consola } from "consola";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { configs, users } from "../db/schema";

export async function getConfig(key: string) {
  const value = await db.query.configs.findFirst({
    where: eq(configs.key, key),
  });
  return value?.value;
}

export async function getAllConfigs() {
  const values = await db.query.configs.findMany();
  return values;
}

export async function updateConfig(key: string, value: string) {
  const config = await db.query.configs.findFirst({
    where: eq(configs.key, key),
  });
  if (!config) {
    throw new TRPCError({ code: "NOT_FOUND", message: "更新失败" });
  } else {
    await db.update(configs).set({
      value: value.toString(),
    }).where(eq(configs.key, config.key));
  }
}

export async function getUserDetailById(id: string) {
  if (!id)
    throw new TRPCError({ code: "BAD_REQUEST", message: "用户ID不能为空" });
  const detail = await db.query.users.findFirst({
    where: eq(users.id, id),
  });
  if (!detail)
    throw new TRPCError({ code: "NOT_FOUND", message: "查询失败" });
  return detail;
}

const blockWordsApi = "https://v2.xxapi.cn/api/detect";
async function detectBlockWord(content: string) {
  consola.info("Using blockWordsApi");
  interface BlockWord {
    code: number;
    msg: string;
    data: {
      is_prohibited: boolean;
    };
  }
  const res = await $fetch<BlockWord>(blockWordsApi, {
    method: "GET",
    params: {
      text: content,
    },
    parseResponse(responseText) {
      try {
        return JSON.parse(responseText);
      } catch {
        return responseText;
      }
    },
  });
  if (res.code !== 200)
    return true;
  return res.data.is_prohibited;
}

export async function hasBlockWord(content: string) {
  const words = content.match(/\S+/g) || [];

  if (words.length > 0) {
    const blockWords = await db.query.blockWords.findMany();
    const blockWordSet = new Set(blockWords.map(bw => bw.word));
    const hasBlockWord = words.some((word) => {
      if (blockWordSet.has(word)) {
        return true;
      }
      return Array.from(blockWordSet).some(bw => word.includes(bw));
    });
    if (!hasBlockWord && (await getConfig("blockWordsApi")) === "true") {
      return await detectBlockWord(content);
    } else {
      return hasBlockWord;
    }
  } else {
    return false;
  }
}
