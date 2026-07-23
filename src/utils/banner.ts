import chalk from 'chalk';

export function printBanner() {
  console.log();
  console.log(chalk.red.bold(`  _       _____ _   ___     __`));
  console.log(chalk.red.bold(` | |     | ____| \\ | \\ \\   / /`));
  console.log(chalk.red.bold(` | |     |  _| |  \\| |\\ \\ / / `));
  console.log(chalk.red.bold(` | |___  | |___| |\\  | \\ V /  `));
  console.log(chalk.red.bold(` |_____| |_____|_| \\_|  \\_/   `));
  console.log(chalk.cyan(` 🚀 Laravel & Docker Environment CLI v1.0.0`));
  console.log(chalk.gray(` ───────────────────────────────────────────────────────────`));
  console.log();
}

export function printSectionHeader(title: string) {
  console.log(`\n${chalk.cyan.bold('❯ ' + title)}\n`);
}
