import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
// import * as cognito from '@aws-cdk/aws-cognito';
// import * as iam from '@aws-cdk/aws-iam';
import { UserPoolInstanceAndDynamoDbTables } from './crt-backend-stack';
import * as apigateway from '@aws-cdk/aws-apigateway';
import * as path from 'path';

export class AwsCdkApiGateway extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: UserPoolInstanceAndDynamoDbTables) {
    super(scope, id, props);

    //users module
    const getAllUsers = new lambda.Function(this, 'getAllUsers', {
      description: 'get all users',
      functionName: 'getAllUsers',
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(
        path.join(__dirname, './lambdaCode/users/getListOfUsers')
      ),
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: {
        USERS_TABLE_NAME: props.dynoUserTable.tableName,
        ROLES_TABLE_NAME:props.dynoRolesTable.tableName,
        REGION: 'us-west-2',

      },
      // role: lambdaARole,
    });

    const getSingleUser = new lambda.Function(this, 'getSingleUser', {
      description: 'get single user',
      functionName: 'getSingleUser',
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(
        path.join(__dirname, './lambdaCode/users/getSingleUser')
      ),
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: {
        USERS_TABLE_NAME: props.dynoUserTable.tableName,
        ROLES_TABLE_NAME:props.dynoRolesTable.tableName,
        REGION: 'us-west-2',
      },
    });

    const updateUser = new lambda.Function(this, 'updateUser', {
      description: 'update user',
      functionName: 'updateUser',
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(
        path.join(__dirname, './lambdaCode/users/updateUser')
      ),
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: {
        USERS_TABLE_NAME: props.dynoUserTable.tableName,
        ROLES_TABLE_NAME:props.dynoRolesTable.tableName,
        REGION: 'us-west-2',
      },
    });

    props.dynoUserTable.grantFullAccess(updateUser);
    props.dynoUserTable.grantFullAccess(getAllUsers);
    props.dynoRolesTable.grantFullAccess(getAllUsers);
    props.dynoUserTable.grantFullAccess(getSingleUser);
    props.dynoRolesTable.grantFullAccess(getSingleUser);

    const usersApi = new apigateway.LambdaRestApi(this, 'users', {
      handler: getAllUsers,
      deploy: true,
      deployOptions: {
        stageName: 'prod',
      },
      proxy: false,
    });

    const getAllUsersIntegration = new apigateway.LambdaIntegration(getAllUsers);
    const updateUserIntegration = new apigateway.LambdaIntegration(updateUser);
    const singleUserIntegration = new apigateway.LambdaIntegration(getSingleUser);

    const auth = new apigateway.CfnAuthorizer(this, 'UsersAPIGatewayAuthorizer', {
      name: 'cognito-authorizer',
      identitySource: 'method.request.header.Authorization',
      providerArns: [props.userPoolInstance.userPoolArn],
      restApiId: usersApi.restApiId,
      type: 'COGNITO_USER_POOLS',
    });

    const users = usersApi.root.addResource('users');
   
    users.addMethod('GET', getAllUsersIntegration, {
      authorizationType: apigateway.AuthorizationType.COGNITO,
      authorizer: { authorizerId: auth.ref },
    });
    const subUserRoute = users.addResource('{userId}');

    subUserRoute.addMethod('GET', singleUserIntegration, {
      authorizationType: apigateway.AuthorizationType.COGNITO,
      authorizer: { authorizerId: auth.ref },
    });
    subUserRoute.addMethod('PATCH', updateUserIntegration, {
      authorizationType: apigateway.AuthorizationType.COGNITO,
      authorizer: { authorizerId: auth.ref },
    });


    //roles and permission module
    const createRole = new lambda.Function(this, 'createRole', {
      description: 'create roles',
      functionName: 'createRole',
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'create.create',
      code: lambda.Code.fromAsset(
        path.join(__dirname, './lambdaCode/rolesAndPermission/createRole')
      ),
      environment: {
        TABLE_NAME: props.dynoRolesTable.tableName,
        REGION: 'us-west-2',
      },
    });

    const getAllRoles = new lambda.Function(this, 'getAllRoles', {
      description: 'get all roles',
      functionName: 'getAllRoles',
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'getRoles.roles',
      code: lambda.Code.fromAsset(
        path.join(__dirname, './lambdaCode/rolesAndPermission/getRoles')
      ),
      environment: {
        TABLE_NAME: props.dynoRolesTable.tableName,
        REGION: 'us-west-2',
      },
    });

    const getSingleRole = new lambda.Function(this, 'getSingleRole', {
      description: 'get single role',
      functionName: 'getSingleRole',
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'getRole.role',
      code: lambda.Code.fromAsset(
        path.join(__dirname, './lambdaCode/rolesAndPermission/getRole')
      ),
      environment: {
        TABLE_NAME: props.dynoRolesTable.tableName,
        REGION: 'us-west-2',
      },
    });

    const updateRole = new lambda.Function(this, 'updateRole', {
      description: 'update role',
      functionName: 'updateRole',
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'updateRole.updateRole',
      code: lambda.Code.fromAsset(
        path.join(__dirname, './lambdaCode/rolesAndPermission/updateRole')
      ),
      environment: {
        TABLE_NAME: props.dynoRolesTable.tableName,
        REGION: 'us-west-2',
      },
    });

    props.dynoRolesTable.grantFullAccess(createRole);
    props.dynoRolesTable.grantFullAccess(updateRole);
    props.dynoRolesTable.grantFullAccess(getAllRoles);
    props.dynoRolesTable.grantFullAccess(getSingleRole);

    const rolesApi = new apigateway.LambdaRestApi(this, 'roles', {
      handler: getAllRoles,
      deploy: true,
      deployOptions: {
        stageName: 'prod',
      },
      proxy: false,
    });

    const getAllRolesIntegration = new apigateway.LambdaIntegration(getAllRoles);
    const createRoleIntegration = new apigateway.LambdaIntegration(createRole);
    const updateRoleIntegration = new apigateway.LambdaIntegration(updateRole);
    const singleRoleIntegration = new apigateway.LambdaIntegration(getSingleRole);

    const Roleauth = new apigateway.CfnAuthorizer(this, 'RolesAPIGatewayAuthorizer', {
      name: 'cognito-authorizer',
      identitySource: 'method.request.header.Authorization',
      providerArns: [props.userPoolInstance.userPoolArn],
      restApiId: rolesApi.restApiId,
      type: 'COGNITO_USER_POOLS',
    });

    const roles = rolesApi.root.addResource('roles');
   
    roles.addMethod('GET', getAllRolesIntegration, {
      authorizationType: apigateway.AuthorizationType.COGNITO,
      authorizer: { authorizerId: Roleauth.ref },
    });
    roles.addMethod('POST', createRoleIntegration, {
      authorizationType: apigateway.AuthorizationType.COGNITO,
      authorizer: { authorizerId: Roleauth.ref },
    });
    
    const subRoleRoute = roles.addResource('{roleId}');

    subRoleRoute.addMethod('GET', singleRoleIntegration, {
      authorizationType: apigateway.AuthorizationType.COGNITO,
      authorizer: { authorizerId: Roleauth.ref },
    });
    subRoleRoute.addMethod('PATCH', updateRoleIntegration, {
      authorizationType: apigateway.AuthorizationType.COGNITO,
      authorizer: { authorizerId: Roleauth.ref },
    });
  }
}
