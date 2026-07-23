export interface DockerfileOptions {
  phpVersion: string;
  dbDriver: 'mysql' | 'postgres' | 'sqlite' | 'mariadb';
}

export function generateDockerfile(options: DockerfileOptions): string {
  const { phpVersion, dbDriver } = options;

  // Build system dependencies based on DB driver
  const systemDeps = [
    'git',
    'curl',
    'libpng-dev',
    'libxml2-dev',
    'zip',
    'unzip',
    'oniguruma-dev',
    'icu-dev',
    'libzip-dev',
    'linux-headers',
    'bash',
  ];

  // Add DB-specific system dependencies
  if (dbDriver === 'postgres') {
    systemDeps.push('postgresql-dev');
  }
  if (dbDriver === 'sqlite') {
    systemDeps.push('sqlite-dev');
  }
  // mysql/mariadb: no extra system deps needed for pdo_mysql

  // Build PHP extensions list
  const phpExtensions = ['pdo', 'mbstring', 'exif', 'pcntl', 'bcmath', 'gd', 'intl', 'zip', 'opcache'];

  if (dbDriver === 'mysql' || dbDriver === 'mariadb') {
    phpExtensions.push('pdo_mysql');
  } else if (dbDriver === 'postgres') {
    phpExtensions.push('pdo_pgsql');
  } else if (dbDriver === 'sqlite') {
    phpExtensions.push('pdo_sqlite');
  }

  const depsString = systemDeps.map(d => `    ${d}`).join(' \\\n');
  const extString = phpExtensions.join(' ');

  return `FROM php:${phpVersion}-fpm-alpine

# Install system dependencies
RUN apk add --no-cache \\
${depsString}

# Install PHP extensions
RUN docker-php-ext-install ${extString}

# Install Redis extension
RUN apk add --no-cache --virtual .build-deps $PHPIZE_DEPS \\
    && pecl install redis \\
    && docker-php-ext-enable redis \\
    && apk del .build-deps

# Get latest Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

EXPOSE 9000
CMD ["php-fpm"]
`;
}
