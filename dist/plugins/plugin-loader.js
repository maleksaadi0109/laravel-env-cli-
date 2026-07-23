"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPluginsDir = getPluginsDir;
exports.ensurePluginsDir = ensurePluginsDir;
exports.loadPlugins = loadPlugins;
exports.listInstalledPlugins = listInstalledPlugins;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const chalk_1 = __importDefault(require("chalk"));
const plugin_api_1 = require("./plugin-api");
const PLUGINS_DIR = path_1.default.join(os_1.default.homedir(), '.lenv', 'plugins');
/**
 * Get the plugins directory path.
 */
function getPluginsDir() {
    return PLUGINS_DIR;
}
/**
 * Ensure the plugins directory exists.
 */
function ensurePluginsDir() {
    if (!fs_1.default.existsSync(PLUGINS_DIR)) {
        fs_1.default.mkdirSync(PLUGINS_DIR, { recursive: true });
    }
}
/**
 * Discover all installed plugins from ~/.lenv/plugins/.
 * Each plugin is a subdirectory containing a package.json with "lenv-plugin": true.
 */
function discoverPlugins() {
    if (!fs_1.default.existsSync(PLUGINS_DIR)) {
        return [];
    }
    const entries = fs_1.default.readdirSync(PLUGINS_DIR, { withFileTypes: true });
    const pluginDirs = [];
    for (const entry of entries) {
        if (!entry.isDirectory())
            continue;
        const pluginPath = path_1.default.join(PLUGINS_DIR, entry.name);
        const pkgPath = path_1.default.join(pluginPath, 'package.json');
        if (!fs_1.default.existsSync(pkgPath))
            continue;
        try {
            const pkg = JSON.parse(fs_1.default.readFileSync(pkgPath, 'utf8'));
            if (pkg['lenv-plugin'] === true) {
                pluginDirs.push(pluginPath);
            }
        }
        catch {
            // Skip plugins with invalid package.json
        }
    }
    return pluginDirs;
}
/**
 * Load a single plugin and return its registration.
 */
function loadPlugin(pluginPath) {
    const pkgPath = path_1.default.join(pluginPath, 'package.json');
    try {
        const pkg = JSON.parse(fs_1.default.readFileSync(pkgPath, 'utf8'));
        const mainFile = pkg.main || 'index.js';
        const entryPoint = path_1.default.join(pluginPath, mainFile);
        if (!fs_1.default.existsSync(entryPoint)) {
            console.warn(chalk_1.default.yellow(`⚠️  Plugin "${pkg.name}": entry point "${mainFile}" not found, skipping.`));
            return null;
        }
        const pluginModule = require(entryPoint);
        const registerFn = pluginModule.register || pluginModule.default;
        if (typeof registerFn !== 'function') {
            console.warn(chalk_1.default.yellow(`⚠️  Plugin "${pkg.name}": no register() function exported, skipping.`));
            return null;
        }
        const api = new plugin_api_1.PluginAPI(pkg.name || path_1.default.basename(pluginPath), pkg.version || '0.0.0');
        registerFn(api);
        return api.getRegistration();
    }
    catch (err) {
        console.warn(chalk_1.default.yellow(`⚠️  Failed to load plugin at "${pluginPath}": ${err.message}`));
        return null;
    }
}
/**
 * Load all plugins and register their commands on the Commander program.
 * Returns an array of all loaded plugin registrations for service/profile access.
 */
function loadPlugins(program) {
    const pluginPaths = discoverPlugins();
    const registrations = [];
    for (const pluginPath of pluginPaths) {
        const registration = loadPlugin(pluginPath);
        if (!registration)
            continue;
        registrations.push(registration);
        // Register plugin commands onto the Commander program
        for (const [cmdName, cmdDef] of registration.commands) {
            program
                .command(cmdName)
                .description(`[plugin: ${registration.name}] ${cmdDef.description}`)
                .allowUnknownOption()
                .action(async (...args) => {
                try {
                    await cmdDef.action(...args);
                }
                catch (err) {
                    console.error(chalk_1.default.red(`❌ Plugin command "${cmdName}" failed: ${err.message}`));
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
function listInstalledPlugins() {
    const pluginPaths = discoverPlugins();
    const plugins = [];
    for (const pluginPath of pluginPaths) {
        const pkgPath = path_1.default.join(pluginPath, 'package.json');
        try {
            const pkg = JSON.parse(fs_1.default.readFileSync(pkgPath, 'utf8'));
            plugins.push({
                name: pkg.name || path_1.default.basename(pluginPath),
                version: pkg.version || '0.0.0',
                path: pluginPath,
            });
        }
        catch {
            // Skip
        }
    }
    return plugins;
}
