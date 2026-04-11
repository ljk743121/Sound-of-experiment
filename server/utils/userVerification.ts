import { TRPCError } from "@trpc/server";
import { consola } from "consola";
import CryptoJS from "crypto-js";
import { env } from "~~/server/env";

function encryptDES(plaintext: string, key: string, iv: string): string {
  const keyParsed = CryptoJS.enc.Base64.parse(key);
  const ivParsed = CryptoJS.enc.Base64.parse(iv);

  const encrypted = CryptoJS.DES.encrypt(plaintext, keyParsed, {
    iv: ivParsed,
    mode: CryptoJS.mode.CBC,
  });

  return encrypted.toString();
}

function getUserConfig() {
  const configStr = env.USER_API_CONFIG;

  if (!configStr) {
    return null;
  }

  try {
    const config = JSON.parse(configStr);
    return {
      key: config.key,
      iv: config.iv,
      tokenBase: config.tokenBase,
      userBase: config.userBase,
      origin: config.origin,
      token: config.token,
    };
  } catch {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "USER_API_CONFIG 环境变量格式错误",
    });
  }
}

export default async function validateUser(id: string, name: string) {
  const config = getUserConfig();

  if (!config) {
    consola.warn("USER_API_CONFIG 环境变量配置为空,将跳过用户验证");
    return true;
  }

  const { key, iv, tokenBase, userBase, origin, token } = config;

  interface TAccountIDResponse {
    data: [
      {
        AccountID: string;
        SYSAccountID: string;
        AccountNumber: string;
      },
    ];
    success: boolean;
  }
  interface TData {
    data: {
      fullName: string;
    };
    success: boolean;
  }

  if (!id) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "用户不能为空" });
  }

  const AccountID = await $fetch<TAccountIDResponse>(tokenBase, {
    method: "GET",
    headers: {
      Origin: origin,
    },
    parseResponse(responseText) {
      try {
        return JSON.parse(responseText);
      } catch {
        return responseText;
      }
    },
  });

  if (!AccountID.success) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "认证服务器错误" });
  }
  const AccountIDToken = AccountID.data[0].AccountID;

  const user = await $fetch<TData>(userBase, {
    method: "POST",
    body: {
      AccountID: AccountIDToken,
      LoginId: id,
      Password: encryptDES(token, key, iv),
    },
    parseResponse(responseText) {
      try {
        return JSON.parse(responseText);
      } catch {
        return responseText;
      }
    },
  });

  if (!user.success) {
    return false;
  }

  if (user.data.fullName !== name) {
    return false;
  }

  return true;
}
