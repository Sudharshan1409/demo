const aws = require('aws-sdk')
const ddb = new aws.DynamoDB.DocumentClient()

exports.handler = async (event) => {
  console.log('get single user lambda')
  try {
    aws.config.update({ region: process.env.REGION })
    const userId = event.pathParameters.userId
    if (!userId) {
      throw new Error('UserId is required!')
    }
    console.log('Event:', event)
    const usersParams = {
      TableName: process.env.USERS_TABLE_NAME,
      KeyConditionExpression: 'id = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
    }

    const user = await ddb.query(usersParams).promise()

    const rolesParams = {
      TableName: process.env.ROLES_TABLE_NAME,
      FilterExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
    }

    const roles = await ddb.scan(rolesParams).promise()
    console.log({ user: user.Items[0] })
    user.Items[0]['usersRoles'] = roles.Items

    const resp = {
      isBase64Encoded: false,
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: user.Items,
        error: [],
        message: 'ok',
        status_code: 200,
        generated_at: new Date().toISOString(),
      }),
    }
    return resp
  } catch (err) {
    throw new Error(err)
  }
}
