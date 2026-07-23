"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginAPI = void 0;
const profiles_1 = require("../config/profiles");
class PluginAPI {
    name;
    version;
    commands;
    services;
    profiles;
    constructor(pluginName, pluginVersion) {
        this.name = pluginName;
        this.version = pluginVersion;
        this.commands = new Map();
        this.services = new Map();
        this.profiles = new Map();
    }
    /**
     * Register a new CLI command.
     * @param name - Command name (e.g. "deploy")
     * @param description - Human-readable description
     * @param action - The async function to execute
     */
    addCommand(name, description, action) {
        this.commands.set(name, { description, action });
    }
    /**
     * Register a new Docker service that can be included in docker-compose.yml.
     * @param name - Service identifier (e.g. "elasticsearch")
     * @param config - Docker service configuration
     */
    addService(name, config) {
        this.services.set(name, config);
    }
    /**
     * Register a new project profile preset.
     * @param name - Profile name (e.g. "cms")
     * @param config - Full profile configuration
     */
    addProfile(name, config) {
        this.profiles.set(name, config);
        // Also register it globally so it's available in the profiles list
        (0, profiles_1.registerProfile)(name, config);
    }
    /**
     * Get a snapshot of everything this plugin registered.
     */
    getRegistration() {
        return {
            name: this.name,
            version: this.version,
            commands: this.commands,
            services: this.services,
            profiles: this.profiles,
        };
    }
}
exports.PluginAPI = PluginAPI;
