const aws = require('aws-sdk')
const ddb = new aws.DynamoDB.DocumentClient()

exports.handler = async (event) => {
  try {
    const tableName = process.env.USERS_TABLE_NAME
    const region = process.env.REGION
    aws.config.update({ region: region })

    const paramsToSave = {
      TableName: tableName,
    }
    const userInstance = await ddb.scan(paramsToSave).promise()

    for (const item of userInstance.Items) {
      const rolesParams = {
        TableName: process.env.ROLES_TABLE_NAME,
        FilterExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': item.id,
        },
      }

      const roles = await ddb.scan(rolesParams).promise()
      item.userRoles = roles.Items
    }
    const resp = {
      isBase64Encoded: false,
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: userInstance.Items,
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
