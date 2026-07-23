"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.selfUpdate = selfUpdate;
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const execa_1 = __importDefault(require("execa"));
const https_1 = __importDefault(require("https"));
const PACKAGE_NAME = 'laravel-env-cli';
const CURRENT_VERSION = require('../../package.json').version;
/**
 * Fetch the latest version from the npm registry.
 */
function fetchLatestVersion() {
    return new Promise((resolve, reject) => {
        const url = `https://registry.npmjs.org/${PACKAGE_NAME}/latest`;
        https_1.default.get(url, { headers: { 'Accept': 'application/json' } }, (res) => {
            let data = '';
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve(json.version || CURRENT_VERSION);
                }
                catch {
                    reject(new Error('Failed to parse npm registry response'));
                }
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}
/**
 * Compare two semver version strings.
 * Returns: -1 if a < b, 0 if a == b, 1 if a > b.
 */
function compareVersions(a, b) {
    const partsA = a.split('.').map(Number);
    const partsB = b.split('.').map(Number);
    for (let i = 0; i < 3; i++) {
        const numA = partsA[i] || 0;
        const numB = partsB[i] || 0;
        if (numA < numB)
            return -1;
        if (numA > numB)
            return 1;
    }
    return 0;
}
async function selfUpdate() {
    console.log();
    console.log(chalk_1.default.cyan.bold('🔄 lenv self-update'));
    console.log(chalk_1.default.gray('─'.repeat(50)));
    console.log();
    console.log(chalk_1.default.white(`  Current version: ${chalk_1.default.yellow(CURRENT_VERSION)}`));
    const spinner = (0, ora_1.default)('Checking for updates on npm...').start();
    try {
        const latestVersion = await fetchLatestVersion();
        spinner.stop();
        console.log(chalk_1.default.white(`  Latest version:  ${chalk_1.default.green(latestVersion)}`));
        console.log();
        if (compareVersions(CURRENT_VERSION, latestVersion) >= 0) {
            console.log(chalk_1.default.green.bold('  ✅ You are already on the latest version!'));
            console.log();
            return;
        }
        console.log(chalk_1.default.yellow(`  ⬆️  Update available: ${CURRENT_VERSION} → ${latestVersion}`));
        console.log();
        const updateSpinner = (0, ora_1.default)(`Installing ${PACKAGE_NAME}@${latestVersion} globally...`).start();
        try {
            await (0, execa_1.default)('npm', ['install', '-g', `${PACKAGE_NAME}@latest`], { stdio: 'pipe' });
            updateSpinner.succeed(chalk_1.default.green(`Successfully updated to v${latestVersion}!`));
            console.log();
            console.log(chalk_1.default.cyan('  Run ') + chalk_1.default.white.bold('lenv --version') + chalk_1.default.cyan(' to verify.'));
            console.log();
        }
        catch (npmErr) {
            updateSpinner.fail(chalk_1.default.red('Failed to install update via npm.'));
            console.error(chalk_1.default.red(`\n  ${npmErr.message}`));
            console.log(chalk_1.default.yellow(`\n  Try manually: npm install -g ${PACKAGE_NAME}@latest`));
            console.log();
        }
    }
    catch (err) {
        spinner.fail(chalk_1.default.red('Failed to check for updates.'));
        console.error(chalk_1.default.red(`\n  ${err.message}`));
        console.log(chalk_1.default.yellow(`\n  Check your internet connection and try again.`));
        console.log();
    }
}
