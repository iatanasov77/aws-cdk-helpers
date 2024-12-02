import { Construct } from 'constructs';
import { RemovalPolicy } from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';

import {
    IBucket,
    Bucket,
    ObjectOwnership,
    BlockPublicAccess,
} from 'aws-cdk-lib/aws-s3';

export interface BucketProps
{
    namePrefix: string;
}

export function createS3BucketForUpload( scope: Construct, props: BucketProps ): Bucket
{
    const bucketId: string = props.namePrefix + 'UploadBucket';
    
    const blockPublicAccess = new BlockPublicAccess({
        "blockPublicAcls": false,
        "ignorePublicAcls": false,
        "blockPublicPolicy": false,
        "restrictPublicBuckets": true
    });
      
    const bucket: Bucket = new Bucket( scope, bucketId, {
        autoDeleteObjects: true,
        removalPolicy: RemovalPolicy.DESTROY,
        
        objectOwnership: ObjectOwnership.OBJECT_WRITER,
        blockPublicAccess: blockPublicAccess,
    });
    
    // Allow Put Objects
    let putObjectPolicy = new iam.PolicyStatement({
        actions: ['s3:Put*', 's3:Get*', 's3:List*'],
        resources: [bucket.arnForObjects( '*' )],
        principals: [new iam.AnyPrincipal()]
    });
    bucket.addToResourcePolicy( putObjectPolicy );

    return bucket;
}
