import * as cdk from '@aws-cdk/core';
import * as cognito from '@aws-cdk/aws-cognito';


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
  }
}
