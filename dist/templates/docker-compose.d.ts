export interface DockerComposeOptions {
    projectName: string;
    dbDriver: 'mysql' | 'postgres' | 'sqlite' | 'mariadb';
    dbName: string;
    dbUser: string;
    dbPassword: string;
    webPort: number;
    dbPort: number;
    redisPort: number;
    mailpitPort: number;
    includeRedis: boolean;
    includeMailpit: boolean;
    includeMeilisearch: boolean;
    meilisearchPort: number;
    includeMinIO: boolean;
    minioPort: number;
    minioConsolePort: number;
}
export declare function generateDockerCompose(options: DockerComposeOptions): string;
