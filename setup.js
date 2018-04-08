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

clear()
console.log(chalk.yellow(figlet.textSync('SIRI', { horizontalLayout: 'full' })))
console.log(chalk.yellow.bold('Schoology to TickTick Reminders Intergration'))

const schoologyKeys = async () => {
  files.checkForExistingConfig()
  console.log('')
  console.log(`To get Schoology Calander Events and Reminders API Credentials are needed from: ${chalk.underline.blue.bold('https://app.schoology.com/api')}`)
  await disclamer()
  await getSchoologyApiKeys()
}

const disclamer = async () => {
  const response = await inquirer.disclamer()
  if (response['disclamer'] === 'n') {
    console.log('exiting...')
    process.exit(1)
  }
}

const getSchoologyApiKeys = async () => {
  var response = await inquirer.getSchoologyApiKeys()
  var schoologyRequest = new oauth.OAuth(null, null, response['schoologyCurrentConsumerKey'], response['schoologyCurrentConsumerSecret'], '1.0', null, 'HMAC-SHA1')
  schoologyRequest.get('https://api.schoology.com/v1/messages/inbox', null, null, function (err, data, result) {
    if (err) {
      if (err['statusCode'] === 401) {
        console.log(chalk.red('Couldn\'t log you in. Please provide correct credentials.'))
        getSchoologyApiKeys()
      } else {
        console.log(err)
      }
    }
    if (err === null) {
      schoologyId(response, schoologyRequest)
    }
  })
}

const schoologyId = async (schoologyApiKeys, schoologyRequest) => {
  console.log('')
  console.log(`To access the correct calendar on Schoology your Schoology User Id is needed.`)
  console.log(`You can get this by going to ${chalk.underline.blue.bold('https://app.schoology.com/calendar')}. The User id will be the digits that follow.`)
  console.log(`Example: ${chalk.underline.blue.bold(`https://app.schoology.com/calendar/${chalk.underline.green.bold('XXXXXXXX')}`)}.`)
  await getSchoologyUserId(schoologyApiKeys, schoologyRequest)
}

const getSchoologyUserId = async (schoologyApiKeys, schoologyRequest) => {
  const schoologyUserId = await inquirer.getSchoologyUserId()
  schoologyRequest.get(`https://api.schoology.com/v1/users/${schoologyUserId['id']}`, null, null, async function (err, data, result) {
    if (err) {
      if (err['statusCode'] === 404) {
        console.log(chalk.red('Invalid user id. Please provide correct user id.'))
        getSchoologyApiKeys()
      } else {
        console.log(err)
      }
    }
    if (err === null) {
      data = JSON.parse(data)
      console.log(`Name: ${data['name_first']} ${data['name_middle']} ${data['name_last']}`)
      console.log(`Email: ${data['primary_email']}`)
      console.log(`Graduation Year: ${data['grad_year']}`)
      const verifySchoologyUserId = await inquirer.verifySchoologyUserId()
      if (verifySchoologyUserId['answer'] === 'y') {
        tickTickLogin(schoologyApiKeys, schoologyUserId)
      } else {
        getSchoologyUserId()
      }
    }
  })
}

const tickTickLogin = async (schoologyApiKeys, schoologyUserId) => {
  console.log('')
  console.log('To access/add reminders your TickTick Username and Password are needed.')
  await disclamer()
  await getTickTickLogin(schoologyApiKeys, schoologyUserId)
}

const getTickTickLogin = async (schoologyApiKeys, schoologyUserId) => {
  const tickTickLogin = await inquirer.getTickTickLogin()
  console.log(chalk.yellow('Ignore stuff below'))
  try {
    var ttapi = await new Ticktickapi({username: tickTickLogin['email'], password: tickTickLogin['password']})
  } catch (err) {
    if (err.message === 'Could not login') {
      console.log(chalk.red('Invalid user id. Please provide correct Email and Password.'))
      getTickTickLogin()
    } else {
      console.error(err)
    }
  }
  getPreferedProject(schoologyApiKeys, schoologyUserId, tickTickLogin, ttapi)
}

const getPreferedProject = async (schoologyApiKeys, schoologyUserId, tickTickLogin, ttapi) => {
  var projects = [{
    'name':  'Inbox',
    'value': ttapi.inboxId
  }]
  await ttapi.getProjects().then(function (rawProjects) {
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
  files.writeToJsonFile(schoologyApiKeys, schoologyUserId, tickTickLogin, preferedProject)
  crontabPreference()
}

const crontabPreference = async () => {
  const response = await inquirer.getCrontabPreference()
  if (response['answer'] === 'y') {
    const command = files.projectPath + '/STRI/stri.js'
    let stdout = execSync(`bash -c 'cat <(fgrep -i -v "${command}" <(crontab -l)) <(echo "0 15 * * * ${command}") | crontab -'`)
    if (stdout.error) {
      console.error(stdout.error)
      console.log('Error making crontab. Please open a github issue')
    }
  }
  console.log('')
  console.log(`${chalk.green.bold('Schoology to TickTick Reminder Intergration is now configured.')}`)
}
schoologyKeys()
