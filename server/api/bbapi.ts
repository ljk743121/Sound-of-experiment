import { TRPCError } from "@trpc/server";

// for cors
// eslint-disable-next-line unused-imports/no-unused-vars
export default defineEventHandler(async (event) => {
  throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "该接口未开放" });

  // const query = getQuery(event);
  // const url = query.p?.toString() || "";

  // if (!url) {
  //   throw createError({
  //     statusCode: 400,
  //     statusMessage: "参数错误",
  //   });
  // }

  // // const resType = (url.includes("bilivideo")) ? "blob" : "arrayBuffer";
  // const res = await event.$fetch(url, {
  //   headers: {
  //     referer: "https://bilibili.com",
  //     origin: "https://bilibili.com",
  //   },
  //   responseType: "blob",
  // });

  // // consola.log(res);
  // return new Response(res as BodyInit, {
  //   status: 200,
  // });
});
