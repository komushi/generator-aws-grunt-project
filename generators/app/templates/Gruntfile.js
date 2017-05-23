'use strict';

const dotenv = require('dotenv-extended');
const os = require("os");
const fs = require("fs");

module.exports = function (grunt) { // eslint-disable-line func-names
  require('load-grunt-tasks')(grunt);   // eslint-disable-line global-require
  
  // name of this service
  const serviceName = '';
  
  // deployment stage
  const deployStage = '';
  grunt.log.writeln(`Deployment Stage ${deployStage}`);

  const localHostname = os.hostname().toLowerCase();
  
  // service-lambda config
  const serviceLambdaConfig = '';

  // custom-auth-lambda config
  const customAuthLambdaConfig = '';
  

/* TODO
  const customAuthConfig = dotenv.load({
    path: `custom-auth-lambda/config/.env.${deployStage}`,
    defaults: 'custom-auth-lambda/config/.env.defaults',
    schema: 'custom-auth-lambda/config/.env.schema',
    errorOnMissing: true,
  });
  customAuthConfig.serviceName = serviceName;   // custom auth needs service name
*/
  const cfnConfig = {
    ServiceLambda: serviceLambdaConfig.ServiceLambda
  };



  const awsRegion = process.env.AWS_DEFAULT_REGION || 'ap-northeast-1';
  process.env.AWS_DEFAULT_REGION = awsRegion;      // Set if not already set

  const pkg = grunt.file.readJSON('package.json');

  grunt.initConfig({
    pkg,

    env: {
      component_test: {
        api_id: '<%= APIID %>',
        DEPLOY_STAGE: deployStage,
        AWS_DEFAULT_REGION: awsRegion
      }
    },

    usage: {
      options: {
        title: '<%= pkg.name %> service',
        taskGroups: [{
          header: 'Available tasks',
          tasks: [
            'usage',
            // 'clean',
            // 'coverage',
            // 'build',
            'update_lambdas',
            'setup_service',
            'teardown_service'
            // 'component_tests',
            // 'just_component_tests'
          ]
        }]
      }
    },

    // eslint: {
    //   main: {
    //     options: {
    //       configFile: './.eslintrc.yaml',
    //       format: 'checkstyle',
    //       outputFile: 'reports/checkstyle.xml'
    //     },
    //     src: ['Gruntfile.js', 'index.js', 's3-lambdas/src/**/*.js']
    //   },
    //   tests: {
    //     options: {
    //       configFile: './blob-meta-lambda/test/.eslintrc.yaml',
    //       format: 'checkstyle',
    //       outputFile: 'reports/checkstyle.tests.xml'
    //     },
    //     src: ['s3-lambdas/test/unit/**/*.js']
    //   }
    // },

    // mocha_istanbul: {
    //   coverage: {
    //     src: ['blob-meta-lambda/test/unit/**/*.js', 'custom-auth-lambda/test/unit/**/*.js'],
    //     options: {
    //       coverage: true, // this will cause grunt.event.on('coverage') event listener to fire
    //       coverageFolder: 'reports',
    //       check: {
    //         lines: 75,
    //         statements: 75
    //       },
    //       root: '.', // define where the cover task should consider the root of libraries that are covered by tests
    //       reportFormats: [
    //         'cobertura',
    //         'lcovonly'
    //       ],
    //       mochaOptions: [
    //         '--reporter',
    //         'xunit',
    //         '--reporter-options',
    //         'output=reports/test-results.xml'
    //       ]
    //     }
    //   },
    //   component_test: {
    //     src: ['integration/test/test_blob_api.js'],
    //     options: {
    //       quiet: false,
    //       clearRequireCache: false,
    //       noFail: true
    //     }
    //   }
    // },
    

    'setup-api-gw-stack': {
      default: {
        region: awsRegion,
        deployStage,
        serviceName,
        cfnTemplateFile: 'integration/cfn/setup_resources.yaml',
        swaggerFile: 'integration/swaggers/service_swagger.yaml',
        config: cfnConfig
      }
    },

    'delete-service': {
      default: {
        region: awsRegion,
        deployStage,
        serviceName
      }
    },
/*
    'dynamodb-load-data': {
      svcMappingTable: {
        options: {
          region: awsRegion,
          loadFile: 'blob-meta-lambda/config/BlobRepoInitModified.json',
          tableName: blobMetaConfig.BlobRepoTableName,
          primaryKeyName: 'dataType'
        }
      }
    },


*/
    clean: {
      folder: ['reports'],
    }

  });

  grunt.event.on('coverage', (lcovFileContents, done) => {
        // Check below on the section "The coverage event"
    done();
  });

  grunt.registerTask('default', ['usage']);
  // grunt.registerTask('coverage', 'Executes unit tests and compiles coverage reports.', ['mocha_istanbul:coverage']);
  // grunt.registerTask('build', 'Runs the complete CI/CD build', ['eslint', 'coverage']);
  grunt.registerTask('update_lambdas', 'Package and Deploys the Lambda artifacts', 
    [
      'package_lambda',
      'deploy_lambda'
      
    ]);
  // grunt.registerTask('dynamodb_load', 'Load pre-populated data into DynamoDB tables', ['dynamodb-load-data:svcMappingTable']);

  grunt.registerTask('setup_service', 'Setup service and all its dependent AWS resources.',
    [
      'setup-api-gw-stack',
      'package_lambda',
      'deploy_lambda'
      // 'dynamodb_load'
      // 'printURL',
    ]
  );


  grunt.registerTask('teardown_service', 'Deletes AWS resources.', ['delete-service']);

  grunt.registerTask('component_tests', 'Run component tests',
    [
      'setup_service',
      'setAPIID',
      'env:component_test',
      'mocha_istanbul:component_test'
    ]
  );

  grunt.task.registerTask('printURL', 'Task to set APIID', () => {
    // grunt.task.requires('setup_service');
    const APIID = grunt.config.get('service-setup-api-gw.default.APIID');
    grunt.log.writeln(
      `ServiceDeployment URL : https://${APIID}.execute-api.${awsRegion}.amazonaws.com/${deployStage}`);
  });

  grunt.task.registerTask('setAPIID', 'Task to set APIID', () => {
    // grunt.task.requires('setup_service');
    const APIID = grunt.config.get('service-setup-api-gw.default.APIID');
    grunt.config.set('APIID', APIID);
  });


  grunt.task.registerTask('setLocalAPIID', 'Task to set APIID', () => {
    grunt.config.set('APIID', '6mvlt7k1h5');
  });

  grunt.registerTask('just_component_tests', 'Run only component tests',
    [
      'setLocalAPIID',
      'env:component_test',
      'mocha_istanbul:component_test'
    ]
  );
};
