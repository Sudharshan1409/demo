const aws = require('aws-sdk')
const ddb = new aws.DynamoDB({ apiVersion: '2012-10-08' })

exports.handler = async (event) => {
  console.log('update role lambda')
  event.body = JSON.parse(event.body)
  try {
    aws.config.update({ region: process.env.REGION })
    const userId = event.pathParameters.userId
    if (!userId) {
      throw new Error('UserId is required!')
    }
    console.log('Event:', event)
    const params = {
      TableName: process.env.USERS_TABLE_NAME,
      Item: {
        'id': { S: event.body.id },
        'username': { S: event.body.username },
        'email': { S: event.body.email },
        'createdAt': { S: event.body.createdAt },
        'updatedAt': { S: date.toISOString() },
      }
    }
    const user = await ddb.putItem(params).promise()

    const resp = {
      isBase64Encoded: false,
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: user,
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

