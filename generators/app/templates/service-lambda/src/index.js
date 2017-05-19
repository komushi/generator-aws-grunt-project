'use strict';

const getObject = require('./operations/get-object');
const putObject = require('./operations/put-object');
const postObject = require('./operations/post-object');


function makeGetResponse(error, result) {
  const statusCode = error && error.statusCode || 200;

  var str = result || '';

  return {
    statusCode,
    headers: {
      // "Access-Control-Allow-Origin" : "*",
      "Content-Type": "application/octet-stream"
    },
    isBase64Encoded: true,
    body: str.toString("base64")
  }
}

function makeResponse(error, result) {
  const statusCode = error && error.statusCode || 200;
  return {
    statusCode,
    headers: {
      "Access-Control-Allow-Origin" : "*",
      "Content-Type": "application/json"
    },
    body: result
  }
}

exports.handler = (event, context, callback) => {

  console.log('event', event);
  console.log('context', context);

  switch (event.httpMethod) {
    case 'POST': {
      postObject(event, (error, result) => {
        const response = makeResponse(error, result)
        console.log(response);
        context.succeed(response)
      });
      break;
    }

    case 'GET': {
      getObject(event, (error, result) => {
        const response = makeGetResponse(error, result)
        context.succeed(response)
      });
      break;
    }

    case 'PUT': {
      putObject(event, (error, result) => {
        const response = makeResponse(error, result)
        context.succeed(response)
      });
      break;
    }

    default:
      context.fail(new Error(`Unsupported method ${event.httpMethod}`));

  }
};
