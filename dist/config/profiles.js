"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.profiles = void 0;
exports.getProfileNames = getProfileNames;
exports.getProfile = getProfile;
exports.registerProfile = registerProfile;
exports.profiles = {
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
function getProfileNames() {
    return Object.keys(exports.profiles);
}
function getProfile(name) {
    return exports.profiles[name];
}
function registerProfile(name, config) {
    exports.profiles[name] = config;
}
