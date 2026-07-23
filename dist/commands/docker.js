"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fixDockerPermissions = fixDockerPermissions;
exports.runDockerUp = runDockerUp;
exports.runDockerDown = runDockerDown;
exports.runDockerPs = runDockerPs;
exports.runDockerLogs = runDockerLogs;
exports.runDockerShell = runDockerShell;
exports.runArtisanCommand = runArtisanCommand;
exports.runComposerCommand = runComposerCommand;
exports.runDockerRestart = runDockerRestart;
exports.runTest = runTest;
const execa_1 = __importDefault(require("execa"));
const chalk_1 = __importDefault(require("chalk"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function checkDockerComposeFile() {
    const composePath = path_1.default.join(process.cwd(), 'docker-compose.yml');
    if (!fs_1.default.existsSync(composePath)) {
        console.error(chalk_1.default.red('❌ Error: No docker-compose.yml found in current working directory.'));
        console.error(chalk_1.default.yellow('Make sure you are inside a laravel-env project directory.'));
        process.exit(1);
    }
}
async function fixDockerPermissions() {
    console.log(chalk_1.default.cyan('🔧 Attempting to fix Docker socket permissions automatically...'));
    try {
        await (0, execa_1.default)('sudo', ['chmod', '666', '/var/run/docker.sock'], { stdio: 'inherit' });
        console.log(chalk_1.default.green('✅ Docker socket permissions updated successfully!'));
        return true;
    }
    catch (err) {
        console.error(chalk_1.default.red('❌ Could not update Docker socket permissions automatically:'), err.message);
        return false;
    }
}
async function runDockerUp(options) {
    checkDockerComposeFile();
    console.log(chalk_1.default.cyan('🐳 Starting Docker environment...'));
    try {
        const args = ['compose', 'up', '-d'];
        if (options?.build) {
            args.push('--build');
        }
        await (0, execa_1.default)('docker', args, { stdio: 'inherit' });
        console.log(chalk_1.default.green('✅ Docker environment started successfully!'));
    }
    catch (err) {
        console.error(chalk_1.default.red('❌ Docker up failed:'), err.message);
        if (err.message && err.message.includes('permission denied') && err.message.includes('docker.sock')) {
            console.log(chalk_1.default.yellow('\n⚠️  Docker permission error detected. Prompting for sudo to auto-fix socket permissions...'));
            const fixed = await fixDockerPermissions();
            if (fixed) {
                console.log(chalk_1.default.cyan('🔄 Retrying Docker up...'));
                try {
                    const args = ['compose', 'up', '-d'];
                    if (options?.build) {
                        args.push('--build');
                    }
                    await (0, execa_1.default)('docker', args, { stdio: 'inherit' });
                    console.log(chalk_1.default.green('✅ Docker environment started successfully!'));
                    return;
                }
                catch (retryErr) {
                    console.error(chalk_1.default.red('❌ Retry failed:'), retryErr.message);
                }
            }
        }
    }
}
async function runDockerDown() {
    checkDockerComposeFile();
    console.log(chalk_1.default.yellow('🛑 Stopping Docker environment...'));
    try {
        await (0, execa_1.default)('docker', ['compose', 'down'], { stdio: 'inherit' });
        console.log(chalk_1.default.green('✅ Docker environment stopped successfully!'));
    }
    catch (err) {
        console.error(chalk_1.default.red('❌ Docker down failed:'), err.message);
    }
}
async function runDockerPs() {
    checkDockerComposeFile();
    try {
        await (0, execa_1.default)('docker', ['compose', 'ps'], { stdio: 'inherit' });
    }
    catch (err) {
        console.error(chalk_1.default.red('❌ Failed to list Docker status:'), err.message);
    }
}
async function runDockerLogs(service) {
    checkDockerComposeFile();
    const args = ['compose', 'logs', '-f'];
    if (service) {
        args.push(service);
    }
    try {
        await (0, execa_1.default)('docker', args, { stdio: 'inherit' });
    }
    catch (err) {
        console.error(chalk_1.default.red('❌ Failed to fetch Docker logs:'), err.message);
    }
}
async function runDockerShell(service = 'app') {
    checkDockerComposeFile();
    console.log(chalk_1.default.cyan(`🐚 Opening interactive shell inside '${service}' container...`));
    try {
        await (0, execa_1.default)('docker', ['compose', 'exec', service, 'sh'], { stdio: 'inherit' });
    }
    catch (err) {
        console.error(chalk_1.default.red(`❌ Shell session ended with error or was closed:`), err.message);
    }
}
async function runArtisanCommand(args) {
    checkDockerComposeFile();
    try {
        await (0, execa_1.default)('docker', ['compose', 'exec', 'app', 'php', 'artisan', ...args], { stdio: 'inherit' });
    }
    catch (err) {
        console.error(chalk_1.default.red('❌ Artisan command failed:'), err.message);
    }
}
async function runComposerCommand(args) {
    checkDockerComposeFile();
    try {
        await (0, execa_1.default)('docker', ['compose', 'exec', 'app', 'composer', ...args], { stdio: 'inherit' });
    }
    catch (err) {
        console.error(chalk_1.default.red('❌ Composer command failed:'), err.message);
    }
}
async function runDockerRestart(service) {
    checkDockerComposeFile();
    const target = service || 'all containers';
    console.log(chalk_1.default.cyan(`🔄 Restarting ${target}...`));
    try {
        const args = ['compose', 'restart'];
        if (service) {
            args.push(service);
        }
        await (0, execa_1.default)('docker', args, { stdio: 'inherit' });
        console.log(chalk_1.default.green(`✅ ${target} restarted successfully!`));
    }
    catch (err) {
        console.error(chalk_1.default.red('❌ Docker restart failed:'), err.message);
    }
}
async function runTest(args) {
    checkDockerComposeFile();
    console.log(chalk_1.default.cyan('🧪 Running tests inside app container...'));
    try {
        await (0, execa_1.default)('docker', ['compose', 'exec', 'app', 'php', 'artisan', 'test', ...args], { stdio: 'inherit' });
    }
    catch (err) {
        console.error(chalk_1.default.red('❌ Test command failed:'), err.message);
    }
}
