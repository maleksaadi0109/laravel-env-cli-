#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { createNewLaravelProject } from './commands/new';
import {
  runDockerUp,
  runDockerDown,
  runDockerPs,
  runDockerLogs,
  runDockerShell,
  runArtisanCommand,
  runComposerCommand,
  fixDockerPermissions,
  runDockerRestart,
  runTest,
} from './commands/docker';
import { selfUpdate } from './commands/self-update';
import { pluginInstall, pluginList, pluginRemove } from './commands/plugin-init';
import { loadPlugins } from './plugins/plugin-loader';

const program = new Command();

program
  .name('laravel-env')
  .alias('lenv')
  .description('CLI tool to create Laravel projects and manage Docker development environments')
  .version('1.1.0');

// ─── Project Creation ──────────────────────────────────────

program
  .command('new [name]')
  .description('Create a new Laravel project with Docker environment')
  .option('-f, --frontend <stack>', 'Frontend stack (blade, vue, react, livewire, api)')
  .option('-p, --profile <name>', 'Use a predefined profile (api, ecommerce, saas)')
  .action(async (name, options) => {
    await createNewLaravelProject(name, options);
  });

// ─── Docker Management ─────────────────────────────────────

program
  .command('up')
  .description('Start Docker containers for current project')
  .option('-b, --build', 'Rebuild docker containers before starting')
  .action(async (options) => {
    await runDockerUp(options);
  });

program
  .command('down')
  .description('Stop Docker containers for current project')
  .action(async () => {
    await runDockerDown();
  });

program
  .command('restart [service]')
  .description('Restart Docker containers (all or specific service)')
  .action(async (service) => {
    await runDockerRestart(service);
  });

program
  .command('ps')
  .description('Show status of running containers')
  .action(async () => {
    await runDockerPs();
  });

program
  .command('logs [service]')
  .description('View container logs (e.g. lenv logs app)')
  .action(async (service) => {
    await runDockerLogs(service);
  });

program
  .command('shell [service]')
  .description('Open interactive shell in container (defaults to "app")')
  .action(async (service) => {
    await runDockerShell(service || 'app');
  });

// ─── Laravel Commands ───────────────────────────────────────

program
  .command('artisan')
  .description('Run php artisan command inside app container (e.g. lenv artisan migrate)')
  .allowUnknownOption()
  .action(async () => {
    const rawArgs = process.argv.slice(process.argv.indexOf('artisan') + 1);
    await runArtisanCommand(rawArgs);
  });

program
  .command('composer')
  .description('Run composer command inside app container (e.g. lenv composer require laravel/sanctum)')
  .allowUnknownOption()
  .action(async () => {
    const rawArgs = process.argv.slice(process.argv.indexOf('composer') + 1);
    await runComposerCommand(rawArgs);
  });

program
  .command('test')
  .description('Run php artisan test inside app container (e.g. lenv test --filter=UserTest)')
  .allowUnknownOption()
  .action(async () => {
    const rawArgs = process.argv.slice(process.argv.indexOf('test') + 1);
    await runTest(rawArgs);
  });

// ─── Maintenance ────────────────────────────────────────────

program
  .command('fix-perms')
  .description('Fix Docker socket permissions automatically (chmod 666 /var/run/docker.sock)')
  .action(async () => {
    await fixDockerPermissions();
  });

program
  .command('self-update')
  .description('Update lenv to the latest version from npm')
  .action(async () => {
    await selfUpdate();
  });

// ─── Plugin System ──────────────────────────────────────────

const pluginCmd = program
  .command('plugin')
  .description('Manage lenv plugins');

pluginCmd
  .command('install <source>')
  .description('Install a plugin from a git URL or local path')
  .action(async (source) => {
    await pluginInstall(source);
  });

pluginCmd
  .command('list')
  .description('List all installed plugins')
  .action(async () => {
    await pluginList();
  });

pluginCmd
  .command('remove <name>')
  .description('Remove an installed plugin')
  .action(async (name) => {
    await pluginRemove(name);
  });

// ─── Load Plugins ───────────────────────────────────────────

try {
  loadPlugins(program);
} catch (err: any) {
  // Silent fail — don't block CLI startup if plugins fail to load
}

// ─── Parse ──────────────────────────────────────────────────

program.parse(process.argv);
