import { db } from "~~/server/db";
import { nanoid } from "nanoid";
import { users } from "~~/server/db/schema";
import type { TPermission } from "~~/types";
import { eq } from "drizzle-orm";
import { produceAccessToken } from "~~/server/utils/auth"
import { hashPassword } from "../server/utils/auth";


const permissions: TPermission[] = [
  'login',
  'robot'
]

const id = "9999999";
const name = "robot";
const pwd = nanoid(15);
let user = (await db.select().from(users).where(eq(users.id, id)))[0];
if (!user) {
  user = (await db.insert(users).values({
    id,
    name,
    password: (await hashPassword(pwd)),
    permissions,
  }).returning())[0]
}

if (!user){
  console.log("创建robot失败");
  process.exit(1);
}

const accessToken = await produceAccessToken(user.id,'1yr');
console.log("Robot创建/更新成功");
console.log(`Robot ID: ${id}`);
console.log(`密码: ${pwd}`);
console.log(`访问令牌: ${accessToken}`);
