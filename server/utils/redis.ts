import { consola } from "consola";
import { createClient } from "redis";
import { env } from "../env";

const redis = (() => {
  if (!env.REDIS_URL) {
    consola.warn("未配置 REDIS_URL，将不使用 Redis 缓存");
    return null;
  }

  const client = createClient({ url: env.REDIS_URL });
  client.on("error", (err) => {
    consola.error("Redis 连接错误:", err);
  });
  client.on("connect", () => {
    consola.success("Redis 连接成功");
  });
  client.connect();

  return client;
})();

export { redis };

export async function cacheGet(key: string): Promise<string | null> {
  if (!redis)
    return null;
  return await redis.get(key);
}

export async function cacheSet(key: string, value: string, options?: { EX: number }): Promise<void> {
  if (!redis)
    return;
  await redis.set(key, value, options);
}

export async function cacheDel(key: string): Promise<void> {
  if (!redis)
    return;
  await redis.del(key);
}
