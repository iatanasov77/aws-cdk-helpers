/* ***************************************************************************************
Creating the base of aws-cdk-helpers
*************************************************************************************** */
import * as iam from './iam';
import * as db from './db';
import * as storage from './storage';
import * as machine from './machine';
import * as application from './application';
import { BaseFunction } from './lambda';

import { UserProfile, RoleProps } from './types/iam';

import {
    MachineKeyPair,
    MachineKeyPairProps,
    MachineProps,
    VpcProps,
    SgProps,
    LaunchTemplateProps,
    LoadbalancedMachineProps,
    ILoadbalancedWebServer
} from './types/machine';

import { TableProps } from './types/db';
import { BaseFunctionProps } from './types/lambda';
import { AlarmProps } from './types/message';
import { BucketProps } from './types/storage';
import { WebServerProps, ApplicationProps, ApplicationEnvProps } from './types/application';
import { AutoScalingGroupProps, ApplicationLoadBalancerProps } from './types/scaling-group';

/* ***************************************************************************************
Export aws-cdk-helpers to the world
*************************************************************************************** */
export {
    UserProfile,
    RoleProps,
    
    MachineKeyPair,
    MachineKeyPairProps,
    MachineProps,
    VpcProps,
    SgProps,
    
    BaseFunctionProps,
    TableProps,
    AlarmProps,
    BucketProps,
    WebServerProps,
    ApplicationProps,
    ApplicationEnvProps,

    iam,
    db,
    storage,
    machine,
    application,
    
    BaseFunction
};
