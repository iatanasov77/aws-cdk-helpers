export interface WebServerProps
{
    
}

export interface ApplicationProps
{
    sourcePath: string;
    applicationRoot: string;
    files: Array<string>;
    useComposer: boolean;
    withEnv: boolean;
    userName: string;
}
