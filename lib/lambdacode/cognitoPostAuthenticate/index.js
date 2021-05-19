const aws = require('aws-sdk')
const ddb = new aws.DynamoDB({ apiVersion: '2012-10-08' })

exports.handler = async (event, context) => {

  let date = new Date()

  const tableName = process.env.TABLE_NAME
  const region = process.env.REGION

  console.log("table=" + tableName + " -- region=" + region)

  aws.config.update({ region: region })

  // If the required parameters are present, proceed
  if (event.request.userAttributes.sub) {
    // -- Write data to DDB
    let ddbParams = {
      Item: {
        'id': { S: event.request.userAttributes.sub },
        'username': { S: event.userName },
        'email': { S: event.request.userAttributes.email },
        'createdAt': { S: date.toISOString() },
        'updatedAt': { S: date.toISOString() },
        'recordStatus': { S: "active" },
      },
      TableName: tableName
    }

    // Call DynamoDB
    try {
      await ddb.putItem(ddbParams).promise()
    } catch (err) {
      console.log("Error", err)
    }
    console.log("Success: Everything executed correctly")
    context.succeed(event)
    return {
      statusCode: 200,
      body: JSON.stringify('User created successfully!')
    }
  } else {
    // Nothing to do, the user's email ID is unknown
    console.log("Error: Nothing was written to DDB")
  }
}