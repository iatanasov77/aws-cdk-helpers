/* ***************************************************************************************
Creating the base of aws-cdk-helpers
*************************************************************************************** */
import * as iam from './iam';
import * as db from './db';
import * as storage from './storage';
import * as machine from './machine';
import * as lamp from './lamp';
import * as application from './application';
import * as scaling from './scaling-group';
import { BaseFunction } from './lambda';

import { UserProfile, RoleProps } from './types/iam';

import {
    MachineKeyPair,
    MachineKeyPairProps,
    StandaloneMachineProps,
    VpcProps,
    SgProps,
    LaunchTemplateProps,
    LoadbalancedMachineProps,
    ILoadbalancedWebServer,
    LaunchTemplateRole
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
    StandaloneMachineProps,
    VpcProps,
    SgProps,
    
    BaseFunctionProps,
    TableProps,
    AlarmProps,
    BucketProps,
    WebServerProps,
    ApplicationProps,
    ApplicationEnvProps,
    
    LaunchTemplateProps,
    LoadbalancedMachineProps,
    ILoadbalancedWebServer,
    LaunchTemplateRole,
    
    AutoScalingGroupProps,
    ApplicationLoadBalancerProps,

    iam,
    db,
    storage,
    machine,
    lamp,
    application,
    scaling,
    
    BaseFunction
};
