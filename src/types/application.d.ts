export interface WebServerProps
{
    webServerPackage?: string;
    phpVersion?: string;
    databasePackage?: string; // mariadb105-server
    databasePassword?: string;
    phpMyAdmin?: string; // PhpMyAdmin Version
}

export interface ApplicationProps
{
    sourcePath: string;
    applicationRoot: string;
    files: Array<string>;
    useComposer: boolean;
    withEnv: boolean;
    userName?: string;
    envVars?: Map<string, string>;
}

export interface ApplicationEnvProps
{
    userName?: string;
    envVars?: Map<string, string>;
}
