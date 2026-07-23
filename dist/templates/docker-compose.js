"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDockerCompose = generateDockerCompose;
function generateDockerCompose(options) {
    const { projectName, dbDriver, dbName, dbUser, dbPassword, webPort, dbPort, redisPort, mailpitPort, includeRedis, includeMailpit, includeMeilisearch, meilisearchPort, includeMinIO, minioPort, minioConsolePort, } = options;
    // --- Database Service ---
    let dbService = '';
    let dbVolumeName = '';
    if (dbDriver === 'postgres') {
        dbVolumeName = 'dbdata';
        dbService = `
  db:
    image: postgres:16-alpine
    container_name: ${projectName}-db
    restart: unless-stopped
    environment:
      POSTGRES_DB: "\${DB_DATABASE:-${dbName}}"
      POSTGRES_USER: "\${DB_USERNAME:-${dbUser}}"
      POSTGRES_PASSWORD: "\${DB_PASSWORD:-${dbPassword}}"
    ports:
      - "${dbPort}:5432"
    volumes:
      - dbdata:/var/lib/postgresql/data
    networks:
      - ${projectName}-network`;
    }
    else if (dbDriver === 'mysql') {
        dbVolumeName = 'dbdata';
        dbService = `
  db:
    image: mysql:8.0
    container_name: ${projectName}-db
    restart: unless-stopped
    environment:
      MYSQL_DATABASE: "\${DB_DATABASE:-${dbName}}"
      MYSQL_USER: "\${DB_USERNAME:-${dbUser}}"
      MYSQL_PASSWORD: "\${DB_PASSWORD:-${dbPassword}}"
      MYSQL_ROOT_PASSWORD: "\${DB_PASSWORD:-${dbPassword}}"
    ports:
      - "${dbPort}:3306"
    volumes:
      - dbdata:/var/lib/mysql
    networks:
      - ${projectName}-network`;
    }
    else if (dbDriver === 'mariadb') {
        dbVolumeName = 'dbdata';
        dbService = `
  db:
    image: mariadb:11
    container_name: ${projectName}-db
    restart: unless-stopped
    environment:
      MARIADB_DATABASE: "\${DB_DATABASE:-${dbName}}"
      MARIADB_USER: "\${DB_USERNAME:-${dbUser}}"
      MARIADB_PASSWORD: "\${DB_PASSWORD:-${dbPassword}}"
      MARIADB_ROOT_PASSWORD: "\${DB_PASSWORD:-${dbPassword}}"
    ports:
      - "${dbPort}:3306"
    volumes:
      - dbdata:/var/lib/mysql
    networks:
      - ${projectName}-network`;
    }
    // SQLite: no DB service, no volume
    // --- Redis ---
    let redisService = '';
    if (includeRedis) {
        redisService = `
  redis:
    image: redis:alpine
    container_name: ${projectName}-redis
    restart: unless-stopped
    ports:
      - "${redisPort}:6379"
    networks:
      - ${projectName}-network`;
    }
    // --- Mailpit ---
    let mailpitService = '';
    if (includeMailpit) {
        mailpitService = `
  mailpit:
    image: axllent/mailpit:latest
    container_name: ${projectName}-mailpit
    restart: unless-stopped
    ports:
      - "${mailpitPort}:8025"
      - "1025:1025"
    networks:
      - ${projectName}-network`;
    }
    // --- Meilisearch ---
    let meilisearchService = '';
    if (includeMeilisearch) {
        meilisearchService = `
  meilisearch:
    image: getmeili/meilisearch:latest
    container_name: ${projectName}-meilisearch
    restart: unless-stopped
    environment:
      MEILI_NO_ANALYTICS: "true"
    ports:
      - "${meilisearchPort}:7700"
    volumes:
      - meilisearchdata:/meili_data
    networks:
      - ${projectName}-network`;
    }
    // --- MinIO ---
    let minioService = '';
    if (includeMinIO) {
        minioService = `
  minio:
    image: minio/minio:latest
    container_name: ${projectName}-minio
    restart: unless-stopped
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: lenv
      MINIO_ROOT_PASSWORD: password
    ports:
      - "${minioPort}:9000"
      - "${minioConsolePort}:9001"
    volumes:
      - miniodata:/data
    networks:
      - ${projectName}-network`;
    }
    // --- Volumes ---
    const volumeEntries = [];
    if (dbVolumeName) {
        volumeEntries.push(`  ${dbVolumeName}:\n    driver: local`);
    }
    if (includeMeilisearch) {
        volumeEntries.push(`  meilisearchdata:\n    driver: local`);
    }
    if (includeMinIO) {
        volumeEntries.push(`  miniodata:\n    driver: local`);
    }
    const volumesSection = volumeEntries.length > 0
        ? `\nvolumes:\n${volumeEntries.join('\n')}\n`
        : '';
    return `services:
  app:
    build:
      context: .
      dockerfile: docker/Dockerfile
    container_name: ${projectName}-app
    restart: unless-stopped
    working_dir: /var/www/html
    volumes:
      - ./:/var/www/html
    networks:
      - ${projectName}-network

  nginx:
    image: nginx:alpine
    container_name: ${projectName}-nginx
    restart: unless-stopped
    ports:
      - "${webPort}:80"
    volumes:
      - ./:/var/www/html
      - ./docker/nginx/default.conf:/etc/nginx/conf.d/default.conf
    depends_on:
      - app
    networks:
      - ${projectName}-network
${dbService}${redisService}${mailpitService}${meilisearchService}${minioService}

networks:
  ${projectName}-network:
    driver: bridge
${volumesSection}`;
}
