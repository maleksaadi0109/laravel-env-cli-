/**
 * Install a plugin from a git URL or local path.
 */
export declare function pluginInstall(source: string): Promise<void>;
/**
 * List all installed plugins.
 */
export declare function pluginList(): Promise<void>;
/**
 * Remove an installed plugin.
 */
export declare function pluginRemove(name: string): Promise<void>;
