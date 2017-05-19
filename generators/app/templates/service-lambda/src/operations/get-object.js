const AWS = require('aws-sdk');
const S3 = new AWS.S3();


module.exports = (event, callback) => {
	var params = 
		{
			Bucket: event.pathParameters.bucket,
			Key: event.pathParameters.key
		};

  S3.getObject(params).promise().then((result) => {
    console.log('get-object done', JSON.stringify(result));
    callback(null, result.Body);
  }).catch(function(reason) {
  	console.error('get-object error', JSON.stringify(reason));
		callback(reason, null);
	});

}
