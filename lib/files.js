#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const chalk = require('chalk')

class Files {
  constructor (options) {
    this.projectPath = path.dirname(fs.realpathSync(__filename)).slice(0, -4)
  }
  checkForExistingConfig () {
    var jsonDir = this.projectPath + '/STRI/config.json'
    if (fs.existsSync(jsonDir)) {
      console.log(chalk.red.bold('Existing Config Found'))
      console.log(`Delete file at '${jsonDir}' to reset the current configuration.`)
      console.log('exiting...')
      process.exit(1)
    }
  }
  writeToJsonFile (schoologyApiKeys, schoologyUserId, tickTickLogin, preferedProject) {
    var jsonDir = this.projectPath + '/STRI/config.json'
    fs.closeSync(fs.openSync(jsonDir, 'w'))
    var data = {
      schoologyCurrentConsumerKey: schoologyApiKeys['schoologyCurrentConsumerKey'],
      schoologyCurrentConsumerSecret: schoologyApiKeys['schoologyCurrentConsumerSecret'],
      schoologyUserId: schoologyUserId['id'],
      tickTickEmail: tickTickLogin['email'],
      tickTickPassword: tickTickLogin['password'],
      projectId: preferedProject['preferedproject']
    }
    data = JSON.stringify(data, null, 2)
    fs.writeFile(jsonDir, data, (err) => {
      if (err) throw err
    })
  }
  readJsonFile () {
    var jsonDir = this.projectPath + '/STRI/config.json'
    var rawdata = fs.readFileSync(jsonDir)
    var data = JSON.parse(rawdata)
    return data
  }
}

module.exports = Files
