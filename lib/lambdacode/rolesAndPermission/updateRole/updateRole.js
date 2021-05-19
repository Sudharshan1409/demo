const aws = require('aws-sdk')
const ddb = new aws.DynamoDB.DocumentClient()

exports.updateRole = async (event) => {
  try {
    //projectId and workSpaceId 
    aws.config.update({ region: process.env.REGION })
    const { pathParameters } = event
    const roleId = pathParameters.roleId
    const body = JSON.parse(event.body)
    if (!roleId) {
      throw new Error('UserId is required!')
    }
    const paramsToUpdate = {
      TableName: process.env.TABLE_NAME,
      Key: {
        id: roleId,
      },
      UpdateExpression:
        "set roleName = :roleName, updatedAt = :updateDate",
      ExpressionAttributeValues: {
        ":roleName": body.roleName,
        ":updateDate": new Date().toISOString(),
      },
      ReturnValues: "UPDATED_NEW",
    }
    const roles = await ddb.update(paramsToUpdate).promise()

    for (let property in roles.Item) {
      roles.Item[property] = roles.Item[property].S
    }
    const resp = {
      isBase64Encoded: false,
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: roles,
        error: [],
        message: "User updated successfully!",
        status_code: 200,
        generated_at: new Date().toISOString()
      })
    }
    return resp
  } catch (err) {
    throw new Error(err)
  }
}

