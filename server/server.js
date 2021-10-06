import express from 'express'
import path from 'path'
import cors from 'cors'
import sockjs from 'sockjs'
import { renderToStaticNodeStream } from 'react-dom/server'
import React from 'react'
import { nanoid } from 'nanoid'
import axios from 'axios'

import cookieParser from 'cookie-parser'
import config from './config'
import Html from '../client/html'

const { readFile, writeFile } = require('fs').promises

require('colors')

let Root
try {
  // eslint-disable-next-line import/no-unresolved
  Root = require('../dist/assets/js/ssr/root.bundle').default
} catch {
  console.log('SSR not found. Please run "yarn run build:ssr"'.red)
}

let connections = []

const port = process.env.PORT || 8090
const server = express()

const setHeaders = (req, res, next) => {
  res.set('x-skillcrucial-user', '385666b1-bff5-11e9-95ba-1bf845c18f8d')
  res.set('Access-Control-Expose-Headers', 'X-SKILLCRUCIAL-USER')
  next()
}

const middleware = [
  cors(),
  express.static(path.resolve(__dirname, '../dist/assets')),
  express.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 }),
  express.json({ limit: '50mb', extended: true }),
  cookieParser(),
  setHeaders
]

middleware.forEach((it) => server.use(it))

let users = []
const jsonPlaceholderUrl = 'https://jsonplaceholder.typicode.com/users'
const usersPath = `${__dirname}/data/users.json`

server.get('/api/users', (req, res) => {
  res.json(users)
})

server.get('/api/fake', async (req, res) => {
  const userList = await readFile(usersPath, 'utf-8')
    .then((strData) => {
      return JSON.parse(strData)
    })
    .catch(async () => {
      const newUsers = await axios(jsonPlaceholderUrl)
        .then(({ data }) => {
          const usersWithNewIds = data.map((u) => ({ ...u, id: nanoid() }))
          writeFile(usersPath, JSON.stringify(usersWithNewIds), 'utf-8')
          return usersWithNewIds
        })
        .catch((err) => {
          console.log(err)
          res.json({ status: 'Error' })
        })
      return newUsers
    })
  res.json({ status: 'success', data: userList })
})

server.post('/api/fake', async (req, res) => {
  const newUser = { ...req.body, id: nanoid() }
  const readUsers = await readFile(usersPath, 'utf-8')
    .then((oldUsers) => {
      return JSON.parse(oldUsers)
    })
    .catch(() => {
      return []
    })
  const newList = [...readUsers, newUser]
  await writeFile(usersPath, JSON.stringify(newList), 'utf-8')
  res.json({ status: 'success', data: newUser })
})

server.get('/api/users/:id', (req, res) => {
  const { id } = req.params
  const foundUser = users.find((user) => user.id === id)
  if (!foundUser) {
    res.json({ status: null })
  }
  res.json(foundUser)
})

server.post('/api/user', (req, res) => {
  const createUser = { ...req.body, id: nanoid() }
  users = [...users, createUser]
  res.json(createUser)
})

server.use('/api/', (req, res) => {
  res.status(404)
  res.end()
})

const [htmlStart, htmlEnd] = Html({
  body: 'separator',
  title: 'Skillcrucial'
}).split('separator')

server.get('/', (req, res) => {
  const appStream = renderToStaticNodeStream(<Root location={req.url} context={{}} />)
  res.write(htmlStart)
  appStream.pipe(res, { end: false })
  appStream.on('end', () => {
    res.write(htmlEnd)
    res.end()
  })
})

server.get('/*', (req, res) => {
  const appStream = renderToStaticNodeStream(<Root location={req.url} context={{}} />)
  res.write(htmlStart)
  appStream.pipe(res, { end: false })
  appStream.on('end', () => {
    res.write(htmlEnd)
    res.end()
  })
})

const app = server.listen(port)

if (config.isSocketsEnabled) {
  const echo = sockjs.createServer()
  echo.on('connection', (conn) => {
    connections.push(conn)
    conn.on('data', async () => {})

    conn.on('close', () => {
      connections = connections.filter((c) => c.readyState !== 3)
    })
  })
  echo.installHandlers(app, { prefix: '/ws' })
}
console.log(`Serving at http://localhost:${port}`)
