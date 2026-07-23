export interface ProfileConfig {
  frontend: string;
  phpVersion: string;
  dbDriver: 'mysql' | 'postgres' | 'sqlite' | 'mariadb';
  includeRedis: boolean;
  includeMailpit: boolean;
  includeMeilisearch: boolean;
  includeMinIO: boolean;
  webPort: number;
  dbPort: number;
}

export const profiles: Record<string, ProfileConfig> = {
  api: {
    frontend: 'api',
    phpVersion: '8.3',
    dbDriver: 'postgres',
    includeRedis: true,
    includeMailpit: false,
    includeMeilisearch: false,
    includeMinIO: false,
    webPort: 8080,
    dbPort: 5432,
  },

  ecommerce: {
    frontend: 'livewire',
    phpVersion: '8.3',
    dbDriver: 'mysql',
    includeRedis: true,
    includeMailpit: true,
    includeMeilisearch: true,
    includeMinIO: true,
    webPort: 8080,
    dbPort: 3306,
  },

  saas: {
    frontend: 'vue',
    phpVersion: '8.3',
    dbDriver: 'postgres',
    includeRedis: true,
    includeMailpit: true,
    includeMeilisearch: false,
    includeMinIO: false,
    webPort: 8080,
    dbPort: 5432,
  },
};

export function getProfileNames(): string[] {
  return Object.keys(profiles);
}

export function getProfile(name: string): ProfileConfig | undefined {
  return profiles[name];
}

export function registerProfile(name: string, config: ProfileConfig): void {
  profiles[name] = config;
}
