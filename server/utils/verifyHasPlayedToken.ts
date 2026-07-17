import CryptoJS from "crypto-js";
import { env } from "~~/server/env";

/** token 有效期（毫秒），当前为 5 分钟 */
const TOKEN_LIFETIME_MS = 5 * 60 * 1000;
/** token 各部分的连接符 */
const TOKEN_SEPARATOR = ":";
/** token 应包含的部分数量：iv、hmac、ciphertext */
const TOKEN_PARTS_COUNT = 3;
/** 随机 salt 长度（字节） */
const SALT_LENGTH_BYTES = 16;
/** AES 初始化向量长度（字节） */
const IV_LENGTH_BYTES = 16;

/** 加密 token 的内部载荷结构 */
interface TokenPayload {
  /** 时间戳（毫秒） */
  t: number;
  /** 随机 salt（hex 字符串） */
  s: string;
  /** 初始 secret 的 SHA-256 摘要（hex 字符串），用于绑定 token 与密钥 */
  h: string;
}

/**
 * 使用 SHA-256 将初始 secret 派生为固定长度的 AES-256 密钥。
 * @param secret - 初始密钥字符串
 * @returns 长度为 32 字节的 WordArray
 */
function deriveKey(secret: string): CryptoJS.lib.WordArray {
  return CryptoJS.SHA256(secret);
}

/**
 * 计算 secret 的 SHA-256 摘要。
 * @param secret - 初始密钥字符串
 * @returns hex 编码的摘要字符串
 */
function hashSecret(secret: string): string {
  return CryptoJS.SHA256(secret).toString(CryptoJS.enc.Hex);
}

/**
 * 校验 secret 是否非空。
 * @param secret - 待校验的 secret
 * @throws 当 secret 为空或仅包含空白字符时抛出错误
 */
function assertSecret(secret: string | undefined): asserts secret is string {
  if (!secret || secret.trim().length === 0) {
    throw new Error("Secret cannot be empty");
  }
}

/**
 * 以恒定时间比较两个等长 hex 字符串，降低时序攻击风险。
 * @param a - hex 字符串 A
 * @param b - hex 字符串 B
 * @returns 内容相同返回 true，否则返回 false
 */
function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * 生成 hasPlayed 端点使用的加密 token。
 *
 * 生成逻辑：
 * 1. 接收初始 secret 字符串；
 * 2. 附加当前时间戳（毫秒）；
 * 3. 生成随机 salt 并附加到载荷；
 * 4. 使用 SHA-256 派生 AES-256 密钥，采用 AES-256-CBC 模式加密载荷；
 * 5. 对 iv 与密文计算 HMAC-SHA256，确保完整性；
 * 6. 返回 `iv:hmac:ciphertext` 格式的 token。
 *
 * @param secret - 用于派生 AES-256 密钥的初始密钥字符串
 * @returns 返回生成的 token，格式为 `iv:hmac:ciphertext`
 * @throws 当 secret 为空或加密过程失败时抛出错误
 */
export async function generateHasPlayedToken(secret: string): Promise<string> {
  assertSecret(secret);

  const timestamp = Date.now();
  const salt = CryptoJS.lib.WordArray.random(SALT_LENGTH_BYTES).toString(
    CryptoJS.enc.Hex,
  );
  const payload: TokenPayload = {
    t: timestamp,
    s: salt,
    h: hashSecret(secret),
  };

  const key = deriveKey(secret);
  const iv = CryptoJS.lib.WordArray.random(IV_LENGTH_BYTES);
  const encrypted = CryptoJS.AES.encrypt(JSON.stringify(payload), key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  const ivHex = iv.toString(CryptoJS.enc.Hex);
  const ciphertextHex = encrypted.ciphertext.toString(CryptoJS.enc.Hex);
  const hmacInput = CryptoJS.enc.Hex.parse(ivHex + ciphertextHex);
  const hmac = CryptoJS.HmacSHA256(hmacInput, key).toString(CryptoJS.enc.Hex);

  return [ivHex, hmac, ciphertextHex].join(TOKEN_SEPARATOR);
}

/**
 * 验证 hasPlayed 端点 token 的有效性、完整性和时效性。
 *
 * 验证逻辑：
 * 1. 解析 token 的 iv、hmac、ciphertext 三部分；
 * 2. 重新计算 HMAC-SHA256 并与 token 中的 hmac 比对，确保数据未被篡改；
 * 3. 使用 AES-256-CBC 解密密文；
 * 4. 校验载荷结构及 secret 摘要是否匹配；
 * 5. 校验时间戳与当前时间的差值是否在 5 分钟以内。
 *
 * @param token - 待验证的 token
 * @param secret - 可选的解密密钥；未提供时使用环境变量 HAS_PLAYED_TOKEN_SECRET
 * @returns token 有效返回 true，否则返回 false
 */
export default async function verifyHasPlayedToken(
  token: string,
  secret?: string,
): Promise<boolean> {
  try {
    const tokenSecret = secret ?? env.HAS_PLAYED_TOKEN_SECRET;
    assertSecret(tokenSecret);

    const parts = token.split(TOKEN_SEPARATOR);
    if (parts.length !== TOKEN_PARTS_COUNT) {
      return false;
    }

    const [ivHex, hmacHex, ciphertextHex] = parts as [string, string, string];
    const key = deriveKey(tokenSecret);

    const hmacInput = CryptoJS.enc.Hex.parse(ivHex + ciphertextHex);
    const expectedHmac = CryptoJS.HmacSHA256(hmacInput, key).toString(
      CryptoJS.enc.Hex,
    );
    if (!safeCompare(hmacHex, expectedHmac)) {
      return false;
    }

    const decrypted = CryptoJS.AES.decrypt(
      CryptoJS.lib.CipherParams.create({
        ciphertext: CryptoJS.enc.Hex.parse(ciphertextHex),
      }),
      key,
      {
        iv: CryptoJS.enc.Hex.parse(ivHex),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      },
    );

    const plaintext = decrypted.toString(CryptoJS.enc.Utf8);
    if (!plaintext) {
      return false;
    }

    const payload = JSON.parse(plaintext) as TokenPayload;
    if (
      typeof payload.t !== "number"
      || typeof payload.s !== "string"
      || typeof payload.h !== "string"
    ) {
      return false;
    }

    if (!safeCompare(payload.h, hashSecret(tokenSecret))) {
      return false;
    }

    const now = Date.now();
    return Math.abs(now - payload.t) <= TOKEN_LIFETIME_MS;
  } catch {
    return false;
  }
}
