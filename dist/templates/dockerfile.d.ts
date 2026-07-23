export interface DockerfileOptions {
    phpVersion: string;
    dbDriver: 'mysql' | 'postgres' | 'sqlite' | 'mariadb';
}
export declare function generateDockerfile(options: DockerfileOptions): string;
