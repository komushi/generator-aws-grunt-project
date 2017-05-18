'use strict';
const Generator = require('yeoman-generator');
const chalk = require('chalk');
const yosay = require('yosay');

module.exports = class extends Generator {
  prompting() {
    // Have Yeoman greet the user.
    this.log(yosay(
      'Welcome to the good ' + chalk.red('generator-aws-grunt-project') + ' generator!'
    ));

    const prompts = [
      {
        type: 'input',
        name: 'serviceName',
        message: 'What is the name of your service?',
        default: this.appname
      },
      {
        type: 'confirm',
        name: 'useCustomAuth',
        message: 'Would you like to enable custom authorizer for API Gateway?',
        default: false
      }
    ];

    return this.prompt(prompts).then(props => {
      // To access props later use this.props.someAnswer;
      this.props = props;
    });
  }

  writing() {
    this.fs.copy(
      this.templatePath('dummyfile.txt'),
      this.destinationPath('dummyfile.txt')
    );
  }

  install() {
    this.installDependencies();
  }
};
