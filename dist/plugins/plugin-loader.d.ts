import { Command } from 'commander';
import { PluginRegistration } from './plugin-api';
/**
 * Get the plugins directory path.
 */
export declare function getPluginsDir(): string;
/**
 * Ensure the plugins directory exists.
 */
export declare function ensurePluginsDir(): void;
/**
 * Load all plugins and register their commands on the Commander program.
 * Returns an array of all loaded plugin registrations for service/profile access.
 */
export declare function loadPlugins(program: Command): PluginRegistration[];
/**
 * List all installed plugins with their info.
 */
export declare function listInstalledPlugins(): Array<{
    name: string;
    version: string;
    path: string;
}>;
