const aws = require('aws-sdk')
const ddb = new aws.DynamoDB.DocumentClient()

exports.role = async (event) => {
  try {
    //projectId and workSpaceId 
    aws.config.update({ region: process.env.REGION })
    const { pathParameters } = event
    const userId = pathParameters.userId
    if (!userId) {
      throw new Error('UserId is required!')
    }
    const params = {
      TableName: process.env.TABLE_NAME,
      FilterExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      }
    }
    const roles = await ddb.scan(params).promise()

    for (let property in roles.Item) {
      roles.Item[property] = roles.Item[property].S
    }
    const resp = {
      isBase64Encoded: false,
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: roles.Items,
        error: [],
        message: "ok",
        status_code: 200,
        generated_at: new Date().toISOString()
      })
    }
    return resp
  } catch (err) {
    throw new Error(err)
  }
}

