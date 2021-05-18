import * as cdk from '@aws-cdk/core';
import * as cognito from '@aws-cdk/aws-cognito';
import * as s3 from '@aws-cdk/aws-s3';
import { Role, Effect, PolicyStatement, FederatedPrincipal } from '@aws-cdk/aws-iam';
import { Duration } from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as iam from '@aws-cdk/aws-iam';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as s3_notification from '@aws-cdk/aws-s3-notifications';
import * as path from 'path';

export class CrtBackendStack extends cdk.Stack {

  public readonly dynoUserTable: dynamodb.ITable;
  public readonly dynoRolesTable: dynamodb.ITable;
  public readonly userPoolInstance: cognito.IUserPool;

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //dynamodbtable
    this.dynoUserTable = new dynamodb.Table(this, 'users', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    this.dynoRolesTable = new dynamodb.Table(this, 'userRoles', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    //cognito post authenticate lambda
    const postAuthenticationFn = new lambda.Function(
      this,
      'postAuthentication',
      {
        description: 'Cognito Post Authentication Function',
        functionName: 'postAuthenticationFn',
        runtime: lambda.Runtime.NODEJS_12_X,
        handler: 'index.handler',
        code: lambda.Code.fromAsset(
          path.join(__dirname, 'lambdaCode', 'cognitoPostAuthenticate')
        ),
        timeout: cdk.Duration.seconds(30),
        memorySize: 256,
        environment: {
          TABLE_NAME: this.dynoUserTable.tableName,
          REGION: 'us-west-2',
        },
      }
    );

    this.dynoUserTable.grantReadWriteData(postAuthenticationFn);

    // The code that defines your stack goes here
    const userPool = new cognito.UserPool(this, 'myuserpool', {
      userPoolName: 'platformsuite-userpool',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
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
      },
      lambdaTriggers: {
        postAuthentication: postAuthenticationFn,
      },
    });

    this.userPoolInstance = userPool

    postAuthenticationFn.role!.attachInlinePolicy(
      new iam.Policy(this, 'userpool-policy', {
        statements: [
          new iam.PolicyStatement({
            actions: ['cognito-idp:DescribeUserPool'],
            resources: [userPool.userPoolArn],
          }),
        ],
      })
    );

    // userPool.addClient('app-client', {
    //   authFlows: {
    //     userPassword: true,
    //     userSrp: true,
    //   },
    // });

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
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      lifecycleRules: [
        {
          expiration: Duration.days(30),
          //S3 charges minimum of 30days even if objects are expired before
          //https://docs.aws.amazon.com/AmazonS3/latest/userguide/lifecycle-expire-general-considerations.html
        }
      ]
    });
    bucket.addCorsRule({
      allowedHeaders: ["*"],
        allowedOrigins: ["*"],
        allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.POST, s3.HttpMethods.PUT, s3.HttpMethods.DELETE],
    })

    const s3TriggerLambda = new lambda.Function(
      this,
      's3TriggerLambda',
      {
        description: 's3TriggerLambda',
        functionName: 's3TriggerLambda',
        runtime: lambda.Runtime.NODEJS_12_X,
        handler: 'index.handler',
        code: lambda.Code.fromAsset(
          path.join(__dirname, 'lambdaCode', 's3Trigger')
        ),
        timeout: cdk.Duration.seconds(30),
        memorySize: 256,
      }
    );

    bucket.grantReadWrite(s3TriggerLambda)

    const lambdaNotification = new s3_notification.LambdaDestination(s3TriggerLambda)

    bucket.addEventNotification(s3.EventType.OBJECT_CREATED, lambdaNotification)

  }
}

export interface UserPoolInstanceAndDynamoDbTables extends cdk.StackProps {
  readonly dynoUserTable: dynamodb.ITable;
  readonly dynoRolesTable: dynamodb.ITable;
  readonly userPoolInstance: cognito.IUserPool;
}

export interface UserPoolInstanceProps extends cdk.StackProps {
  readonly userPoolInstance: cognito.IUserPool;
}
