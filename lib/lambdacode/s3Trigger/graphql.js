const gql = require('graphql-tag');

const AddFileAsyncMutation = gql`
  mutation MyMutation(
    $DestinationKey: String!, 
    $SourceBucket: String!, 
    $SourceKey: String!, 
    $SourceRegion: String!
  ) 
  {
    add_File_async(
      input: {
        SourceBucket: $SourceBucket, 
        SourceKey: $SourceKey, 
        SourceRegion: $SourceRegion, 
        DestinationKey: $DestinationKey
      }
    )
    {
      result {
        id
      }
    }
  }
`;

const AddFileMutation = gql`
  mutation MyMutation(
    $collections: [String], 
    $createdAt: String, 
    $createdBy: String, 
    $createdByName: String, 
    $fileDescription: String, 
    $fileId: String, 
    $links: [String], 
    $name: String, 
    $projectId: String, 
    $registerId: String,
    $fileType: String,
  ) 
  {
    addFile_async(
      input: {
        collections: $collections, 
        createdAt: $createdAt, 
        createdBy: $createdBy, 
        createdByName: $createdByName, 
        fileDescription: $fileDescription, 
        fileId: $fileId, 
        links: $links, 
        name: $name, 
        projectId: $projectId, 
        registerId: $registerId,
        fileType: $fileType
      }
    ) 
    {
      result {
        id
      }
    }
  }

`;

module.exports = { AddFileMutation, AddFileAsyncMutation }

