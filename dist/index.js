#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const new_1 = require("./commands/new");
const docker_1 = require("./commands/docker");
const program = new commander_1.Command();
program
    .name('laravel-env')
    .alias('lenv')
    .description('CLI tool to create Laravel projects and manage Docker development environments')
    .version('1.0.0');
program
    .command('new [name]')
    .description('Create a new Laravel project with Docker environment')
    .option('-f, --frontend <stack>', 'Frontend stack (blade, vue, react, livewire, api)')
    .action(async (name, options) => {
    await (0, new_1.createNewLaravelProject)(name, options);
});
program
    .command('up')
    .description('Start Docker containers for current project')
    .option('-b, --build', 'Rebuild docker containers before starting')
    .action(async (options) => {
    await (0, docker_1.runDockerUp)(options);
});
program
    .command('down')
    .description('Stop Docker containers for current project')
    .action(async () => {
    await (0, docker_1.runDockerDown)();
});
program
    .command('ps')
    .description('Show status of running containers')
    .action(async () => {
    await (0, docker_1.runDockerPs)();
});
program
    .command('logs [service]')
    .description('View container logs (e.g. lenv logs app)')
    .action(async (service) => {
    await (0, docker_1.runDockerLogs)(service);
});
program
    .command('shell [service]')
    .description('Open interactive shell in container (defaults to "app")')
    .action(async (service) => {
    await (0, docker_1.runDockerShell)(service || 'app');
});
program
    .command('artisan')
    .description('Run php artisan command inside app container (e.g. lenv artisan migrate)')
    .allowUnknownOption()
    .action(async () => {
    const rawArgs = process.argv.slice(process.argv.indexOf('artisan') + 1);
    await (0, docker_1.runArtisanCommand)(rawArgs);
});
program
    .command('composer')
    .description('Run composer command inside app container (e.g. lenv composer require laravel/sanctum)')
    .allowUnknownOption()
    .action(async () => {
    const rawArgs = process.argv.slice(process.argv.indexOf('composer') + 1);
    await (0, docker_1.runComposerCommand)(rawArgs);
});
program
    .command('fix-perms')
    .description('Fix Docker socket permissions automatically (chmod 666 /var/run/docker.sock)')
    .action(async () => {
    await (0, docker_1.fixDockerPermissions)();
});
program.parse(process.argv);
