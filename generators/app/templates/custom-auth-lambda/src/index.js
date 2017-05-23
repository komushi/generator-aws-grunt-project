

'use strict';

const iamUrl = process.env.iamUrl;
const iamSecretPrefix = process.env.secretPrefix;
const iamSecretKey = process.env.secretKey;
const iamSharedKey = process.env.sharedKey;


/**
 * Lambda entry point for custom authorization
 * @param event generating the lambda trigger
 * @param context of the lambda call
 * @param callback to return data
 */
exports.authorize = (event, context, callback) => {
  rosaLogger.config({ APIVersionNumber: 1 });
  rosaLogger.info(new Logger.RequestLogMessage({ Context: context, Event: event }),
    'Request log message to Blob Repo Custom Authorizer containing lambda context and event.');

  const awsAccountId = getAccountId(context);
  if (!awsAccountId) {
    callback(new Error('Could not derive account id from context.'));
    return;
  }
  apiGwCustomAuth.authorizeApiRequestForToken(awsAccountId,
    context.apiId, event.methodArn, event.authorizationToken)
      .then((authorizeApiResponse) => {
        rosaLogger.info(new Logger.RequestLogMessage(`${JSON.stringify(authorizeApiResponse)}`), '$$$$$ Authorizer Reponse');
        return callback(null, authorizeApiResponse);
      })
      .catch((err) => {
        rosaLogger.info(new Logger.RequestLogMessage(`${JSON.stringify(err)}`), '$$$$$ Authorizer ERR');
        return callback(err);
      });
};

/**
 * Get AWS Account ID
 * @param context of lambda
 * @returns {Promise}
 */
function getAccountId(context) {
    // extract account number from invoked arn
  const invokedFnArn = context.invokedFunctionArn;
  const invokedFnArnParsed = invokedFnArn ? invokedFnArn.split(':') : null;
  rosaLogger.info(new Logger.RequestLogMessage(`${invokedFnArn}`), 'function ARN');
  rosaLogger.info(new Logger.RequestLogMessage(`${invokedFnArnParsed}`), 'parsed function ARN');

    // this should only happen in testing mode
  if (!invokedFnArn || !invokedFnArnParsed || invokedFnArnParsed.length < 5) {
    return null;
  }
  return invokedFnArnParsed[4];
}

