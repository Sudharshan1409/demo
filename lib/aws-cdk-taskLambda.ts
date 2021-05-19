import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
// import * as cognito from '@aws-cdk/aws-cognito';
// import * as iam from '@aws-cdk/aws-iam';
import * as apigateway from '@aws-cdk/aws-apigateway';
import { UserPoolInstanceProps } from './crt-backend-stack';
import * as path from 'path';

export class AwsCdkTaskLambda extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: UserPoolInstanceProps) {
    super(scope, id, props);
    const listTaskLambda = new lambda.Function(this, 'listTaskLambda', {
      description: 'Cognito Post Authentication Function',
      functionName: 'listTaskLambda',
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(
        path.join(__dirname, './lambdaCode/tasks/listTaskLambda')
      ),
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      // role: lambdaARole,
    });

    const api = new apigateway.LambdaRestApi(this, 'tasks', {
      handler: listTaskLambda,
      deploy: true,
      deployOptions: {
        stageName: 'prod',
      },
      proxy: false,
    });

    const listTaskLambdaIntegration = new apigateway.LambdaIntegration(listTaskLambda);

    const auth = new apigateway.CfnAuthorizer(this, 'APIGatewayAuthorizer', {
      name: 'cognito-authorizer',
      identitySource: 'method.request.header.Authorization',
      providerArns: [props.userPoolInstance.userPoolArn],
      restApiId: api.restApiId,
      type: 'COGNITO_USER_POOLS',
    });

    const listTasksResource = api.root.addResource('listTasks', {
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowHeaders: apigateway.Cors.DEFAULT_HEADERS
      }
    });
   
    listTasksResource.addMethod('GET', listTaskLambdaIntegration, {
      authorizationType: apigateway.AuthorizationType.COGNITO,
      authorizer: { authorizerId: auth.ref },
    });
    
  }
}
