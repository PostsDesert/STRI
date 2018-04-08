#!/usr/bin/env node

const oauth = require('oauth')
const Ticktickapi = require('../TickTickAPI/tick')
const moment = require('moment')

const Files = require('../lib/files.js')

var files = new Files()

class STRI {
  constructor () {
    var data = files.readJsonFile()
    this.schoologyAppKey = data['schoologyCurrentConsumerKey']
    this.schoologyAppSecret = data['schoologyCurrentConsumerSecret']
    this.schoologyUserId = data['schoologyUserId']
    this.ticktickAppUsername = data['tickTickEmail']
    this.ticktickAppPassword = data['tickTickPassword']
    this.projectId = data['projectId']
    this.filesParsed = 0
  }
  start () {
    this.signIn()
  }
  async signIn () {
    this.schoologyRequest = new oauth.OAuth(null, null, this.schoologyAppKey, this.schoologyAppSecret, '1.0', null, 'HMAC-SHA1')
    this.fetchCoursesAndEvents()
    this.ttapi = await new Ticktickapi({username: this.ticktickAppUsername, password: this.ticktickAppPassword})
    this.previousIds = await this.ttapi.getAllUncompletedTasks().then(function (previousReminders) {
      var previousIds = []
      for (var i = 0; i < previousReminders.length; i++) {
        previousIds[i] = previousReminders[i]['desc']
      }
      previousIds = previousIds.filter(Boolean)
      console.log('Previous Ids:')
      console.log(previousIds)
      return previousIds
    })
    this.checkAllLoaded()
  }
  fetchCoursesAndEvents () {
    console.log('Fetching Courses and Events...')
    // Getting all courses the user is in
    this.schoologyRequest.get(`https://api.schoology.com/v1/users/${this.schoologyUserId}/sections`, null, null, this.indexCourses.bind(this))
    // Getting all events for the next month
    this.schoologyRequest.get(`https://api.schoology.com/v1/users/${this.schoologyUserId}/events?start_date=${moment().format('YYYYMMDD')}&end_date=${moment().add(1, 'months').format('YYYYMMDD')}`, null, null, this.indexSchoologyEvents.bind(this))
  }
  indexCourses (err, data, result) {
    console.log('Indexing course ids to names...')
    if (err) {
      console.error('Error getting data : ' + (err))
    }
    var courses = JSON.parse(data)['section']
    this.courses = {}
    for (var i = 0; i < courses['length']; i++) {
      var course = courses[i]
      this.courses[course['id']] = course['course_title']
    }
    this.checkAllLoaded()
  }
  indexSchoologyEvents (err, data, result) {
    console.log('Indexing Schoology Events')
    if (err) {
      console.error('Error getting data : ' + (err))
    }
    var events = JSON.parse(data)['event']
    this.events = []
    for (var i = 0; i < events.length; i++) {
      var event = events[i]
      this.events.push({
        'title':          event['title'],
        'description':    event['description'],
        'course_id':      event['section_id'],
        'id':             event['id'],
        'web_url':        event['web_url'],
        'date':           event['start'],
        'all_day':        event['all_day']
      })
    }
    this.checkAllLoaded()
  }
  checkAllLoaded () {
    this.filesParsed += 1
    if (this.filesParsed === 3) {
      this.prepareAndPackageReminders()
    }
  }
  prepareAndPackageReminders () {
    for (var i = 0; i < this.events['length']; i++) { // this.events['length']
      var event = this.events[i]
      // Title
      // Put the Course name behind Title Unless there isn't one
      if (event['course_id'] !== undefined) {
        var courseName = this.courses[(event['course_id']).toString()].replace(/-/g, '_').replace(/[^a-zA-Z0-9_ ]/g, '').replace(/ /g, '_')
        var title = `${event['title']} #${courseName}` // ${ObjectID()}
      } else {
        var title = `${event['title']}`
      }
      // Description
      // Put the event description before the weburl unless there insn't one
      if (event['description'] !== undefined && event['web_url'] !== undefined) {
        var description = event['description'] + '\n' + event['web_url']
      } else if (event['web_url'] !== undefined) {
        var description = event['web_url']
      } else if (event['description'] !== undefined) {
        var description = event['description']
      } else {
        var description = ''
      }
      // Due Date
      // add 2 hours to the date because TickTick wants it in UTC time
      var dueDate = moment(event['date']).add(2, 'hours') // "2017-08-12T17:04:51.982+0000",
      dueDate = dueDate.format('YYYY-MM-DD[T]hh:mm:ss[.000+0000]')

      // All Day
      // If the event is all day or not
      var isAllDay = !!event['all_day']

      // id to prevent duplicates later on
      var id = event['id'].toString()

      // check for duplicates
      if (!this.checkForDuplicates(id)) {
        var reminder = {
          'title':          title,
          'content':        description,
          'dueDate':        dueDate,
          'isAllDay':       isAllDay,
          'desc':           id, // the desc field on ticktick is a hidden text box used to hold infomation but not present it to the user
          'projectId':      this.projectId
        }
        // Post to TickTick Api
        this.ttapi.addTask(reminder)
      }
    }
  }
  checkForDuplicates (id) {
    for (var i = 0; i < this.previousIds.length; i++) {
      if (id === this.previousIds[i]) {
        return true
      }
    }
    return false
  }
}

const STR = new STRI()
STR.start()
