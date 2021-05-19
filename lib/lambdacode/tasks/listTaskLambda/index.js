const client = require('./client')
const { listTaskQuery } = require('./graphql')
const uuid4 = require('uuid').v4

exports.handler = async (event) => {
    // TODO implement
    response = {}
    console.log('event:', event)
    try {
        await client
            .query({
                query: listTaskQuery,
                variables: {
                    assignedTo: event.queryStringParameters.assignedTo,
                    assignee: event.queryStringParameters.assignee
                }
            })
            .then(async (res) => {
                console.log('final response of add file', res.data.listTasks.Tasks);
                let todayTasks = []
                let thisMonthTasks = []
                let comingUpTasks = []
                let todayDate = new Date()
                for(task of res.data.listTasks.Tasks) {
                    if (todayDate.getDate() == new Date(task.dueDate).getDate() && todayDate.getMonth() == new Date(task.dueDate).getMonth() && todayDate.getFullYear() == new Date(task.dueDate).getFullYear()) {
                        todayTasks.push(task)
                    }
                    else if(todayDate.getMonth() == new Date(task.dueDate).getMonth() && todayDate.getFullYear() == new Date(task.dueDate).getFullYear()){
                        thisMonthTasks.push(task)
                    }
                    else {
                        comingUpTasks.push(task)
                    }
                }
                thisMonthTasks.sort((a, b) => (a.dueDate > b.dueDate) ? 1 : -1)
                comingUpTasks.sort((a, b) => (a.dueDate > b.dueDate) ? 1 : -1)
                response.body = JSON.stringify({
                    Tasks: {
                        today: todayTasks,
                        thisMonth: thisMonthTasks,
                        comingUp: comingUpTasks
                    }
                })
            })
            .catch((error) => {
                console.log('Error updating event', error);
                throw new Error('Error updating event');
            });

        response.statusCode = 200
        response.headers = {
            "Access-Control-Allow-Headers" : "Content-Type,Authorization",
            "Access-Control-Allow-Origin": event.headers.origin,
            "Access-Control-Allow-Methods": "GET"
        }
        return response;
    }
    catch (error) {
        console.log(error)
        return {
            statusCode:200,
            headers: {
                "Access-Control-Allow-Headers" : "Content-Type,Authorization",
                "Access-Control-Allow-Origin": event.headers.origin,
                "Access-Control-Allow-Methods": "GET"
            },
            body: JSON.stringify("ERROR")
        }
    }
};

// exports.handler().catch((error) => {
//     console.log(error)
// })