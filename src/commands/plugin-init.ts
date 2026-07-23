import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import execa from 'execa';
import { ensurePluginsDir, getPluginsDir, listInstalledPlugins } from '../plugins/plugin-loader';

/**
 * Install a plugin from a git URL or local path.
 */
export async function pluginInstall(source: string) {
  console.log();
  console.log(chalk.cyan.bold('🔌 Plugin Install'));
  console.log(chalk.gray('─'.repeat(50)));
  console.log();

  ensurePluginsDir();
  const pluginsDir = getPluginsDir();

  // Determine if source is a git URL or local path
  const isGitUrl = source.startsWith('http://') || source.startsWith('https://') || source.startsWith('git@') || source.endsWith('.git');

  if (isGitUrl) {
    // Clone from git
    const repoName = path.basename(source, '.git').replace(/\.git$/, '');
    const targetPath = path.join(pluginsDir, repoName);

    if (fs.existsSync(targetPath)) {
      console.error(chalk.red(`  ❌ Plugin "${repoName}" is already installed at ${targetPath}`));
      console.log(chalk.yellow(`  Use ${chalk.white('lenv plugin remove ' + repoName)} first to reinstall.`));
      console.log();
      return;
    }

    const spinner = ora(`Cloning plugin from ${source}...`).start();
    try {
      await execa('git', ['clone', source, targetPath]);
      spinner.succeed(chalk.green(`Plugin "${repoName}" installed successfully!`));

      // Check for package.json with lenv-plugin flag
      const pkgPath = path.join(targetPath, 'package.json');
      if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        if (pkg['lenv-plugin'] !== true) {
          console.log(chalk.yellow(`  ⚠️  Warning: package.json does not have "lenv-plugin": true`));
          console.log(chalk.yellow(`  The plugin may not be loaded automatically.`));
        }

        // Install npm dependencies if they exist
        if (pkg.dependencies || pkg.devDependencies) {
          const npmSpinner = ora('Installing plugin dependencies...').start();
          try {
            await execa('npm', ['install', '--production'], { cwd: targetPath });
            npmSpinner.succeed(chalk.green('Plugin dependencies installed!'));
          } catch {
            npmSpinner.warn(chalk.yellow('Could not install plugin dependencies.'));
          }
        }
      }
    } catch (err: any) {
      spinner.fail(chalk.red('Failed to clone plugin repository.'));
      console.error(chalk.red(`  ${err.message}`));
    }
  } else {
    // Copy from local path
    const sourcePath = path.resolve(source);
    if (!fs.existsSync(sourcePath)) {
      console.error(chalk.red(`  ❌ Source path "${sourcePath}" does not exist.`));
      console.log();
      return;
    }

    const pluginName = path.basename(sourcePath);
    const targetPath = path.join(pluginsDir, pluginName);

    if (fs.existsSync(targetPath)) {
      console.error(chalk.red(`  ❌ Plugin "${pluginName}" is already installed.`));
      console.log(chalk.yellow(`  Use ${chalk.white('lenv plugin remove ' + pluginName)} first to reinstall.`));
      console.log();
      return;
    }

    const spinner = ora(`Copying plugin from ${sourcePath}...`).start();
    try {
      copyDirRecursive(sourcePath, targetPath);
      spinner.succeed(chalk.green(`Plugin "${pluginName}" installed successfully!`));
    } catch (err: any) {
      spinner.fail(chalk.red('Failed to copy plugin.'));
      console.error(chalk.red(`  ${err.message}`));
    }
  }

  console.log();
  console.log(chalk.cyan('  Restart lenv to load the new plugin.'));
  console.log();
}

/**
 * List all installed plugins.
 */
export async function pluginList() {
  console.log();
  console.log(chalk.cyan.bold('🔌 Installed Plugins'));
  console.log(chalk.gray('─'.repeat(50)));
  console.log();

  const plugins = listInstalledPlugins();

  if (plugins.length === 0) {
    console.log(chalk.gray('  No plugins installed.'));
    console.log();
    console.log(chalk.white('  Install a plugin:'));
    console.log(chalk.yellow('    lenv plugin install <git-url-or-local-path>'));
    console.log();
    console.log(chalk.white('  Plugin directory:'));
    console.log(chalk.gray(`    ${getPluginsDir()}`));
    console.log();
    return;
  }

  for (const plugin of plugins) {
    console.log(chalk.white(`  📦 ${chalk.bold(plugin.name)} ${chalk.gray('v' + plugin.version)}`));
    console.log(chalk.gray(`     ${plugin.path}`));
    console.log();
  }

  console.log(chalk.gray(`  ${plugins.length} plugin(s) installed.`));
  console.log();
}

/**
 * Remove an installed plugin.
 */
export async function pluginRemove(name: string) {
  console.log();
  console.log(chalk.cyan.bold('🔌 Plugin Remove'));
  console.log(chalk.gray('─'.repeat(50)));
  console.log();

  const pluginsDir = getPluginsDir();
  const targetPath = path.join(pluginsDir, name);

  if (!fs.existsSync(targetPath)) {
    console.error(chalk.red(`  ❌ Plugin "${name}" is not installed.`));
    console.log();

    const plugins = listInstalledPlugins();
    if (plugins.length > 0) {
      console.log(chalk.white('  Installed plugins:'));
      for (const p of plugins) {
        console.log(chalk.gray(`    - ${p.name}`));
      }
      console.log();
    }
    return;
  }

  const spinner = ora(`Removing plugin "${name}"...`).start();
  try {
    fs.rmSync(targetPath, { recursive: true, force: true });
    spinner.succeed(chalk.green(`Plugin "${name}" removed successfully!`));
    console.log();
  } catch (err: any) {
    spinner.fail(chalk.red(`Failed to remove plugin "${name}".`));
    console.error(chalk.red(`  ${err.message}`));
    console.log();
  }
}

/**
 * Recursively copy a directory.
 */
function copyDirRecursive(src: string, dest: string): void {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.name === 'node_modules' || entry.name === '.git') continue;

    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}
