#!/usr/bin/env node

const inquirer = require('inquirer')

module.exports = {
  disclamer: () => {
    const questions = [
      {
        name: 'disclamer',
        type: 'input',
        message: `These are stored on an unencrypted file in the project directory. Continue? (Y/n):`,
        validate: function (value) {
          value = value.charAt(0).toLowerCase()
          if (value === 'y' || value === 'n') {
            return true
          } else {
            return 'Please enter \'yes\' or \'no\''
          }
        }
      }
    ]
    return inquirer.prompt(questions)
  },
  getSchoologyApiKeys: () => {
    const questions = [
      {
        name: 'schoologyCurrentConsumerKey',
        type: 'input',
        message: 'Enter your Schoology current consumer key:',
        validate: function (value) {
          if (value.length) {
            return true
          } else {
            return 'Please enter your Schoology current consumer key.'
          }
        }
      },
      {
        name: 'schoologyCurrentConsumerSecret',
        type: 'input',
        message: 'Enter your Schoology current consumer secret:',
        validate: function (value) {
          if (value.length) {
            return true
          } else {
            return 'Please enter your Schoology current consumer secret.'
          }
        }
      }
    ]
    return inquirer.prompt(questions)
  },
  getSchoologyUserId: () => {
    const questions = [
      {
        name: 'id',
        type: 'input',
        message: 'Enter your Schoology user id:',
        validate: function (value) {
          if (value.length) {
            return true
          } else {
            return 'Please enter your Schoology user id.'
          }
        }
      }
    ]
    return inquirer.prompt(questions)
  },
  verifySchoologyUserId: () => {
    const questions = [
      {
        name: 'answer',
        type: 'input',
        message: 'Is the above infomation correct? (This infomation is for verification perposes only) (Y/n):',
        validate: function (value) {
          value = value.charAt(0).toLowerCase()
          if (value === 'y' || value === 'n') {
            return true
          } else {
            return 'Please enter \'yes\' or \'no\''
          }
        }
      }
    ]
    return inquirer.prompt(questions)
  },
  getTickTickLogin: () => {
    const questions = [
      {
        name: 'email',
        type: 'input',
        message: 'Enter your TickTick email:',
        validate: function (value) {
          if (value.length) {
            return true
          } else {
            return 'Please enter your TickTick email.'
          }
        }
      },
      {
        name: 'password',
        type: 'password',
        message: 'Enter your tickTick password:',
        validate: function (value) {
          if (value.length) {
            return true
          } else {
            return 'Please enter your tickTick Password.'
          }
        }
      }
    ]
    return inquirer.prompt(questions)
  },
  getPreferedProject: (projects) => {
    const questions = [
      {
        name: 'preferedproject',
        type: 'list',
        message: 'Choose the list you want your reminders to be added to:',
        choices: projects
      }
    ]
    return inquirer.prompt(questions)
  },
  getCrontabPreference: () => {
    const questions = [
      {
        name: 'answer',
        type: 'input',
        message: `Would you like to add a crontab to automatically run the script every day? (Y/n):`,
        validate: function (value) {
          value = value.charAt(0).toLowerCase()
          if (value === 'y' || value === 'n') {
            return true
          } else {
            return 'Please enter \'yes\' or \'no\''
          }
        }
      }
    ]
    return inquirer.prompt(questions)
  },
  getAutoUpdatePreference: () => {
    const questions = [
      {
        name: 'answer',
        type: 'input',
        message: `Would you like to enable automatic updates for STRI. This can include new features, bug fixes, etc. (Y/n):`,
        validate: function (value) {
          value = value.charAt(0).toLowerCase()
          if (value === 'y' || value === 'n') {
            return true
          } else {
            return 'Please enter \'yes\' or \'no\''
          }
        }
      }
    ]
    return inquirer.prompt(questions)
  }
}
