import * as cdk from '@aws-cdk/core';
import * as cognito from '@aws-cdk/aws-cognito';
import * as s3 from '@aws-cdk/aws-s3';
import { Duration, Expiration } from '@aws-cdk/core';

export class CrtBackendStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here
    const userPool = new cognito.UserPool(this, 'myuserpool', {
      userPoolName: 'platformsuite-userpool',
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
      },
      autoVerify: {
        email: true
      },
      passwordPolicy: {
        minLength: 6,
        requireLowercase: false,
        requireUppercase: false,
        requireDigits: false,
        requireSymbols: false,
      }
    });

    userPool.addClient('app-client', {
      authFlows: {
        userPassword: true,
        userSrp: true,
      }
    });

    const bucket = new s3.Bucket(this, 'platformsuite-uploads', {
      bucketName: "platformsuite-uploads-dev",
      lifecycleRules: [
        {
          expiration: Duration.days(30),
          //S3 charges minimum of 30days even if objects are expired before
          //https://docs.aws.amazon.com/AmazonS3/latest/userguide/lifecycle-expire-general-considerations.html
        }
      ]
  });

  }
}
