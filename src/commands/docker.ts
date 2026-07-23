import execa from 'execa';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

function checkDockerComposeFile() {
  const composePath = path.join(process.cwd(), 'docker-compose.yml');
  if (!fs.existsSync(composePath)) {
    console.error(chalk.red('❌ Error: No docker-compose.yml found in current working directory.'));
    console.error(chalk.yellow('Make sure you are inside a laravel-env project directory.'));
    process.exit(1);
  }
}

export async function fixDockerPermissions(): Promise<boolean> {
  console.log(chalk.cyan('🔧 Attempting to fix Docker socket permissions automatically...'));
  try {
    await execa('sudo', ['chmod', '666', '/var/run/docker.sock'], { stdio: 'inherit' });
    console.log(chalk.green('✅ Docker socket permissions updated successfully!'));
    return true;
  } catch (err: any) {
    console.error(chalk.red('❌ Could not update Docker socket permissions automatically:'), err.message);
    return false;
  }
}

export async function runDockerUp(options: any) {
  checkDockerComposeFile();
  console.log(chalk.cyan('🐳 Starting Docker environment...'));
  try {
    const args = ['compose', 'up', '-d'];
    if (options?.build) {
      args.push('--build');
    }
    await execa('docker', args, { stdio: 'inherit' });
    console.log(chalk.green('✅ Docker environment started successfully!'));
  } catch (err: any) {
    console.error(chalk.red('❌ Docker up failed:'), err.message);
    if (err.message && err.message.includes('permission denied') && err.message.includes('docker.sock')) {
      console.log(chalk.yellow('\n⚠️  Docker permission error detected. Prompting for sudo to auto-fix socket permissions...'));
      const fixed = await fixDockerPermissions();
      if (fixed) {
        console.log(chalk.cyan('🔄 Retrying Docker up...'));
        try {
          const args = ['compose', 'up', '-d'];
          if (options?.build) {
            args.push('--build');
          }
          await execa('docker', args, { stdio: 'inherit' });
          console.log(chalk.green('✅ Docker environment started successfully!'));
          return;
        } catch (retryErr: any) {
          console.error(chalk.red('❌ Retry failed:'), retryErr.message);
        }
      }
    }
  }
}

export async function runDockerDown() {
  checkDockerComposeFile();
  console.log(chalk.yellow('🛑 Stopping Docker environment...'));
  try {
    await execa('docker', ['compose', 'down'], { stdio: 'inherit' });
    console.log(chalk.green('✅ Docker environment stopped successfully!'));
  } catch (err: any) {
    console.error(chalk.red('❌ Docker down failed:'), err.message);
  }
}

export async function runDockerPs() {
  checkDockerComposeFile();
  try {
    await execa('docker', ['compose', 'ps'], { stdio: 'inherit' });
  } catch (err: any) {
    console.error(chalk.red('❌ Failed to list Docker status:'), err.message);
  }
}

export async function runDockerLogs(service?: string) {
  checkDockerComposeFile();
  const args = ['compose', 'logs', '-f'];
  if (service) {
    args.push(service);
  }
  try {
    await execa('docker', args, { stdio: 'inherit' });
  } catch (err: any) {
    console.error(chalk.red('❌ Failed to fetch Docker logs:'), err.message);
  }
}

export async function runDockerShell(service = 'app') {
  checkDockerComposeFile();
  console.log(chalk.cyan(`🐚 Opening interactive shell inside '${service}' container...`));
  try {
    await execa('docker', ['compose', 'exec', service, 'sh'], { stdio: 'inherit' });
  } catch (err: any) {
    console.error(chalk.red(`❌ Shell session ended with error or was closed:`), err.message);
  }
}

export async function runArtisanCommand(args: string[]) {
  checkDockerComposeFile();
  try {
    await execa('docker', ['compose', 'exec', 'app', 'php', 'artisan', ...args], { stdio: 'inherit' });
  } catch (err: any) {
    console.error(chalk.red('❌ Artisan command failed:'), err.message);
  }
}

export async function runComposerCommand(args: string[]) {
  checkDockerComposeFile();
  try {
    await execa('docker', ['compose', 'exec', 'app', 'composer', ...args], { stdio: 'inherit' });
  } catch (err: any) {
    console.error(chalk.red('❌ Composer command failed:'), err.message);
  }
}
