# lenv (Laravel Environment CLI)

A CLI tool for creating Laravel projects with pre-configured Docker containers.

```
  _       _____ _   ___     __
 | |     | ____| \ | \ \   / /
 | |     |  _| |  \| |\ \ / / 
 | |___  | |___| |\  | \ V /  
 |_____| |_____|_| \_|  \_/   
```

`lenv` handles running `composer create-project`, setting up Docker Compose (PHP-FPM, Nginx, PostgreSQL/MySQL/MariaDB/SQLite, Redis, Mailpit, Meilisearch, MinIO), installing starter kits (Vue, React, Livewire, API), and proxying Artisan and Composer commands directly into your containers.

---

## Quick Start

```bash
# Install dependencies and build
npm install
npm run build

# Link globally so 'lenv' works anywhere
npm link
```

Create a new project:

```bash
lenv new my-app
```

Or pass the frontend directly:

```bash
lenv new my-app --frontend vue
```

Or use a predefined profile:

```bash
lenv new my-app --profile=api
lenv new shop --profile=ecommerce
lenv new saas-app --profile=saas
```

---

## What it sets up

During `lenv new`, you get options for:

- **Frontend Stack**: Standard Blade, Vue (Inertia), React (Inertia), Livewire, or API only
- **PHP Version**: 8.4, 8.3, 8.2, 8.1
- **Database**: PostgreSQL 16, MySQL 8.0, MariaDB 11, or SQLite (file-based, no container)
- **Ports**: HTTP Nginx port and Database port
- **Services**: Optional Redis, Mailpit, Meilisearch, and MinIO

It generates the following folder layout in your project:

```
my-app/
├── docker/
│   ├── Dockerfile
│   └── nginx/default.conf
├── docker-compose.yml
├── .env
└── ... (Laravel app files)
```

---

## Profiles

Profiles are predefined configuration presets that skip all interactive prompts:

| Profile      | Frontend    | Database   | Redis | Mailpit | Meilisearch | MinIO |
|-------------|-------------|------------|-------|---------|-------------|-------|
| `api`       | API Only    | PostgreSQL | ✅    | ❌      | ❌          | ❌    |
| `ecommerce` | Livewire    | MySQL      | ✅    | ✅      | ✅          | ✅    |
| `saas`      | Vue (Inertia) | PostgreSQL | ✅  | ✅      | ❌          | ❌    |

```bash
lenv new my-api --profile=api
lenv new shop --profile=ecommerce
lenv new saas --profile=saas
```

---

## Why lenv instead of Laravel Sail?
While Laravel Sail provides an excellent starting point, lenv is built for developers who want a cleaner, more production-like infrastructure from day one:

Production-like Web Server: lenv sets up Nginx out of the box instead of relying on PHP's built-in development server, ensuring your local environment closely mirrors your deployment architecture.

Interactive Scaffolding: Rather than publishing and modifying docker-compose files manually after installation, lenv interactively asks for your exact stack, DB preferences, and UI framework during project creation.

Seamless Command Proxying: It eliminates the need for alias configuration. You run lenv artisan migrate and it intuitively executes inside the proper container.

---

## Command Reference

| Command | Action |
| --- | --- |
| `lenv new [name]` | Create a new Laravel project and generate Docker setup |
| `lenv new [name] --profile=<name>` | Create project using a preset profile |
| `lenv up` | Start Docker containers (`--build` to rebuild) |
| `lenv down` | Stop Docker containers |
| `lenv restart [service]` | Restart all or a specific container |
| `lenv ps` | Show container status |
| `lenv logs [service]` | View logs (e.g. `lenv logs app`) |
| `lenv shell [service]` | Open terminal inside container (`app` by default) |
| `lenv test` | Run `php artisan test` inside container |
| `lenv artisan <cmd>` | Run artisan inside container (e.g. `lenv artisan migrate`) |
| `lenv composer <cmd>` | Run composer inside container (e.g. `lenv composer require ...`) |
| `lenv fix-perms` | Fix `/var/run/docker.sock` permissions |
| `lenv self-update` | Update lenv to the latest version from npm |

---

## Plugin System

lenv supports a plugin system that allows anyone to extend the CLI with custom commands, Docker services, or project profiles — without modifying the core codebase.

### Plugin Directory

Plugins are installed to `~/.lenv/plugins/`.

### Managing Plugins

```bash
# Install from a git repository
lenv plugin install https://github.com/user/lenv-plugin-example.git

# Install from a local directory
lenv plugin install ./my-plugin

# List installed plugins
lenv plugin list

# Remove a plugin
lenv plugin remove my-plugin
```

### Creating a Plugin

A plugin is a directory with a `package.json` and a main entry point:

```
my-plugin/
├── package.json
└── index.js
```

**package.json** must include `"lenv-plugin": true`:

```json
{
  "name": "lenv-plugin-example",
  "version": "1.0.0",
  "lenv-plugin": true,
  "main": "index.js"
}
```

**index.js** must export a `register` function:

```javascript
module.exports.register = function(api) {
  // Add a custom command
  api.addCommand('deploy', 'Deploy the project to production', async () => {
    console.log('Deploying...');
  });

  // Add a custom Docker service
  api.addService('elasticsearch', {
    image: 'elasticsearch:8.12.0',
    containerSuffix: 'elasticsearch',
    ports: [[9200, 9200]],
    environment: { 'discovery.type': 'single-node' },
    volumes: [['esdata', '/usr/share/elasticsearch/data']],
  });

  // Add a custom profile
  api.addProfile('cms', {
    frontend: 'livewire',
    phpVersion: '8.3',
    dbDriver: 'mysql',
    includeRedis: true,
    includeMailpit: true,
    includeMeilisearch: true,
    includeMinIO: false,
    webPort: 8080,
    dbPort: 3306,
  });
};
```

---

## Docker Permission Issues

If you see `permission denied while trying to connect to the docker API at unix:///var/run/docker.sock`:

1. Run `lenv fix-perms` (or `./setup-docker.sh`) to update socket permissions.
2. Or add your user to the docker group permanently:
   ```bash
   sudo usermod -aG docker $USER
   newgrp docker
   ```

---

## License

MIT
