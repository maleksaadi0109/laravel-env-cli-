"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNewLaravelProject = createNewLaravelProject;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const inquirer_1 = __importDefault(require("inquirer"));
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const execa_1 = __importDefault(require("execa"));
const dockerfile_1 = require("../templates/dockerfile");
const nginx_1 = require("../templates/nginx");
const docker_compose_1 = require("../templates/docker-compose");
const docker_1 = require("./docker");
const banner_1 = require("../utils/banner");
const profiles_1 = require("../config/profiles");
/**
 * Get the default DB port for a given driver.
 */
function getDefaultDbPort(driver) {
    switch (driver) {
        case 'postgres': return 5432;
        case 'mysql': return 3306;
        case 'mariadb': return 3306;
        default: return 0; // SQLite doesn't use a port
    }
}
async function createNewLaravelProject(name, options) {
    (0, banner_1.printBanner)();
    let projectName = name;
    if (!projectName) {
        console.log();
        const answers = await inquirer_1.default.prompt([
            {
                type: 'input',
                name: 'projectName',
                message: 'What is your Laravel project name?',
                default: 'my-laravel-app',
                validate: (input) => (input.trim() ? true : 'Project name cannot be empty'),
            },
        ]);
        projectName = answers.projectName;
        console.log();
    }
    const targetDir = path_1.default.resolve(process.cwd(), projectName);
    if (fs_1.default.existsSync(targetDir)) {
        console.error(chalk_1.default.red(`\n❌ Error: Directory '${projectName}' already exists at ${targetDir}\n`));
        process.exit(1);
    }
    // --- Profile handling ---
    let config;
    if (options?.profile) {
        const profileName = options.profile;
        const profile = (0, profiles_1.getProfile)(profileName);
        if (!profile) {
            console.error(chalk_1.default.red(`\n❌ Unknown profile: "${profileName}"`));
            console.log(chalk_1.default.white('\nAvailable profiles:'));
            for (const name of (0, profiles_1.getProfileNames)()) {
                console.log(chalk_1.default.yellow(`  --profile=${name}`));
            }
            console.log();
            process.exit(1);
        }
        console.log(chalk_1.default.cyan.bold(`📋 Using profile: ${chalk_1.default.white(profileName)}\n`));
        console.log(chalk_1.default.gray('  Frontend:      ') + chalk_1.default.white(profile.frontend));
        console.log(chalk_1.default.gray('  PHP:           ') + chalk_1.default.white(profile.phpVersion));
        console.log(chalk_1.default.gray('  Database:      ') + chalk_1.default.white(profile.dbDriver));
        console.log(chalk_1.default.gray('  Redis:         ') + chalk_1.default.white(profile.includeRedis ? '✅' : '❌'));
        console.log(chalk_1.default.gray('  Mailpit:       ') + chalk_1.default.white(profile.includeMailpit ? '✅' : '❌'));
        console.log(chalk_1.default.gray('  Meilisearch:   ') + chalk_1.default.white(profile.includeMeilisearch ? '✅' : '❌'));
        console.log(chalk_1.default.gray('  MinIO:         ') + chalk_1.default.white(profile.includeMinIO ? '✅' : '❌'));
        console.log(chalk_1.default.gray('  Web Port:      ') + chalk_1.default.white(String(profile.webPort)));
        console.log(chalk_1.default.gray('  DB Port:       ') + chalk_1.default.white(profile.dbDriver === 'sqlite' ? 'N/A' : String(profile.dbPort)));
        console.log();
        config = {
            frontend: profile.frontend,
            phpVersion: profile.phpVersion,
            dbDriver: profile.dbDriver,
            webPort: profile.webPort,
            dbPort: profile.dbPort,
            includeRedis: profile.includeRedis,
            includeMailpit: profile.includeMailpit,
            includeMeilisearch: profile.includeMeilisearch,
            includeMinIO: profile.includeMinIO,
            runDockerUp: true,
        };
    }
    else {
        // --- Interactive prompts ---
        console.log(chalk_1.default.cyan.bold('📋 Project Configuration Setup:\n'));
        const setupAnswers = await inquirer_1.default.prompt([
            {
                type: 'list',
                name: 'frontend',
                message: 'Select Frontend Stack / Starter Kit:',
                choices: [
                    { name: 'Blade (Standard Laravel views)', value: 'blade' },
                    { name: 'Vue (Inertia.js via Breeze)', value: 'vue' },
                    { name: 'React (Inertia.js via Breeze)', value: 'react' },
                    { name: 'Livewire (via Breeze)', value: 'livewire' },
                    { name: 'API Only', value: 'api' },
                ],
                default: 'blade',
                when: () => !options?.frontend,
            },
            {
                type: 'list',
                name: 'phpVersion',
                message: 'Select PHP Version:',
                choices: ['8.3', '8.2', '8.4', '8.1'],
                default: '8.3',
            },
            {
                type: 'list',
                name: 'dbDriver',
                message: 'Select Database Engine:',
                choices: [
                    { name: 'PostgreSQL', value: 'postgres' },
                    { name: 'MySQL', value: 'mysql' },
                    { name: 'MariaDB', value: 'mariadb' },
                    { name: 'SQLite (no container)', value: 'sqlite' },
                ],
                default: 'postgres',
            },
            {
                type: 'number',
                name: 'webPort',
                message: 'HTTP Web Port (Nginx):',
                default: 8080,
            },
            {
                type: 'number',
                name: 'dbPort',
                message: 'Database Host Port:',
                default: (answers) => getDefaultDbPort(answers.dbDriver),
                when: (answers) => answers.dbDriver !== 'sqlite',
            },
            {
                type: 'confirm',
                name: 'includeRedis',
                message: 'Include Redis container?',
                default: true,
            },
            {
                type: 'confirm',
                name: 'includeMailpit',
                message: 'Include Mailpit (Email testing) container?',
                default: true,
            },
            {
                type: 'confirm',
                name: 'includeMeilisearch',
                message: 'Include Meilisearch (Full-text search) container?',
                default: false,
            },
            {
                type: 'confirm',
                name: 'includeMinIO',
                message: 'Include MinIO (S3-compatible storage) container?',
                default: false,
            },
            {
                type: 'confirm',
                name: 'runDockerUp',
                message: 'Start Docker containers immediately after setup?',
                default: true,
            },
        ]);
        config = {
            frontend: options?.frontend || setupAnswers.frontend || 'blade',
            phpVersion: setupAnswers.phpVersion,
            dbDriver: setupAnswers.dbDriver,
            webPort: setupAnswers.webPort,
            dbPort: setupAnswers.dbPort || 0,
            includeRedis: setupAnswers.includeRedis,
            includeMailpit: setupAnswers.includeMailpit,
            includeMeilisearch: setupAnswers.includeMeilisearch,
            includeMinIO: setupAnswers.includeMinIO,
            runDockerUp: setupAnswers.runDockerUp,
        };
    }
    console.log('\n' + chalk_1.default.gray('───────────────────────────────────────────────────────────') + '\n');
    const spinner = (0, ora_1.default)('Creating fresh Laravel project via Composer...').start();
    try {
        // 1. Run composer create-project
        await (0, execa_1.default)('composer', ['create-project', 'laravel/laravel', projectName, '--prefer-dist']);
        spinner.succeed(chalk_1.default.green('Laravel project created successfully!\n'));
    }
    catch (err) {
        spinner.fail(chalk_1.default.red('Failed to create Laravel project via Composer.\n'));
        console.error(err.message);
        process.exit(1);
    }
    // 1b. Install Frontend Scaffolding if selected
    if (config.frontend !== 'blade') {
        const breezeSpinner = (0, ora_1.default)(`Installing ${config.frontend} frontend scaffolding via Laravel Breeze...`).start();
        try {
            await (0, execa_1.default)('composer', ['require', 'laravel/breeze', '--dev'], { cwd: targetDir });
            await (0, execa_1.default)('php', ['artisan', 'breeze:install', config.frontend, '--no-interaction'], { cwd: targetDir });
            breezeSpinner.succeed(chalk_1.default.green(`Frontend scaffolding (${config.frontend}) installed successfully!`));
        }
        catch (err) {
            breezeSpinner.fail(chalk_1.default.red(`Failed to install ${config.frontend} frontend scaffolding.`));
            console.error(err.message);
        }
    }
    const envSpinner = (0, ora_1.default)('Setting up Docker environment files...').start();
    try {
        // 2. Create docker/ subfolders
        const dockerDir = path_1.default.join(targetDir, 'docker');
        const nginxDir = path_1.default.join(dockerDir, 'nginx');
        fs_1.default.mkdirSync(nginxDir, { recursive: true });
        // 3. Write Dockerfile & Nginx conf
        fs_1.default.writeFileSync(path_1.default.join(dockerDir, 'Dockerfile'), (0, dockerfile_1.generateDockerfile)({ phpVersion: config.phpVersion, dbDriver: config.dbDriver }));
        fs_1.default.writeFileSync(path_1.default.join(nginxDir, 'default.conf'), (0, nginx_1.generateNginxConf)());
        // 4. Write docker-compose.yml
        const dockerComposeContent = (0, docker_compose_1.generateDockerCompose)({
            projectName: projectName,
            dbDriver: config.dbDriver,
            dbName: 'laravel',
            dbUser: 'laravel',
            dbPassword: 'secretpassword',
            webPort: config.webPort,
            dbPort: config.dbPort,
            redisPort: 6379,
            mailpitPort: 8025,
            includeRedis: config.includeRedis,
            includeMailpit: config.includeMailpit,
            includeMeilisearch: config.includeMeilisearch,
            meilisearchPort: 7700,
            includeMinIO: config.includeMinIO,
            minioPort: 9000,
            minioConsolePort: 9001,
        });
        fs_1.default.writeFileSync(path_1.default.join(targetDir, 'docker-compose.yml'), dockerComposeContent);
        // 5. Create SQLite database file if needed
        if (config.dbDriver === 'sqlite') {
            const dbDir = path_1.default.join(targetDir, 'database');
            if (!fs_1.default.existsSync(dbDir)) {
                fs_1.default.mkdirSync(dbDir, { recursive: true });
            }
            const sqlitePath = path_1.default.join(dbDir, 'database.sqlite');
            if (!fs_1.default.existsSync(sqlitePath)) {
                fs_1.default.writeFileSync(sqlitePath, '');
            }
        }
        // 6. Update .env file in Laravel project to connect seamlessly to Docker services
        const envPath = path_1.default.join(targetDir, '.env');
        if (fs_1.default.existsSync(envPath)) {
            let envContent = fs_1.default.readFileSync(envPath, 'utf8');
            // --- Database config ---
            if (config.dbDriver === 'postgres') {
                envContent = envContent
                    .replace(/DB_CONNECTION=.*/g, 'DB_CONNECTION=pgsql')
                    .replace(/DB_HOST=.*/g, 'DB_HOST=db')
                    .replace(/DB_PORT=.*/g, 'DB_PORT=5432')
                    .replace(/DB_DATABASE=.*/g, 'DB_DATABASE=laravel')
                    .replace(/DB_USERNAME=.*/g, 'DB_USERNAME=laravel')
                    .replace(/DB_PASSWORD=.*/g, 'DB_PASSWORD=secretpassword');
            }
            else if (config.dbDriver === 'mysql' || config.dbDriver === 'mariadb') {
                envContent = envContent
                    .replace(/DB_CONNECTION=.*/g, 'DB_CONNECTION=mysql')
                    .replace(/DB_HOST=.*/g, 'DB_HOST=db')
                    .replace(/DB_PORT=.*/g, 'DB_PORT=3306')
                    .replace(/DB_DATABASE=.*/g, 'DB_DATABASE=laravel')
                    .replace(/DB_USERNAME=.*/g, 'DB_USERNAME=laravel')
                    .replace(/DB_PASSWORD=.*/g, 'DB_PASSWORD=secretpassword');
            }
            else if (config.dbDriver === 'sqlite') {
                envContent = envContent
                    .replace(/DB_CONNECTION=.*/g, 'DB_CONNECTION=sqlite')
                    .replace(/DB_HOST=.*/g, '# DB_HOST=127.0.0.1')
                    .replace(/DB_PORT=.*/g, '# DB_PORT=3306')
                    .replace(/DB_DATABASE=.*/g, 'DB_DATABASE=/var/www/html/database/database.sqlite')
                    .replace(/DB_USERNAME=.*/g, '# DB_USERNAME=root')
                    .replace(/DB_PASSWORD=.*/g, '# DB_PASSWORD=');
            }
            // --- Redis ---
            if (config.includeRedis) {
                envContent = envContent
                    .replace(/REDIS_HOST=.*/g, 'REDIS_HOST=redis')
                    .replace(/REDIS_PORT=.*/g, 'REDIS_PORT=6379');
            }
            // --- Mailpit ---
            if (config.includeMailpit) {
                envContent = envContent
                    .replace(/MAIL_HOST=.*/g, 'MAIL_HOST=mailpit')
                    .replace(/MAIL_PORT=.*/g, 'MAIL_PORT=1025')
                    .replace(/MAIL_MAILER=.*/g, 'MAIL_MAILER=smtp');
            }
            // --- Meilisearch ---
            if (config.includeMeilisearch) {
                // Append Meilisearch config if not already present
                if (!envContent.includes('SCOUT_DRIVER')) {
                    envContent += '\n# Meilisearch\nSCOUT_DRIVER=meilisearch\nMEILISEARCH_HOST=http://meilisearch:7700\nMEILISEARCH_KEY=\n';
                }
                else {
                    envContent = envContent
                        .replace(/SCOUT_DRIVER=.*/g, 'SCOUT_DRIVER=meilisearch');
                }
            }
            // --- MinIO ---
            if (config.includeMinIO) {
                // Append MinIO / S3 config if not already present
                if (!envContent.includes('AWS_ENDPOINT')) {
                    envContent += '\n# MinIO (S3-compatible)\nFILESYSTEM_DISK=s3\nAWS_ACCESS_KEY_ID=lenv\nAWS_SECRET_ACCESS_KEY=password\nAWS_DEFAULT_REGION=us-east-1\nAWS_BUCKET=local\nAWS_ENDPOINT=http://minio:9000\nAWS_USE_PATH_STYLE_ENDPOINT=true\n';
                }
            }
            fs_1.default.writeFileSync(envPath, envContent);
        }
        envSpinner.succeed(chalk_1.default.green('Docker configuration and environment variables configured!'));
    }
    catch (err) {
        envSpinner.fail(chalk_1.default.red('Failed to write Docker configuration files.'));
        console.error(err.message);
        process.exit(1);
    }
    // 7. Optionally run Docker compose up
    if (config.runDockerUp) {
        const dockerSpinner = (0, ora_1.default)('Building and starting Docker containers...').start();
        try {
            await (0, execa_1.default)('docker', ['compose', 'up', '-d', '--build'], { cwd: targetDir });
            dockerSpinner.succeed(chalk_1.default.green('Docker containers built and running!'));
        }
        catch (err) {
            dockerSpinner.fail(chalk_1.default.yellow('Docker startup encountered an issue.'));
            const errMsg = err.stderr || err.message || '';
            if (errMsg) {
                console.error(chalk_1.default.red('\nDocker error output:'));
                console.error(chalk_1.default.red(errMsg));
                if (errMsg.includes('permission denied') && errMsg.includes('docker.sock')) {
                    console.log(chalk_1.default.yellow('\n⚠️  Docker permission error detected. Prompting for sudo to auto-fix socket permissions...'));
                    const fixed = await (0, docker_1.fixDockerPermissions)();
                    if (fixed) {
                        const retrySpinner = (0, ora_1.default)('Retrying Docker container build & startup...').start();
                        try {
                            await (0, execa_1.default)('docker', ['compose', 'up', '-d', '--build'], { cwd: targetDir });
                            retrySpinner.succeed(chalk_1.default.green('Docker containers built and running!'));
                        }
                        catch (retryErr) {
                            retrySpinner.fail(chalk_1.default.red('Retry Docker startup failed.'));
                            console.error(retryErr.message);
                        }
                    }
                }
            }
            console.log(chalk_1.default.yellow('\nYou can try running "docker compose up -d" inside the project directory manually.'));
        }
    }
    // --- Summary ---
    console.log(chalk_1.default.green.bold(`\n🎉 Project ${projectName} is ready!`));
    console.log(chalk_1.default.cyan(`\n📍 Project location: ${targetDir}`));
    // Show services summary
    const services = ['app', 'nginx'];
    if (config.dbDriver !== 'sqlite')
        services.push(`db (${config.dbDriver})`);
    else
        services.push('sqlite (file-based)');
    if (config.includeRedis)
        services.push('redis');
    if (config.includeMailpit)
        services.push('mailpit');
    if (config.includeMeilisearch)
        services.push('meilisearch');
    if (config.includeMinIO)
        services.push('minio');
    console.log(chalk_1.default.white(`\n📦 Services: ${chalk_1.default.cyan(services.join(', '))}`));
    console.log(chalk_1.default.white(`\nUseful commands:`));
    console.log(chalk_1.default.yellow(`  cd ${projectName}`));
    console.log(chalk_1.default.yellow(`  lenv up              # Start Docker environment`));
    console.log(chalk_1.default.yellow(`  lenv down            # Stop Docker environment`));
    console.log(chalk_1.default.yellow(`  lenv restart         # Restart all containers`));
    console.log(chalk_1.default.yellow(`  lenv test            # Run tests inside container`));
    console.log(chalk_1.default.yellow(`  lenv artisan migrate # Run migrations inside container`));
    console.log(chalk_1.default.yellow(`  lenv shell           # Open shell inside app container\n`));
}
