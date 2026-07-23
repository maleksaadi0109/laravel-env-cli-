import chalk from 'chalk';
import ora from 'ora';
import execa from 'execa';
import https from 'https';

const PACKAGE_NAME = 'laravel-env-cli';
const CURRENT_VERSION = require('../../package.json').version;

/**
 * Fetch the latest version from the npm registry.
 */
function fetchLatestVersion(): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = `https://registry.npmjs.org/${PACKAGE_NAME}/latest`;
    https.get(url, { headers: { 'Accept': 'application/json' } }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.version || CURRENT_VERSION);
        } catch {
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
function compareVersions(a: string, b: string): number {
  const partsA = a.split('.').map(Number);
  const partsB = b.split('.').map(Number);

  for (let i = 0; i < 3; i++) {
    const numA = partsA[i] || 0;
    const numB = partsB[i] || 0;
    if (numA < numB) return -1;
    if (numA > numB) return 1;
  }
  return 0;
}

export async function selfUpdate() {
  console.log();
  console.log(chalk.cyan.bold('🔄 lenv self-update'));
  console.log(chalk.gray('─'.repeat(50)));
  console.log();

  console.log(chalk.white(`  Current version: ${chalk.yellow(CURRENT_VERSION)}`));

  const spinner = ora('Checking for updates on npm...').start();

  try {
    const latestVersion = await fetchLatestVersion();
    spinner.stop();

    console.log(chalk.white(`  Latest version:  ${chalk.green(latestVersion)}`));
    console.log();

    if (compareVersions(CURRENT_VERSION, latestVersion) >= 0) {
      console.log(chalk.green.bold('  ✅ You are already on the latest version!'));
      console.log();
      return;
    }

    console.log(chalk.yellow(`  ⬆️  Update available: ${CURRENT_VERSION} → ${latestVersion}`));
    console.log();

    const updateSpinner = ora(`Installing ${PACKAGE_NAME}@${latestVersion} globally...`).start();

    try {
      await execa('npm', ['install', '-g', `${PACKAGE_NAME}@latest`], { stdio: 'pipe' });
      updateSpinner.succeed(chalk.green(`Successfully updated to v${latestVersion}!`));
      console.log();
      console.log(chalk.cyan('  Run ') + chalk.white.bold('lenv --version') + chalk.cyan(' to verify.'));
      console.log();
    } catch (npmErr: any) {
      updateSpinner.fail(chalk.red('Failed to install update via npm.'));
      console.error(chalk.red(`\n  ${npmErr.message}`));
      console.log(chalk.yellow(`\n  Try manually: npm install -g ${PACKAGE_NAME}@latest`));
      console.log();
    }
  } catch (err: any) {
    spinner.fail(chalk.red('Failed to check for updates.'));
    console.error(chalk.red(`\n  ${err.message}`));
    console.log(chalk.yellow(`\n  Check your internet connection and try again.`));
    console.log();
  }
}
