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
export declare const profiles: Record<string, ProfileConfig>;
export declare function getProfileNames(): string[];
export declare function getProfile(name: string): ProfileConfig | undefined;
export declare function registerProfile(name: string, config: ProfileConfig): void;
