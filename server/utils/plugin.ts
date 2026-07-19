import type { TSong } from "~~/types";
import { consola } from "consola";
import * as plugins from "./plugins";

export interface MusicSourcePlugin {
  name: string;
  alias: string;
  searchSongs: (key: string) => Promise<TSong[]>;
  getMusicUrl: { fn: (id: string) => Promise<{ url: string; pay: boolean }>; priority: number }[];
}

const MAX_RETRIES = 5;

function withRetry<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  pluginName: string,
  fnName: string,
): T {
  return (async (...args: any[]) => {
    let lastError: unknown;
    for (let i = 0; i <= MAX_RETRIES; i++) {
      try {
        return await fn(...args);
      } catch (error) {
        lastError = error;
        if (i < MAX_RETRIES) {
          consola.warn(
            `[${pluginName}] ${fnName} failed (${error instanceof Error ? error.message : String(error)}). Retrying ${i + 1}/${MAX_RETRIES}...`,
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
    // Wrap searchSongs with retry
    const wrappedSearchSongs = withRetry(plugin.searchSongs, plugin.name, "searchSongs");

    // Wrap each getMusicUrl fn with retry
    const wrappedGetMusicUrl = plugin.getMusicUrl.map(item => ({
      ...item,
      fn: withRetry(item.fn, plugin.name, item.fn.name || "getMusicUrl"),
    }));

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
