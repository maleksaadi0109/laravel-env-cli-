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
export declare function generateDockerCompose(options: DockerComposeOptions): string;
