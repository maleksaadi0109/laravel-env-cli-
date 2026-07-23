# lenv (Laravel Environment CLI)

A CLI tool for creating Laravel projects with pre-configured Docker containers.

```
  _       _____ _   ___     __
 | |     | ____| \ | \ \   / /
 | |     |  _| |  \| |\ \ / / 
 | |___  | |___| |\  | \ V /  
 |_____| |_____|_| \_|  \_/   
```

`lenv` handles running `composer create-project`, setting up Docker Compose (PHP-FPM, Nginx, PostgreSQL or MySQL, Redis, Mailpit), installing starter kits (Vue, React, Livewire, API), and proxying Artisan and Composer commands directly into your containers.

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

---

## What it sets up

During `lenv new`, you get options for:

- **Frontend Stack**: Standard Blade, Vue (Inertia), React (Inertia), Livewire, or API only
- **PHP Version**: 8.3, 8.2, 8.4, 8.1
- **Database**: PostgreSQL 16 or MySQL 8.0
- **Ports**: HTTP Nginx port and Database port
- **Services**: Optional Redis and Mailpit

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

## Command Reference

| Command | Action |
| --- | --- |
| `lenv new [name]` | Create a new Laravel project and generate Docker setup |
| `lenv up` | Start Docker containers (`--build` to rebuild) |
| `lenv down` | Stop Docker containers |
| `lenv ps` | Show container status |
| `lenv logs [service]` | View logs (e.g. `lenv logs app`) |
| `lenv shell [service]` | Open terminal inside container (`app` by default) |
| `lenv artisan <cmd>` | Run artisan inside container (e.g. `lenv artisan migrate`) |
| `lenv composer <cmd>` | Run composer inside container (e.g. `lenv composer require ...`) |
| `lenv fix-perms` | Fix `/var/run/docker.sock` permissions |

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
