import * as cdk from '@aws-cdk/core';
import * as cognito from '@aws-cdk/aws-cognito';
import * as s3 from '@aws-cdk/aws-s3';
import { Role, Effect, PolicyStatement, FederatedPrincipal } from '@aws-cdk/aws-iam';
import { Duration } from '@aws-cdk/core';

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

    const userPoolClient = new cognito.UserPoolClient(this, "UserPoolClient", {
      userPool,
      generateSecret: false, // Don't need to generate secret for web app running on browsers
    });

    const identityPool = new cognito.CfnIdentityPool(this, "platformsuite-idpool-dev", {
      allowUnauthenticatedIdentities: false, // Don't allow unathenticated users
      cognitoIdentityProviders: [
        {
          clientId: userPoolClient.userPoolClientId,
          providerName: userPool.userPoolProviderName,
        },
      ],
    });

    const unauthenticatedRole = new Role(this, 'CognitoDefaultUnauthenticatedRole', {
        assumedBy: new FederatedPrincipal('cognito-identity.amazonaws.com', {
            "StringEquals": { "cognito-identity.amazonaws.com:aud": identityPool.ref },
            "ForAnyValue:StringLike": { "cognito-identity.amazonaws.com:amr": "unauthenticated" },
        }, "sts:AssumeRoleWithWebIdentity"),
    });

    unauthenticatedRole.addToPolicy(new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
            "mobileanalytics:PutEvents",
            "cognito-sync:*",
        ],
        resources: ["*"],
    }));

    const authenticatedRole = new Role(this, 'CognitoDefaultAuthenticatedRole', {
        assumedBy: new FederatedPrincipal('cognito-identity.amazonaws.com', {
            "StringEquals": { "cognito-identity.amazonaws.com:aud": identityPool.ref },
            "ForAnyValue:StringLike": { "cognito-identity.amazonaws.com:amr": "authenticated" },
        }, "sts:AssumeRoleWithWebIdentity"),
    });
    authenticatedRole.addToPolicy(new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
            "mobileanalytics:PutEvents",
            "cognito-sync:*",
            "cognito-identity:*",
            "s3:PutObject"
        ],
        resources: ["*"],
    }));

    const defaultPolicy = new cognito.CfnIdentityPoolRoleAttachment(this, 'DefaultValid', {
        identityPoolId: identityPool.ref,
        roles: {
            'unauthenticated': unauthenticatedRole.roleArn,
            'authenticated': authenticatedRole.roleArn
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
