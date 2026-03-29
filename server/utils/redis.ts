import { consola } from "consola";
import { createClient } from "redis";

const redis = createClient();
redis.on("error", (err) => {
  consola.error("Redis 连接错误:", err);
});
redis.on("connect", () => {
  consola.success("Redis 连接成功");
});
redis.connect();
export { redis };
