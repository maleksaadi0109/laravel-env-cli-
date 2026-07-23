"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pluginInstall = pluginInstall;
exports.pluginList = pluginList;
exports.pluginRemove = pluginRemove;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const execa_1 = __importDefault(require("execa"));
const plugin_loader_1 = require("../plugins/plugin-loader");
/**
 * Install a plugin from a git URL or local path.
 */
async function pluginInstall(source) {
    console.log();
    console.log(chalk_1.default.cyan.bold('🔌 Plugin Install'));
    console.log(chalk_1.default.gray('─'.repeat(50)));
    console.log();
    (0, plugin_loader_1.ensurePluginsDir)();
    const pluginsDir = (0, plugin_loader_1.getPluginsDir)();
    // Determine if source is a git URL or local path
    const isGitUrl = source.startsWith('http://') || source.startsWith('https://') || source.startsWith('git@') || source.endsWith('.git');
    if (isGitUrl) {
        // Clone from git
        const repoName = path_1.default.basename(source, '.git').replace(/\.git$/, '');
        const targetPath = path_1.default.join(pluginsDir, repoName);
        if (fs_1.default.existsSync(targetPath)) {
            console.error(chalk_1.default.red(`  ❌ Plugin "${repoName}" is already installed at ${targetPath}`));
            console.log(chalk_1.default.yellow(`  Use ${chalk_1.default.white('lenv plugin remove ' + repoName)} first to reinstall.`));
            console.log();
            return;
        }
        const spinner = (0, ora_1.default)(`Cloning plugin from ${source}...`).start();
        try {
            await (0, execa_1.default)('git', ['clone', source, targetPath]);
            spinner.succeed(chalk_1.default.green(`Plugin "${repoName}" installed successfully!`));
            // Check for package.json with lenv-plugin flag
            const pkgPath = path_1.default.join(targetPath, 'package.json');
            if (fs_1.default.existsSync(pkgPath)) {
                const pkg = JSON.parse(fs_1.default.readFileSync(pkgPath, 'utf8'));
                if (pkg['lenv-plugin'] !== true) {
                    console.log(chalk_1.default.yellow(`  ⚠️  Warning: package.json does not have "lenv-plugin": true`));
                    console.log(chalk_1.default.yellow(`  The plugin may not be loaded automatically.`));
                }
                // Install npm dependencies if they exist
                if (pkg.dependencies || pkg.devDependencies) {
                    const npmSpinner = (0, ora_1.default)('Installing plugin dependencies...').start();
                    try {
                        await (0, execa_1.default)('npm', ['install', '--production'], { cwd: targetPath });
                        npmSpinner.succeed(chalk_1.default.green('Plugin dependencies installed!'));
                    }
                    catch {
                        npmSpinner.warn(chalk_1.default.yellow('Could not install plugin dependencies.'));
                    }
                }
            }
        }
        catch (err) {
            spinner.fail(chalk_1.default.red('Failed to clone plugin repository.'));
            console.error(chalk_1.default.red(`  ${err.message}`));
        }
    }
    else {
        // Copy from local path
        const sourcePath = path_1.default.resolve(source);
        if (!fs_1.default.existsSync(sourcePath)) {
            console.error(chalk_1.default.red(`  ❌ Source path "${sourcePath}" does not exist.`));
            console.log();
            return;
        }
        const pluginName = path_1.default.basename(sourcePath);
        const targetPath = path_1.default.join(pluginsDir, pluginName);
        if (fs_1.default.existsSync(targetPath)) {
            console.error(chalk_1.default.red(`  ❌ Plugin "${pluginName}" is already installed.`));
            console.log(chalk_1.default.yellow(`  Use ${chalk_1.default.white('lenv plugin remove ' + pluginName)} first to reinstall.`));
            console.log();
            return;
        }
        const spinner = (0, ora_1.default)(`Copying plugin from ${sourcePath}...`).start();
        try {
            copyDirRecursive(sourcePath, targetPath);
            spinner.succeed(chalk_1.default.green(`Plugin "${pluginName}" installed successfully!`));
        }
        catch (err) {
            spinner.fail(chalk_1.default.red('Failed to copy plugin.'));
            console.error(chalk_1.default.red(`  ${err.message}`));
        }
    }
    console.log();
    console.log(chalk_1.default.cyan('  Restart lenv to load the new plugin.'));
    console.log();
}
/**
 * List all installed plugins.
 */
async function pluginList() {
    console.log();
    console.log(chalk_1.default.cyan.bold('🔌 Installed Plugins'));
    console.log(chalk_1.default.gray('─'.repeat(50)));
    console.log();
    const plugins = (0, plugin_loader_1.listInstalledPlugins)();
    if (plugins.length === 0) {
        console.log(chalk_1.default.gray('  No plugins installed.'));
        console.log();
        console.log(chalk_1.default.white('  Install a plugin:'));
        console.log(chalk_1.default.yellow('    lenv plugin install <git-url-or-local-path>'));
        console.log();
        console.log(chalk_1.default.white('  Plugin directory:'));
        console.log(chalk_1.default.gray(`    ${(0, plugin_loader_1.getPluginsDir)()}`));
        console.log();
        return;
    }
    for (const plugin of plugins) {
        console.log(chalk_1.default.white(`  📦 ${chalk_1.default.bold(plugin.name)} ${chalk_1.default.gray('v' + plugin.version)}`));
        console.log(chalk_1.default.gray(`     ${plugin.path}`));
        console.log();
    }
    console.log(chalk_1.default.gray(`  ${plugins.length} plugin(s) installed.`));
    console.log();
}
/**
 * Remove an installed plugin.
 */
async function pluginRemove(name) {
    console.log();
    console.log(chalk_1.default.cyan.bold('🔌 Plugin Remove'));
    console.log(chalk_1.default.gray('─'.repeat(50)));
    console.log();
    const pluginsDir = (0, plugin_loader_1.getPluginsDir)();
    const targetPath = path_1.default.join(pluginsDir, name);
    if (!fs_1.default.existsSync(targetPath)) {
        console.error(chalk_1.default.red(`  ❌ Plugin "${name}" is not installed.`));
        console.log();
        const plugins = (0, plugin_loader_1.listInstalledPlugins)();
        if (plugins.length > 0) {
            console.log(chalk_1.default.white('  Installed plugins:'));
            for (const p of plugins) {
                console.log(chalk_1.default.gray(`    - ${p.name}`));
            }
            console.log();
        }
        return;
    }
    const spinner = (0, ora_1.default)(`Removing plugin "${name}"...`).start();
    try {
        fs_1.default.rmSync(targetPath, { recursive: true, force: true });
        spinner.succeed(chalk_1.default.green(`Plugin "${name}" removed successfully!`));
        console.log();
    }
    catch (err) {
        spinner.fail(chalk_1.default.red(`Failed to remove plugin "${name}".`));
        console.error(chalk_1.default.red(`  ${err.message}`));
        console.log();
    }
}
/**
 * Recursively copy a directory.
 */
function copyDirRecursive(src, dest) {
    fs_1.default.mkdirSync(dest, { recursive: true });
    const entries = fs_1.default.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = path_1.default.join(src, entry.name);
        const destPath = path_1.default.join(dest, entry.name);
        if (entry.name === 'node_modules' || entry.name === '.git')
            continue;
        if (entry.isDirectory()) {
            copyDirRecursive(srcPath, destPath);
        }
        else {
            fs_1.default.copyFileSync(srcPath, destPath);
        }
    }
}
