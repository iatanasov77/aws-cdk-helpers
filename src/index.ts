/* ***************************************************************************************
Creating the base of milsymbol
*************************************************************************************** */
import * as db from './db';
import * as storage from './storage';
import * as machine from './machine';
import { BaseFunction } from './lambda';

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

/* ***************************************************************************************
Export ms to the world
*************************************************************************************** */
export {
    MachineKeyPair,
    MachineKeyPairProps,
    MachineProps,
    VpcProps,
    SgProps,
    
    BaseFunctionProps,
    TableProps,
    AlarmProps,
    BucketProps,

    db,
    storage,
    machine,
    BaseFunction
};
