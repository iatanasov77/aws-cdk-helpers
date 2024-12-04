import {
    InitElement,
    InitFile,
    InitCommand
} from 'aws-cdk-lib/aws-ec2';

import { ApplicationProps } from './types/application';

export function initSamplePhpApplication( props: ApplicationProps ): Array<InitElement>
{
    let elements = [];
    
    for( let i = 0; i < props.files.length; i++ ) {
        elements.push(
            InitFile.fromAsset(
                `${props.applicationRoot}/${props.files[i]}`,
                `${props.sourcePath}/${props.files[i]}`,
            )
        );
    }
    
    if ( props.useComposer ) {
        elements.push(
            InitFile.fromAsset(
                `${props.applicationRoot}/composer.json`,
                `${props.sourcePath}/composer.json`,
            )
        );
        
        elements.push(
            InitCommand.shellCommand(
                `cd ${props.applicationRoot} && sudo composer install  --no-interaction`,
            )
        );
    }
    
    return elements;
}
