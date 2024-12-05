/* ***************************************************************************************
Creating the base of milsymbol
*************************************************************************************** */
import * as iam from './iam';
import * as db from './db';
import * as storage from './storage';
import * as machine from './machine';
import * as application from './application';
import { BaseFunction } from './lambda';

import { UserProfile } from './types/iam';

import {
    MachineKeyPair,
    MachineKeyPairProps,
    MachineProps,
    VpcProps,
    SgProps
} from './types/machine';

import { TableProps } from './types/db';
import { BaseFunctionProps } from './types/lambda';
import { AlarmProps } from './types/message';
import { BucketProps } from './types/storage';
import { WebServerProps, ApplicationProps } from './types/application';

/* ***************************************************************************************
Export ms to the world
*************************************************************************************** */
export {
    UserProfile,
    
    MachineKeyPair,
    MachineKeyPairProps,
    MachineProps,
    VpcProps,
    SgProps,
    
    BaseFunctionProps,
    TableProps,
    AlarmProps,
    BucketProps,
    ApplicationProps,

    iam,
    db,
    storage,
    machine,
    application,
    
    BaseFunction
};
