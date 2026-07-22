import type { TSong } from "~~/types";
import { consola } from "consola";
import { defaultVipSign } from "~~/constants";
import * as plugins from "./plugins";

export interface GetMusicUrlItem {
  fn: (id: string) => Promise<{ url: string; pay: boolean }>;
  priority: number;
  retryCount?: number;
}

export interface MusicSourcePlugin {
  name: string;
  alias: string;
  retryCount?: number;
  searchSongs:
    | ((key: string) => Promise<TSong[]>)
    | { fn: (key: string) => Promise<TSong[]>; retryCount?: number };
  getMusicUrl: GetMusicUrlItem[];
}

function withRetry<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  pluginName: string,
  fnName: string,
  maxRetries: number,
): T {
  return (async (...args: any[]) => {
    let lastError: unknown;
    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await fn(...args);
      } catch (error) {
        lastError = error;
        // VIP 歌曲无需重试
        if (error instanceof Error && error.message === defaultVipSign) {
          throw error;
        }
        if (i < maxRetries) {
          consola.warn(
            `[${pluginName}] ${fnName} failed (${error instanceof Error ? error.message : String(error)}). Retrying ${i + 1}/${maxRetries}...`,
          );
          await new Promise(resolve => setTimeout(resolve, 1_000 * (i + 1)));
        }
      }
    }
    throw lastError;
  }) as T;
}

class PluginManager {
  private plugins: Map<string, MusicSourcePlugin> = new Map();

  use(plugin: MusicSourcePlugin): this {
    const pluginRetry = plugin.retryCount ?? 3;

    // Normalize searchSongs — accept both plain fn and { fn, retryCount? }
    const searchRaw = plugin.searchSongs;
    const searchFn = typeof searchRaw === "function" ? searchRaw : searchRaw.fn;
    const searchRetry = typeof searchRaw === "function" ? pluginRetry : (searchRaw.retryCount ?? pluginRetry);
    const wrappedSearchSongs = withRetry(searchFn, plugin.name, "searchSongs", searchRetry);

    // Wrap each getMusicUrl fn — each item can override retryCount
    const wrappedGetMusicUrl = plugin.getMusicUrl.map((item) => {
      const itemRetry = item.retryCount ?? pluginRetry;
      return {
        priority: item.priority,
        fn: withRetry(item.fn, plugin.name, item.fn.name || "getMusicUrl", itemRetry),
      };
    });

    this.plugins.set(plugin.name, {
      ...plugin,
      searchSongs: wrappedSearchSongs,
      getMusicUrl: wrappedGetMusicUrl,
    });
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
