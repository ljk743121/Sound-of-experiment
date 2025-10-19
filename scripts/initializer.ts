import * as childProcess from "node:child_process";
import * as crypto from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { promisify } from "node:util";
import * as dotenv from "dotenv";
import { eq } from "drizzle-orm";
import { defaultConfigs } from "~~/constants";

const exec = promisify(childProcess.exec);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

function generateSessionPassword() {
  return crypto.randomBytes(16).toString("hex");
}

async function checkAndUpdateSchema() {
  try {
    console.log("- 正在更新数据库schema");
    const { stdout } = await exec("npm run db:push");
    console.log(stdout);
    console.log("- 数据库schema已更新");
  } catch (error) {
    console.error("错误: 更新数据库schema失败", error);
    console.log("提示: 请确保数据库连接正常");
  }
}

async function main() {
  console.log("===== 开始初始化项目 ======");

  // 1. 检测环境变量是否填写数据库地址
  console.log("\n1. 检测环境变量...");
  const envPath = path.resolve(".env");
  let envContent = "";

  try {
    envContent = await readFile(envPath, "utf8");
    console.log("- 已找到 .env 文件");
  } catch {
    console.log("- 未找到 .env 文件，尝试从 .env.example 创建");
    try {
      const exampleContent = await readFile(".env.example", "utf8");
      await writeFile(envPath, exampleContent, "utf8");
      envContent = exampleContent;
      console.log("- 已从 .env.example 创建 .env 文件");
    } catch {
      console.error("错误: 无法创建 .env 文件");
      process.exit(1);
    }
  }

  // 检测数据库地址
  const hasDatabaseUrl = /^DATABASE_URL=/m.test(envContent)
    && !/^DATABASE_URL=$/m.test(envContent);

  if (!hasDatabaseUrl) {
    console.error("错误: 数据库地址 (DATABASE_URL) 未配置，请在 .env 文件中填写");
    process.exit(1);
  }

  console.log("- 数据库地址已配置");
  await checkAndUpdateSchema();

  // 2. 检测是否配置会话密码
  console.log("\n2. 检测会话密码配置...");
  const hasSessionPassword = /^NUXT_SESSION_PASSWORD=/m.test(envContent)
    && !/^NUXT_SESSION_PASSWORD=$/m.test(envContent);

  if (!hasSessionPassword) {
    console.log("- 未找到会话密码，生成新的密码...");
    const sessionPassword = generateSessionPassword();
    const sessionPasswordLine = `NUXT_SESSION_PASSWORD="${sessionPassword}"`;

    // 过滤掉已有的NUXT_SESSION_PASSWORD行
    const filteredEnvContent = envContent
      .split("\n")
      .filter(line => !line.startsWith("NUXT_SESSION_PASSWORD="))
      .join("\n");

    // 确保文件末尾有换行符
    const newEnvContent = filteredEnvContent.endsWith("\n")
      ? filteredEnvContent + sessionPasswordLine
      : `${filteredEnvContent}\n${sessionPasswordLine}`;

    envContent = newEnvContent;
    await writeFile(envPath, newEnvContent, "utf8");
    console.log("- 会话密码已生成并写入 .env 文件");
  } else {
    console.log("- 会话密码已配置");
  }

  // 3. 检测是否配置公私钥
  console.log("\n3. 检测密钥配置...");
  const keyFields = [
    "SIGN_PUBLIC_KEY",
    "SIGN_PRIVATE_KEY",
    "ENC_PUBLIC_KEY",
    "ENC_PRIVATE_KEY",
    "SIGN_KID",
    "ENC_KID",
  ];

  const missingKeys = [];
  for (const field of keyFields) {
    const regex = new RegExp(`^${field}=`, "m");
    const emptyRegex = new RegExp(`^${field}=$`, "m");

    if (!regex.test(envContent) || emptyRegex.test(envContent)) {
      missingKeys.push(field);
    }
  }

  // 若没有配置公私钥，则运行genKey脚本并填入
  if (missingKeys.length > 0) {
    console.log(`- 发现缺少密钥配置: ${missingKeys.join(", ")}`);
    console.log("- 运行 genKey 脚本生成密钥...");

    try {
      const { stdout } = await exec("npx tsx scripts/genKey.ts");

      // 过滤掉.env文件中所有的密钥配置行
      let filteredEnvContent = envContent
        .split("\n")
        .filter(line => !keyFields.some(key => line.startsWith(`${key}=`)))
        .join("\n");

      // 确保文件末尾有换行符
      if (!filteredEnvContent.endsWith("\n")) {
        filteredEnvContent += "\n";
      }

      // 将genKey的输出追加到过滤后的内容后面
      const newEnvContent = filteredEnvContent + stdout.trim();

      await writeFile(envPath, newEnvContent, "utf8");
      console.log("- 密钥已生成并写入 .env 文件");
    } catch (error) {
      console.error("错误: 生成密钥失败", error);
      process.exit(1);
    }
  } else {
    console.log("- 所有密钥已配置");
  }

  // 4. 检测config表是否有数据，若没有则初始化
  console.log("\n4. 检测配置表...");
  try {
    // 先加载环境变量
    dotenv.config();

    // 动态导入数据库模块，避免提前验证环境变量
    const { db } = await import("../server/db");
    const { configs } = await import("../server/db/schema");

    const configCount = await db.select().from(configs).limit(1);

    if (configCount.length !== defaultConfigs.length) {
      console.log("- 数据库配置表与本地配置不相同，开始初始化...");

      // 检查哪些配置项已经存在，只插入不存在的项
      for (const item of defaultConfigs) {
        try {
          // 尝试选择已存在的配置项
          const existing = await db.select().from(configs).where(eq(configs.key, item.key)).limit(1);

          if (existing.length === 0) {
            // 如果不存在，则插入
            await db.insert(configs).values({ key: item.key, value: item.value });
            console.log(`  - 已添加配置项: ${item.key}`);
          } else {
            console.log(`  - 配置项已存在: ${item.key}`);
          }
        } catch (insertError) {
          console.error(`  - 插入配置项 ${item.key} 失败:`, insertError);
        }
      }
    } else {
      console.log("- 数据库配置表数据与本地相同，无需初始化");
    }
  } catch (error) {
    console.error("错误: 检测或初始化配置表失败", error);
    console.log("提示: 请确保数据库连接正常且表已创建");
  }

  console.log("\n===== 项目初始化完成 =====");
  process.exit(0);
}

main().catch((error) => {
  console.error("初始化失败", error);
  process.exit(1);
});
