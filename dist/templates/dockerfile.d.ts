export interface DockerfileOptions {
    phpVersion: string;
}
export declare function generateDockerfile(options: DockerfileOptions): string;
