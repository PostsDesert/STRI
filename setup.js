#!/usr/bin/env node

const {execSync} = require('child_process')
const chalk = require('chalk')
const clear = require('clear')
const figlet = require('figlet')
const oauth = require('oauth')
const Ticktickapi = require('./TickTickAPI/tick')

const inquirer = require('./lib/inquirer')
var Files = require('./lib/files')

var files = new Files()

class Setup {
  // constructor () {
  // }

  async schoologyKeys () {
    clear()
    console.log(chalk.yellow(figlet.textSync('STRI', { horizontalLayout: 'full' })))
    console.log(chalk.yellow.bold('Schoology to TickTick Reminders Intergration'))
    files.checkForExistingConfig()
    console.log('')
    console.log(`To get Schoology Calander Events and Reminders API Credentials are needed from: ${chalk.underline.blue.bold('https://app.schoology.com/api')}`)
    await this.disclamer()
    await this.getSchoologyApiKeys()
  }

  async disclamer () {
    const response = await inquirer.disclamer()
    if (response['disclamer'] === 'n') {
      console.log('exiting...')
      process.exit(1)
    }
  }

  async getSchoologyApiKeys () {
    var response = await inquirer.getSchoologyApiKeys()
    this.schoologyRequest = new oauth.OAuth(null, null, response['schoologyCurrentConsumerKey'], response['schoologyCurrentConsumerSecret'], '1.0', null, 'HMAC-SHA1')
    this.schoologyRequest.get('https://api.schoology.com/v1/messages/inbox', null, null, function (err, data, result) {
      if (err) {
        if (err['statusCode'] === 401) {
          console.log(chalk.red('Couldn\'t log you in. Please provide correct credentials.'))
          this.getSchoologyApiKeys()
        } else {
          console.log(err)
        }
      }
      if (err === null) {
        this.schoologyApiKeys = response
        this.schoologyId()
      }
    }.bind(this))
  }

  async schoologyId () {
    console.log('')
    console.log(`To access the correct calendar on Schoology your Schoology User Id is needed.`)
    console.log(`You can get this by going to ${chalk.underline.blue.bold('https://app.schoology.com/calendar')}. The User id will be the digits that follow.`)
    console.log(`Example: ${chalk.underline.blue.bold(`https://app.schoology.com/calendar/${chalk.underline.green.bold('XXXXXXXX')}`)}.`)
    await this.getSchoologyUserId()
  }

  async getSchoologyUserId () {
    const schoologyUserId = await inquirer.getSchoologyUserId()
    this.schoologyRequest.get(`https://api.schoology.com/v1/users/${schoologyUserId['id']}`, null, null, async function (err, data, result) {
      if (err) {
        console.log(chalk.red('Invalid user id. Please provide correct user id.'))
        this.getSchoologyUserId()
      }
      if (err === null) {
        data = JSON.parse(data)
        console.log(`Name: ${data['name_first']} ${data['name_middle']} ${data['name_last']}`)
        console.log(`Email: ${data['primary_email']}`)
        console.log(`Graduation Year: ${data['grad_year']}`)
        const verifySchoologyUserId = await inquirer.verifySchoologyUserId()
        console.log(verifySchoologyUserId['answer'])
        if (verifySchoologyUserId['answer'].charAt(0).toLowerCase() === 'y') {
          this.schoologyUserId = schoologyUserId
          this.tickTickLogin()
        } else {
          this.getSchoologyUserId()
        }
      }
    }.bind(this))
  }

  async tickTickLogin () {
    console.log('')
    console.log('To access/add reminders your TickTick Username and Password are needed.')
    await this.disclamer()
    await this.getTickTickLogin()
  }

  async getTickTickLogin (schoologyApiKeys, schoologyUserId) {
    const tickTickLogin = await inquirer.getTickTickLogin()
    console.log(chalk.yellow('Ignore stuff below'))
    try {
      this.ttapi = await new Ticktickapi({username: tickTickLogin['email'], password: tickTickLogin['password']})
    } catch (err) {
      if (err.message === 'Could not login') {
        console.log(chalk.red('Invalid user id. Please provide correct Email and Password.'))
        this.getTickTickLogin()
      } else {
        console.error(err)
      }
    }
    this.tickTickLogin = tickTickLogin
    this.getPreferedProject()
  }

  async getPreferedProject () {
    var projects = [{
      'name':  'Inbox',
      'value': this.ttapi.inboxId
    }]
    await this.ttapi.getProjects().then(function (rawProjects) {
      for (var i = 0; i < rawProjects.length; i++) {
        var rawProject = rawProjects[i]
        projects.push({
          'name':  rawProject['name'],
          'value': rawProject['id']
        })
      }
      return projects
    })
    console.log(chalk.yellow('Ignore stuff above'))
    const preferedProject = await inquirer.getPreferedProject(projects)
    files.writeToJsonFile(this.schoologyApiKeys, this.schoologyUserId, this.tickTickLogin, preferedProject)
    this.crontabPreference()
  }

  async crontabPreference () {
    const response = await inquirer.getCrontabPreference()
    const command = files.projectPath + '/STRI/stri.js'
    if (response['answer'].charAt(0).toLowerCase() === 'y') {
      const command = files.projectPath + '/STRI/stri.js'
      let stdout = execSync(`bash -c 'cat <(fgrep -i -v "${command}" <(crontab -l)) <(echo "0 15 * * * ${command}") | crontab -'`)
      if (stdout.error) {
        console.error(stdout.error)
        console.log('Error making crontab. Please open a github issue')
      }
    }
    console.log('Crontab Added')
    console.log('')
    console.log(`${chalk.green.bold('Schoology to TickTick Reminder Intergration is now configured.')}`)
    console.log('STRI will now run in the background to sync your tasks.')
    let runSTRI = execSync(`bash -c '${command}'`)
    if (runSTRI.error) {
      console.error(runSTRI.error)
      console.log('Error running STRI. Please open a github issue')
    }
  }
}

const setup = new Setup()
setup.schoologyKeys()
