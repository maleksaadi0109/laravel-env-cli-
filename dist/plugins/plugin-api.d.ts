import { ProfileConfig } from '../config/profiles';
export interface ServiceDefinition {
    /** Docker image to use (e.g. "redis:alpine") */
    image: string;
    /** Container name suffix (e.g. "redis") */
    containerSuffix: string;
    /** Ports to expose as [hostPort, containerPort] tuples */
    ports: Array<[number, number]>;
    /** Environment variables */
    environment?: Record<string, string>;
    /** Named volumes as [volumeName, mountPath] tuples */
    volumes?: Array<[string, string]>;
    /** Optional command override */
    command?: string;
    /** Env vars to set in Laravel .env when this service is enabled */
    envVars?: Record<string, string>;
}
export interface PluginRegistration {
    name: string;
    version: string;
    commands: Map<string, {
        description: string;
        action: Function;
    }>;
    services: Map<string, ServiceDefinition>;
    profiles: Map<string, ProfileConfig>;
}
export declare class PluginAPI {
    name: string;
    version: string;
    commands: Map<string, {
        description: string;
        action: Function;
    }>;
    services: Map<string, ServiceDefinition>;
    profiles: Map<string, ProfileConfig>;
    constructor(pluginName: string, pluginVersion: string);
    /**
     * Register a new CLI command.
     * @param name - Command name (e.g. "deploy")
     * @param description - Human-readable description
     * @param action - The async function to execute
     */
    addCommand(name: string, description: string, action: Function): void;
    /**
     * Register a new Docker service that can be included in docker-compose.yml.
     * @param name - Service identifier (e.g. "elasticsearch")
     * @param config - Docker service configuration
     */
    addService(name: string, config: ServiceDefinition): void;
    /**
     * Register a new project profile preset.
     * @param name - Profile name (e.g. "cms")
     * @param config - Full profile configuration
     */
    addProfile(name: string, config: ProfileConfig): void;
    /**
     * Get a snapshot of everything this plugin registered.
     */
    getRegistration(): PluginRegistration;
}
