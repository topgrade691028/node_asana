const express = require('express')
const logger = require('morgan')
const bodyParser = require('body-parser')
require('dotenv').config()
const http = require('http')

const app = express()

app.use(logger('dev'))
// app.use(cors())
// Parse incoming requests data (https://github.com/expressjs/body-parser)
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

require('./routes')(app)

const port = process.env.PORT || 3002
app.set('port', port)
const server = http.createServer(app)
server.listen(port)

console.log('Dashboard Back-End started on ' + port)

module.exports = app