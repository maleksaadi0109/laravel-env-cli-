import fs from 'fs';
import path from 'path';
import os from 'os';
import chalk from 'chalk';
import { Command } from 'commander';
import { PluginAPI, PluginRegistration } from './plugin-api';

const PLUGINS_DIR = path.join(os.homedir(), '.lenv', 'plugins');

/**
 * Get the plugins directory path.
 */
export function getPluginsDir(): string {
  return PLUGINS_DIR;
}

/**
 * Ensure the plugins directory exists.
 */
export function ensurePluginsDir(): void {
  if (!fs.existsSync(PLUGINS_DIR)) {
    fs.mkdirSync(PLUGINS_DIR, { recursive: true });
  }
}

/**
 * Discover all installed plugins from ~/.lenv/plugins/.
 * Each plugin is a subdirectory containing a package.json with "lenv-plugin": true.
 */
function discoverPlugins(): string[] {
  if (!fs.existsSync(PLUGINS_DIR)) {
    return [];
  }

  const entries = fs.readdirSync(PLUGINS_DIR, { withFileTypes: true });
  const pluginDirs: string[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const pluginPath = path.join(PLUGINS_DIR, entry.name);
    const pkgPath = path.join(pluginPath, 'package.json');

    if (!fs.existsSync(pkgPath)) continue;

    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      if (pkg['lenv-plugin'] === true) {
        pluginDirs.push(pluginPath);
      }
    } catch {
      // Skip plugins with invalid package.json
    }
  }

  return pluginDirs;
}

/**
 * Load a single plugin and return its registration.
 */
function loadPlugin(pluginPath: string): PluginRegistration | null {
  const pkgPath = path.join(pluginPath, 'package.json');

  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    const mainFile = pkg.main || 'index.js';
    const entryPoint = path.join(pluginPath, mainFile);

    if (!fs.existsSync(entryPoint)) {
      console.warn(chalk.yellow(`⚠️  Plugin "${pkg.name}": entry point "${mainFile}" not found, skipping.`));
      return null;
    }

    const pluginModule = require(entryPoint);
    const registerFn = pluginModule.register || pluginModule.default;

    if (typeof registerFn !== 'function') {
      console.warn(chalk.yellow(`⚠️  Plugin "${pkg.name}": no register() function exported, skipping.`));
      return null;
    }

    const api = new PluginAPI(pkg.name || path.basename(pluginPath), pkg.version || '0.0.0');
    registerFn(api);

    return api.getRegistration();
  } catch (err: any) {
    console.warn(chalk.yellow(`⚠️  Failed to load plugin at "${pluginPath}": ${err.message}`));
    return null;
  }
}

/**
 * Load all plugins and register their commands on the Commander program.
 * Returns an array of all loaded plugin registrations for service/profile access.
 */
export function loadPlugins(program: Command): PluginRegistration[] {
  const pluginPaths = discoverPlugins();
  const registrations: PluginRegistration[] = [];

  for (const pluginPath of pluginPaths) {
    const registration = loadPlugin(pluginPath);
    if (!registration) continue;

    registrations.push(registration);

    // Register plugin commands onto the Commander program
    for (const [cmdName, cmdDef] of registration.commands) {
      program
        .command(cmdName)
        .description(`[plugin: ${registration.name}] ${cmdDef.description}`)
        .allowUnknownOption()
        .action(async (...args: any[]) => {
          try {
            await cmdDef.action(...args);
          } catch (err: any) {
            console.error(chalk.red(`❌ Plugin command "${cmdName}" failed: ${err.message}`));
          }
        });
    }
  }

  if (registrations.length > 0) {
    // Silent load — only show count if there are plugins
  }

  return registrations;
}

/**
 * List all installed plugins with their info.
 */
export function listInstalledPlugins(): Array<{ name: string; version: string; path: string }> {
  const pluginPaths = discoverPlugins();
  const plugins: Array<{ name: string; version: string; path: string }> = [];

  for (const pluginPath of pluginPaths) {
    const pkgPath = path.join(pluginPath, 'package.json');
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      plugins.push({
        name: pkg.name || path.basename(pluginPath),
        version: pkg.version || '0.0.0',
        path: pluginPath,
      });
    } catch {
      // Skip
    }
  }

  return plugins;
}
