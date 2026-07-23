export declare function fixDockerPermissions(): Promise<boolean>;
export declare function runDockerUp(options: any): Promise<void>;
export declare function runDockerDown(): Promise<void>;
export declare function runDockerPs(): Promise<void>;
export declare function runDockerLogs(service?: string): Promise<void>;
export declare function runDockerShell(service?: string): Promise<void>;
export declare function runArtisanCommand(args: string[]): Promise<void>;
export declare function runComposerCommand(args: string[]): Promise<void>;
