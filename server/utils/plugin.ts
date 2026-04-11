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
