import * as readline from "node:readline";
import { eq } from "drizzle-orm";
import { db } from "../server/db";
import { users } from "../server/db/schema";
import { produceAccessToken } from "../server/utils/auth";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve));
}

const id = await question("请输入管理员ID: ");
console.log(`正在查找管理员ID为${id}的机器人...`);
const user = (await db.select().from(users).where(eq(users.id, id)))[0];

if (!user) {
  console.log("没有此用户");
  process.exit(1);
}
if (!user.permissions.includes("robot")) {
  console.log("当前用户没有机器人权限");
}

const accessToken = await produceAccessToken(user.id, "4weeks");
console.log("获取Robot令牌成功");
console.log(`Robot ID: ${id}`);
console.log(`访问令牌: ${accessToken}`);
process.exit(0);
