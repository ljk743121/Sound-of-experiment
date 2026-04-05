import { consola } from "consola";
import { createClient } from "redis";
import { env } from "../env";

const redis = createClient({
  url: env.REDIS_URL,
});
redis.on("error", (err) => {
  consola.error("Redis 连接错误:", err);
});
redis.on("connect", () => {
  consola.success("Redis 连接成功");
});
redis.connect();
export { redis };
