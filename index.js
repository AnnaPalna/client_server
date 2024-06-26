const bodyParser = require("body-parser")
const cookieParser = require("cookie-parser")
const cors = require("cors")
const express = require("express")
const fs = require('fs')
const md5 = require('md5')
const session = require("express-session")

const { check, validationResult } = require('express-validator')

const app = express()
app.use(cors({
  origin: ["http://localhost:3000"],
  methods: ["POST", "GET"],
  credentials: true
}))
app.use(express.json())
app.use(cookieParser())
app.use(bodyParser.json())
app.use(session({
  key: 'userId',
  secret: 'secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    maxAge: 24 * 60 * 60
  }
}))

const users = [{
  id: 1, name: 'Hagrid', email: 'hagrid1@gmail.com', password: 'Hogwarts22'
}]

app.get('/', (req, res) => {
  if (req.session.user) {
    console.log('! Session already started')
    return res.json({ isLoggedIn: true, user: req.session.user })
  } else {
    console.log('! You should login firstly')
    return res.json({ isLoggedIn: false })
  }
})

app.post('/login', [
  check('password')
    .notEmpty().withMessage('Password cannot be empty')
    .bail()
    .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[a-zA-Z0-9]{8,20}$/).withMessage('Password must contain at least eight characters, at least one number and both lower and uppercase letters and special characters'),
  check('email')
    .notEmpty().withMessage('Email cannot be empty')
    .bail()
    .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/).withMessage('Incorrect email format')
], (req, res) => {

  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    return res.json({ errors: errors.array()})
  }
  const values = [
    req.body.password,
    req.body.email
  ]

  const currentUser = users.find(user => user.email === req.body.email && user.password ===  req.body.password)

  if (currentUser) {
    req.session.user = currentUser
    return res.send("Success")
  } else {
    return res.json({ errors: [{ path: 'email', msg: 'Email and/or password is not correct' }, { path: 'password', msg: 'Email and/or password is not correct' }]})
  }
})

app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err)
    }
  })
  return res.json({ message: 'success' })
})

app.post('/send_form', [
  check('nickname')
    .notEmpty().withMessage('Nickname cannot be empty')
    .bail()
    .trim()
    .isLength({ min: 5 }).trim().withMessage('Name must have more than 5 characters'),
  check('age')
    .notEmpty().withMessage('Age cannot be empty')
    .bail()
    .matches(/^([1-9]|([1-9][0-9])|100)$/).withMessage('Age is incorrect'),
  check('patronus')
    .notEmpty().withMessage('Patronus cannot be empty')
    .bail()
    .matches(/[a-z]/i).withMessage('Should contain only latin symbols')
    .isLength({ min: 2 }).trim().withMessage('Patronus must have more than 5 characters')
], (req, res) => {

  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    return res.json({ errors: errors.array()})
  }

  return res.send("Success")
})

// UPLOADING FILE
app.use(bodyParser.raw({ type:'application/octet-stream', limit:'100mb' }))

app.use('/uploads', express.static('uploads'));

app.post('/upload', (req, res) => {
  const { name, currentChunkIndex, totalChunks } = req.query
  const firstChunk = parseInt(currentChunkIndex) === 0
  const lastChunk = parseInt(currentChunkIndex) === parseInt(totalChunks) - 1
  const ext = name.split('.').pop()
  const data = req.body.toString().split(',')[1]
  const buffer = new Buffer.from(data, 'base64')
  const tmpFilename = 'tmp_' + md5(name + req.ip) + '.' + ext
  if (firstChunk && fs.existsSync('./uploads/' + tmpFilename)) {
    fs.unlinkSync('./uploads/' + tmpFilename)
  }
  fs.appendFileSync('./uploads/' + tmpFilename, buffer)
  if (lastChunk) {
    const finalFilename = md5(Date.now()).substr(0, 6) + '.' + ext
    fs.renameSync('./uploads/' + tmpFilename, './uploads/' + finalFilename)
    res.json({ finalFilename })
  } else {
    res.json('ok')
  }
})

app.listen(9000, () => {
  console.log('Port listening')
})
