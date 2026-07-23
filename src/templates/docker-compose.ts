export interface DockerComposeOptions {
  projectName: string;
  dbDriver: 'mysql' | 'postgres';
  dbName: string;
  dbUser: string;
  dbPassword: string;
  webPort: number;
  dbPort: number;
  redisPort: number;
  mailpitPort: number;
  includeRedis: boolean;
  includeMailpit: boolean;
}

export function generateDockerCompose(options: DockerComposeOptions): string {
  const {
    projectName,
    dbDriver,
    dbName,
    dbUser,
    dbPassword,
    webPort,
    dbPort,
    redisPort,
    mailpitPort,
    includeRedis,
    includeMailpit
  } = options;

  let dbService = '';
  let dbEnv = '';

  if (dbDriver === 'postgres') {
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
  } else {
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
${dbService}${redisService}${mailpitService}

networks:
  ${projectName}-network:
    driver: bridge

volumes:
  dbdata:
    driver: local
`;
}
