import { db } from "~~/server/db";
import { users } from "~~/server/db/schema";
import type { TPermission } from "~~/types";
import { permissionNames } from "~~/constants";
import { eq } from "drizzle-orm";
import * as readline from "node:readline";

const permissions: TPermission[] = Array.from(permissionNames, (name) => name.value);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query: string): Promise<string> =>
  new Promise((resolve) => rl.question(query, resolve));

const id = await question("请输入管理员ID: ");

if ((await db.select().from(users).where(eq(users.id, id))).length == 0) {
  console.log("管理员不存在");
  process.exit(1);
}

await db.update(users).set({ permissions }).where(eq(users.id, id));

console.log("管理员权限更新成功");
console.log(`管理员ID: ${id}`);
