'use strict';
const Generator = require('yeoman-generator');
const chalk = require('chalk');
const yosay = require('yosay');
const GruntfileEditor = require('gruntfile-editor');
const path = require('path');
const os = require('os');
const SchemaObject = require('node-schema-object');
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
        name: 'stage',
        message: 'Project Deployment Stage',
        default: 'dev'
      }, 
      {
        type: 'input',
        name: 'serviceLambda',
        message: 'The service lambda(API Gateway)',
        default: 'service-lambda'
      }, 
      // {
      //   type: 'confirm',
      //   name: 'useCustomAuth',
      //   message: 'Would you like to enable custom authorizer for API Gateway?',
      //   default: false
      // },
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

    // get template Gruntfile.js
    const templateGruntPath = path.join(this.templatePath(), 'Gruntfile.js');
    const destinationGruntPath = path.join(this.destinationPath(), 'Gruntfile.js');
    this.log(yosay(
      templateGruntPath
    ), destinationGruntPath);

    // edit Gruntfile.js
    const editor = new GruntfileEditor(this.fs.read(templateGruntPath, "utf8"));

    this.log(yosay(
      this.props.name
    ));

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
    

    // const CfnConfig = new SchemaObject({ServiceLambda: String});
//     const cfnConfig = new CfnConfig({ServiceLambda: `serviceLambdaConfig.ServiceLambda`});

    // const cfnConfigScript = 'const cfnConfig = {ServiceLambda: serviceLambdaConfig.ServiceLambda}';
    // editor.prependJavaScript(cfnConfigScript);

    const cfnConfigScript = '{ServiceLambda: serviceLambdaConfig.ServiceLambda}';
    editor.insertVariable('cfnConfig', `${cfnConfigScript}`);

  // const cfnConfig = {
  //   ServiceLambda: serviceLambdaConfig.ServiceLambda
  // };

    this.fs.write(destinationGruntPath, editor.toString());
  }

  install() {
    if (this.props.installDependencies) {
      this.prinstallDependencies();  
    }
  }
};
