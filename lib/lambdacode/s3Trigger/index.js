const client = require('./client')
const { AddFileMutation, AddFileAsyncMutation } = require('./graphql')
const uuid4 = require('uuid').v4
const aws = require('aws-sdk');
const s3 = new aws.S3({ apiVersion: '2006-03-01' });

exports.handler = async (event) => {
    // TODO implement
    eventDetails = {
        sourceKey: decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' ')),
        sourceBucket: event.Records[0].s3.bucket.name,
        sourceRegion: event.Records[0].awsRegion,
    }
    let Metadata;
    const params = {
        Bucket: eventDetails.sourceBucket,
        Key: eventDetails.sourceKey,
    };
    try {
        Metadata = await s3.getObject(params).promise();
        console.log('METADATA:', Metadata);
    } catch (err) {
        console.log(err);
        const message = `Error getting object ${eventDetails.sourceKey} from bucket ${eventDetails.sourceBucket}. Make sure they exist and your bucket is in the same region as this function.`;
        console.log(message);
        throw new Error(message);
    }

    await client
        .mutate({
            mutation: AddFileAsyncMutation,
            variables: {
                DestinationKey: uuid4(), 
                SourceBucket: eventDetails.sourceBucket, 
                SourceKey: eventDetails.sourceKey, 
                SourceRegion: eventDetails.sourceRegion
            }
        })
        .then(async (res) => {
            console.log('final response of add file', JSON.stringify(res));
            await client
                .mutate({
                    mutation: AddFileMutation,
                    variables: {
                        collections: JSON.parse(Metadata.Metadata.collections), 
                        createdAt: Metadata.Metadata.createdat, 
                        createdBy: Metadata.Metadata.createdbyid, 
                        createdByName: Metadata.Metadata.createdbyname, 
                        fileDescription: Metadata.Metadata.description, 
                        fileId: res.data.add_File_async.result.id, 
                        links: JSON.parse(Metadata.Metadata.linkedfiles), 
                        name: Metadata.Metadata.documentname,
                        fileType: Metadata.Metadata.filetype
                    }
                })
                .then(async (res) => {
                    console.log('final response of update file', JSON.stringify(res));
                })
                .catch((error) => {
                    console.log('Error updating event', error);
                    throw new Error('Error updating event');
                });
        })
        .catch((error) => {
            console.log('Error updating event', error);
            throw new Error('Error updating event');
        });

    const response = {
        statusCode: 200,
        body: JSON.stringify('Hello from Lambda!'),
    };
    return response;
};

// exports.handler().catch((error) => {
//     console.log(error)
// })