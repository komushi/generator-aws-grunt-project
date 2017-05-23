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
        name: 'stage',
        message: 'Project Deployment Stage',
        default: 'dev'
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
    // this.fs.copy(
    //   this.templatePath(),this.destinationPath()
    // );

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
    editor.insertVariable('deployStage', `process.env.DEPLOY_STAGE || "${this.props.stage}"`);

    // add serviceLambdaConfig const
    const serviceLambdaConfigPath = path.join(`${this.props.serviceLambda}`, 'config', '.env.' + `${this.props.stage}`);
    editor.insertVariable('serviceLambdaConfigPath', `"${serviceLambdaConfigPath}"`);

    // add serviceLambdaConfigDefaults const
    const serviceLambdaConfigDefaults = path.join(`${this.props.serviceLambda}`, 'config', '.env.defaults');
    editor.insertVariable('serviceLambdaConfigDefaults', `"${serviceLambdaConfigDefaults}"`);

    // add serviceLambdaConfigSchema const
    const serviceLambdaConfigSchema = path.join(`${this.props.serviceLambda}`, 'config', '.env.schema');
    editor.insertVariable('serviceLambdaConfigSchema', `"${serviceLambdaConfigSchema}"`);

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
    const PackageLambda = new SchemaObject({ serviceLambda: LambdaPackage, customAuthLambda: LambdaPackage });

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
      packageLambda = new PackageLambda({ serviceLambda: serviceLambdaPackage, customAuthLambda: customAuthLambdaPackage });
      
    } else {
      packageLambda = new PackageLambda({ serviceLambda: serviceLambdaPackage });
    }

    editor.insertConfig('package_lambda', stringifyObject(packageLambda.toObject()));
    
    // Add deploy_lambda to init config
    let awsRegion = 'awsRegion';
    const DeployOptions = new SchemaObject({ region: String, timeout: Number, memory: Number, env: String, handler: String });
    const LambdaDeploy = new SchemaObject({ arn: String, function: String, options: DeployOptions }, { preserveNull: true });
    const PackageDeploy = new SchemaObject({ serviceLambda: LambdaDeploy, customAuthLambda: LambdaDeploy });

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
    let envContentsStage;
    if (this.props.useCustomAuth) {
      envContentsStage = envfile.stringifySync({
        ServiceLambda: `'${[this.props.name, this.props.serviceLambda, this.props.stage].join('-')}'`,
        CustomAuthLambda: `'${[this.props.name, this.props.customAuthLambda, this.props.stage].join('-')}'`,
      });
    } else {
      envContentsStage = envfile.stringifySync({
        ServiceLambda: `'${[this.props.name, this.props.serviceLambda, this.props.stage].join('-')}'`
      });
    }

    this.fs.write(serviceLambdaConfigPath, envContentsStage);
    this.fs.write(serviceLambdaConfigDefaults, '');
    this.fs.write(serviceLambdaConfigSchema, envfile.stringifySync({
      ServiceLambda: '',
      CustomAuthLambda: ''
    }));

  }

  install() {
    if (this.props.installDependencies) {
      this.prinstallDependencies();  
    }
  }
};
