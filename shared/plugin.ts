import type { TSong } from "~~/types";
import * as plugins from "./plugins";

export interface MusicSourcePlugin {
  name: string;
  alias: string;
  searchSongs: (key: string) => Promise<TSong[]>;
  getMusicUrl: { fn: (id: string) => Promise<{ url: string; pay: boolean }>; priority: number }[];
}

class PluginManager {
  private plugins: Map<string, MusicSourcePlugin> = new Map();

  use(plugin: MusicSourcePlugin): this {
    this.plugins.set(plugin.name, plugin);
    return this;
  }

  get(pluginName: string): MusicSourcePlugin | undefined {
    return this.plugins.get(pluginName);
  }

  getAllPluginNames(): string[] {
    return Array.from(this.plugins.keys());
  }

  getAllPluginAliases(): string[] {
    return Array.from(this.plugins.values()).map(plugin => plugin.alias || plugin.name);
  }

  getAvailablePlugins(): Record<string, string> {
    const map: Record<string, string> = {};
    for (const [name, plugin] of this.plugins) {
      map[name] = plugin.alias || name;
    }
    return map;
  }
}

const pluginManager = new PluginManager();

export function createPlugin(plugin: MusicSourcePlugin) {
  return plugin;
}

pluginManager
  .use(plugins.netease)
  .use(plugins.qqmusic)
  .use(plugins.bilibili);
// .use(plugins.custom);

export { pluginManager };
export const PluginSources = pluginManager.getAllPluginNames();
export const PluginAliases = pluginManager.getAllPluginAliases();
export const AvailablePlugins = pluginManager.getAvailablePlugins();

export async function fetchMusicUrl(id: string, source: string) {
  if (!id || !source) {
    throw new Error("缺少参数");
  }
  let songInfo = { url: "", pay: false };
  const musicSource = pluginManager.get(source);
  if (!musicSource || !musicSource.getMusicUrl) {
    throw new Error("未知的源");
  }

  for (const sourceItem of musicSource.getMusicUrl.sort((a, b) => b.priority - a.priority)) {
    try {
      songInfo = await sourceItem.fn(id).then((res) => {
        if (res.url) {
          return res;
        } else {
          throw new Error("音乐链接为空");
        }
      });
      return songInfo;
    } catch (e: any) {
      // eslint-disable-next-line no-console
      console.log(
        new Date().toLocaleString("zh-CN"),
        "|",
        `[SongRequest]`,
        id,
        "->",
        source,
        sourceItem.fn.name || "未知函数",
        "|",
        e.message,
      );
    }
  }

  if (!songInfo.url) {
    throw new Error("获取音乐链接失败");
  }

  return songInfo;
}

export async function searchSongs(key: string, source: string) {
  if (!key || !source) {
    throw new Error("缺少参数");
  }
  const musicSource = pluginManager.get(source);
  if (!musicSource || !musicSource.getMusicUrl) {
    throw new Error("未知的源");
  }
  try {
    const res = await musicSource.searchSongs(key);
    return res;
  } catch {
    throw new Error("搜索歌曲失败");
  }
}
