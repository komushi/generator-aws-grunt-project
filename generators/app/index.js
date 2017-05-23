'use strict';
const Generator = require('yeoman-generator');
const chalk = require('chalk');
const yosay = require('yosay');
const GruntfileEditor = require('gruntfile-editor');
const path = require('path');
const os = require('os');
const SchemaObject = require('schema-object');
const stringifyObject = require('stringify-object');
const envfile = require('envfile');
// const _ = require('lodash');
// const extend = _.merge;

module.exports = class extends Generator {

  initializing() {
    this.pkg = this.fs.readJSON(this.destinationPath('package.json'), {});

    // Pre set the default props from the information we have at this point
    this.props = {
      name: this.pkg.name,
      description: this.pkg.description,
      version: this.pkg.version,
      homepage: this.pkg.homepage,
      dependencies: this.pkg.dependencies
    };
  }

  prompting() {
    // Have Yeoman greet the user.
    this.log(yosay(
      'Welcome to the good ' + chalk.red('generator-aws-grunt-project') + ' generator!'
    ));

    const prompts = [
      {
        type: 'input',
        name: 'name',
        message: 'What is the name of this service?',
        default: path.basename(process.cwd()),
        // filter: _.kebabCase,
        validate(str) {
          return str.length > 0;
        }
      },
      {
        type: 'input',
        name: 'description',
        message: 'Description',
        default: this.props.description
      },
      {
        type: 'input',
        name: 'version',
        message: 'Version',
        default: this.props.version
      }, 
      {
        type: 'input',
        name: 'homepage',
        message: 'Project homepage url',
        default: this.props.homepage
      }, 
      {
        type: 'input',
        name: 'region',
        message: 'AWS Default Region',
        default: 'ap-northeast-1'
      },
      {
        type: 'input',
        name: 'serviceLambda',
        message: 'The name of the service lambda(API Gateway)',
        default: 'service-lambda'
      }, 
      {
        type: 'confirm',
        name: 'useCustomAuth',
        message: 'Would you like to enable custom authorizer for API Gateway?',
        default: false
      },
      {
        type: 'input',
        name: 'customAuthLambda',
        message: 'The name of the custom authorizer lambda',
        default: 'custom-auth-lambda',
        when: function (response) {
                return response.useCustomAuth;
              }
      },
      {
        type: 'confirm',
        name: 'installDependencies',
        message: 'Would you like to install dependencies?',
        default: false
      }
    ];

    return this.prompt(prompts).then(props => {
      // To access props later use this.props.someAnswer;
      this.props = props;
    });
  }

  writing() {


    /***************************/
    /*  package.json process   */
    /***************************/
    // Re-read the content at this point because a composed generator might modify it.
    const templatePkg = this.fs.readJSON(this.templatePath('package.json'), {});

    const pkg = {
      // name: _.kebabCase(this.props.name),
      name: this.props.name,
      version: this.props.version,
      description: this.props.description,
      homepage: this.props.homepage,
      author: {
        name: '',
        email: '',
        url: ''
      },
      keywords: [],
      license: '',
      dependencies: this.props.dependencies,
      devDependencies: templatePkg.devDependencies
    };

    // Let's extend package.json so we're not overwriting user previous fields
    this.fs.writeJSON(this.destinationPath('package.json'), pkg);

    /***************************/
    /*  Gruntfile.js process   */
    /***************************/
    // get template Gruntfile.js
    const templateGruntPath = path.join(this.templatePath(), 'Gruntfile.js');
    const destinationGruntPath = path.join(this.destinationPath(), 'Gruntfile.js');
    this.log(yosay(
      templateGruntPath
    ), destinationGruntPath);

    // edit Gruntfile.js
    const editor = new GruntfileEditor(this.fs.read(templateGruntPath, "utf8"));

    // add serviceName const
    editor.insertVariable('serviceName', `"${this.props.name}"`);

    // add deployStage const
    editor.insertVariable('deployStage', `process.env.DEPLOY_STAGE || "dev"`);

    // add serviceLambdaConfig const
    // serviceLambdaConfigPath
    const serviceLambdaConfigPath = '`' + path.join(this.props.serviceLambda, 'config', '.env.') + '${deployStage}`';
    // serviceLambdaConfigDefaults
    const serviceLambdaConfigDefaults = path.join(this.props.serviceLambda, 'config', '.env.defaults');
    // serviceLambdaConfigSchema
    const serviceLambdaConfigSchema = path.join(this.props.serviceLambda, 'config', '.env.schema');
    // serviceLambdaConfigDev
    const serviceLambdaConfigDev = path.join(this.props.serviceLambda, 'config', '.env.dev');
    // serviceLambdaConfigTest
    const serviceLambdaConfigTest = path.join(this.props.serviceLambda, 'config', '.env.test');
    // serviceLambdaConfigProd
    const serviceLambdaConfigProd = path.join(this.props.serviceLambda, 'config', '.env.prod');

    const LambdaConfig = new SchemaObject({
      path: String,
      defaults: String,
      schema: String,
      errorOnMissing: Boolean
    });

    const serviceLambdaConfig = new LambdaConfig({
      path: serviceLambdaConfigPath,
      defaults: serviceLambdaConfigDefaults,
      schema: serviceLambdaConfigSchema,
      errorOnMissing: true
    });

    const serviceLambdaConfigContents = stringifyObject(serviceLambdaConfig.toObject())
      .replace("'`", '`')
      .replace("`'", '`');

    editor.insertVariable('serviceLambdaConfigContents', serviceLambdaConfigContents);

    editor.insertVariable('serviceLambdaConfig', 'dotenv.load(serviceLambdaConfigContents)');

    let customAuthLambdaConfigPath, customAuthLambdaConfigDefaults, customAuthLambdaConfigSchema,
      customAuthLambdaConfigDev, customAuthLambdaConfigTest, customAuthLambdaConfigProd;

    // add customAuthLambdaConfig const
    if (this.props.useCustomAuth) {
      // customAuthLambdaConfigPath
      customAuthLambdaConfigPath = '`' + path.join(this.props.customAuthLambda, 'config', '.env.') + '${deployStage}`';
      // customAuthLambdaConfigDefaults
      customAuthLambdaConfigDefaults = path.join(this.props.customAuthLambda, 'config', '.env.defaults');
      // customAuthLambdaConfigDefaults
      customAuthLambdaConfigSchema = path.join(this.props.customAuthLambda, 'config', '.env.schema');
      // customAuthLambdaConfigDev
      customAuthLambdaConfigDev = path.join(this.props.customAuthLambda, 'config', '.env.dev');
      // customAuthLambdaConfigTest
      customAuthLambdaConfigTest = path.join(this.props.customAuthLambda, 'config', '.env.test');
      // customAuthLambdaConfigProd
      customAuthLambdaConfigProd = path.join(this.props.customAuthLambda, 'config', '.env.prod');

      const customAuthLambdaConfig = new LambdaConfig({
        path: customAuthLambdaConfigPath,
        defaults: customAuthLambdaConfigDefaults,
        schema: customAuthLambdaConfigSchema,
        errorOnMissing: true
      });

      const customAuthLambdaConfigContents = stringifyObject(customAuthLambdaConfig.toObject())
        .replace("'`", '`')
        .replace("`'", '`');

      editor.insertVariable('customAuthLambdaConfigContents', customAuthLambdaConfigContents);

      editor.insertVariable('customAuthLambdaConfig', 'dotenv.load(customAuthLambdaConfigContents)');

    }


    // add cfnConfig const
    let cfnConfigScript;
    if (this.props.useCustomAuth) {
      cfnConfigScript = '{ ServiceLambda: serviceLambdaConfig.ServiceLambda, CustomAuthLambda: customAuthConfig.CustAuthLambda }';
    } else {
      cfnConfigScript = '{ ServiceLambda: serviceLambdaConfig.ServiceLambda }';
    }
    editor.insertVariable('cfnConfig', `${cfnConfigScript}`);
    
    // add awsRegion const
    editor.insertVariable('awsRegion', `process.env.AWS_DEFAULT_REGION || "${this.props.region}"`);

    // Add package_lambda to init config
    const PackageOptions = new SchemaObject({ 
      package_folder: String,
      dist_folder: String
    });
    const LambdaPackage = new SchemaObject({ options: PackageOptions });
    const PackageLambda = new SchemaObject({
      serviceLambda: LambdaPackage,
      customAuthLambda: LambdaPackage
    });

    const servicePackageOptions = new PackageOptions({
      package_folder: this.props.serviceLambda,
      dist_folder: 'build'
    });
    const serviceLambdaPackage = new LambdaPackage({ options: servicePackageOptions });

    let packageLambda;
    
    if (this.props.useCustomAuth) {
      const customAuthPackageOptions = new PackageOptions({
        package_folder: this.props.customAuthLambda,
        dist_folder: 'build'
      });
      const customAuthLambdaPackage = new LambdaPackage({ options: customAuthPackageOptions });
      packageLambda = new PackageLambda({
        serviceLambda: serviceLambdaPackage,
        customAuthLambda: customAuthLambdaPackage
      });
      
    } else {
      packageLambda = new PackageLambda({ serviceLambda: serviceLambdaPackage });
    }

    editor.insertConfig('package_lambda', stringifyObject(packageLambda.toObject()));
    
    // Add deploy_lambda to init config
    let awsRegion = 'awsRegion';
    const DeployOptions = new SchemaObject({ 
      region: String,
      timeout: Number,
      memory: Number,
      env: String,
      handler: String 
    });
    const LambdaDeploy = new SchemaObject({
      arn: String,
      function: String,
      options: DeployOptions
    },{ 
      preserveNull: true 
    });
    const PackageDeploy = new SchemaObject({
      serviceLambda: LambdaDeploy,
      customAuthLambda: LambdaDeploy
    });

    const serviceDeployOptions = new DeployOptions({
      region: 'awsRegion',
      timeout: 45,
      memory: 512,
      env: 'serviceLambdaConfig',
      handler: 'src/index.handler'
    });

    const serviceLambdaDeploy = new LambdaDeploy({ 
      arn: null,
      function: 'serviceLambdaConfig.ServiceLambda',
      options: serviceDeployOptions
    });

    let packageDeploy;

    if (this.props.useCustomAuth) {
      const customAuthDeployOptions = new DeployOptions({
        region: 'awsRegion',
        timeout: 45,
        memory: 512,
        env: 'customAuthConfig',
        handler: 'src/index.handler'
      });
      const customAuthLambdaDeploy = new LambdaDeploy({ 
        arn: null,
        function: 'customAuthConfig.CustAuthLambda',
        options: customAuthDeployOptions
      });
      packageDeploy = new PackageDeploy({ serviceLambda: serviceLambdaDeploy, customAuthLambda: customAuthLambdaDeploy });
      
    } else {
      packageDeploy = new PackageDeploy({ serviceLambda: serviceLambdaDeploy });
    }

    const deployLambdaConifg = stringifyObject(packageDeploy.toObject())
      .replace("'awsRegion'", 'awsRegion')
      .replace("'customAuthConfig'", 'customAuthConfig')
      .replace("'serviceLambdaConfig'", 'serviceLambdaConfig')
      .replace("'customAuthConfig.CustAuthLambda'", 'customAuthConfig.CustAuthLambda')
      .replace("'serviceLambdaConfig.ServiceLambda'", 'serviceLambdaConfig.ServiceLambda');

    editor.insertConfig('deploy_lambda', deployLambdaConifg);

    // generate Gruntfile.js
    this.fs.write(destinationGruntPath, editor.toString());

    /***************************/
    /*    env files process    */
    /***************************/
    const envServiceDev = envfile.stringifySync({
      ServiceLambda: `'${[this.props.name, this.props.serviceLambda, 'dev'].join('-')}'`
    });

    const envServiceTest = envfile.stringifySync({
      ServiceLambda: `'${[this.props.name, this.props.serviceLambda, 'test'].join('-')}'`
    });

    const envServiceProd = envfile.stringifySync({
      ServiceLambda: `'${[this.props.name, this.props.serviceLambda].join('-')}'`
    });
    
    this.fs.write(serviceLambdaConfigDefaults, '');
    this.fs.write(serviceLambdaConfigSchema, envfile.stringifySync({ ServiceLambda: '' }));
    this.fs.write(serviceLambdaConfigDev, envServiceDev);
    this.fs.write(serviceLambdaConfigTest, envServiceTest);
    this.fs.write(serviceLambdaConfigProd, envServiceProd);

    /***************************************/
    /*    env files process custom-auth    */
    /***************************************/
    if (this.props.useCustomAuth) {
      const envCustomAuthDev = envfile.stringifySync({
        CustomAuthLambda: `'${[this.props.name, this.props.customAuthLambda, 'dev'].join('-')}'`
      });

      const envCustomAuthTest = envfile.stringifySync({
        CustomAuthLambda: `'${[this.props.name, this.props.customAuthLambda, 'test'].join('-')}'`
      });

      const envCustomAuthProd = envfile.stringifySync({
        CustomAuthLambda: `'${[this.props.name, this.props.customAuthLambda].join('-')}'`
      });

      this.fs.write(customAuthLambdaConfigDefaults, '');
      this.fs.write(customAuthLambdaConfigSchema, envfile.stringifySync({ CustomAuthLambda: '' }));
      this.fs.write(customAuthLambdaConfigDev, envCustomAuthDev);
      this.fs.write(customAuthLambdaConfigTest, envCustomAuthTest);
      this.fs.write(customAuthLambdaConfigProd, envCustomAuthProd);
    }

    /***************************/
    /*    copying files        */
    /***************************/
    this.fs.copy(
      this.templatePath('service-lambda'), this.destinationPath(this.props.serviceLambda)
    );

    this.fs.copy(
      this.templatePath('integration'), this.destinationPath('integration')
    );

    if (this.props.useCustomAuth) {
      this.fs.copy(
        this.templatePath('custom-auth-lambda'), this.destinationPath(this.props.customAuthLambda)
      );
    }
  }

  install() {
    if (this.props.installDependencies) {
      this.prinstallDependencies();  
    }
  }
};
