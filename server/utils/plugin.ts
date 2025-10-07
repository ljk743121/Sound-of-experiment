import type { TSong } from "~~/types";
import * as plugins from "./plugins";

export interface MusicSourcePlugin {
  name: string;
  alias: string;
  searchSongs: (key: string, type?: string) => Promise<TSong[]>;
  getMusicUrl: (id: string) => Promise<{ url: string; pay: boolean }>;
  getVipMusicUrl?: (id: string) => Promise<{ url: string; pay: boolean }>;
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
pluginManager
  .use(plugins.WYMusicSourcePlugin())
  .use(plugins.QQMusicSourcePlugin())
  .use(plugins.BiliBiliSourcePlugin());

export { pluginManager };
export const PluginSources = pluginManager.getAllPluginNames();
export const PluginAliases = pluginManager.getAllPluginAliases();
export const AvailablePlugins = pluginManager.getAvailablePlugins();
