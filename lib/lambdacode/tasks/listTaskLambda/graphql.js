const gql = require('graphql-tag');

const listTaskQuery = gql`
  query listTaskQuery($assignedTo: String, $assignee: String) {
    listTasks(filter: {assignedTo: {eq: $assignedTo}, assignee: {eq: $assignee}}) {
      Tasks {
        id
        assignedTo
        assignedToDetails {
          name
          profilePicture
        }
        assignee
        assigneeDetails {
          name
          profilePicture
        }
        createdAt
        description
        discussion {
          isHighlighted
          message
          sentAt
          sentBy
        }
        dueDate
        links
        priority
        projectId
        recordStatus
        status
        title
        updatedAt
        updatedBy
      }
    }
  }

`;

module.exports = { listTaskQuery }

