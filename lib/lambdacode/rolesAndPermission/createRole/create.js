const aws = require('aws-sdk')
const ddb = new aws.DynamoDB.DocumentClient()

exports.create = async (event) => {
  try {
    const tableName = process.env.TABLE_NAME
    const region = process.env.REGION
    aws.config.update({ region: region })

    let ddbParams = {
      Item: {
        id: new Date().toISOString(),
        roleName: body.roleName,
        userId: body.userId,
        projectId: body.projectId,
        workSpaceId: body.workSpaceId || "null",
        permissions: body.permissions,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        recordStatus: "1",
      },
      TableName: tableName,
    }
    // Call DynamoDB
    const result = await ddb.put(ddbParams).promise()
    const resp = {
      isBase64Encoded: false,
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: result,
        error: [],
        message: "Role created successfully",
        status_code: 200,
        generated_at: new Date().toISOString()
      })
    }
    return resp
  } catch (err) {
    throw new Error(err)
  }
}
