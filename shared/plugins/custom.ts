import type { TSong } from "~~/types";
// import { consola } from "consola";
import { createPlugin } from "../plugin";

// placeholder
// eslint-disable-next-line unused-imports/no-unused-vars
async function customSearch(key: string) {
  return [<TSong>{}];
}

async function customFetch(id: string) {
  return {
    url: id.replace(/^http:/, "https:"),
    pay: false,
  };
}

export const custom = createPlugin({
  name: "custom",
  alias: "用户上传",
  searchSongs: customSearch,
  getMusicUrl: [
    { fn: customFetch, priority: 1 },
  ],
});
