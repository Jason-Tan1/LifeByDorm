require('dotenv').config()
console.log('Loaded secret:', process.env.ACCESS_TOKEN_SECRET ? '✅ Loaded' : '❌ Missing')

const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken') 

const app = express()

app.use(cors())
app.use(express.json())

const posts = [
  { username: 'Jason', title: 'Post 1' },
  { username: 'Joey', title: 'Post 2' }
]

app.get('/posts', (req, res) => {
  res.json(posts)
})

app.post('/login', (req, res) => {
  const username  = req.body.username
  const user = { name: username }
  const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET)

  res.json({ accessToken: accessToken })
})

app.listen(3000)


/* This is for TEST PURPOSES
const users = []
//Route for Testing Purposes
app.get('/users', (req, res) => {
  res.json(users)
})


app.post('/users', async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10)
    const user = { name: req.body.name, password: hashedPassword }
    users.push(user)
    res.status(201).send()
  } catch {
    res.status(500).send()
  }
})

app.post('/users/login', async (req, res) => {
  const user = users.find(user => user.name === req.body.name)
  if (user == null) {
    return res.status(400).send('Cannot find user')
  }
  try {
    if (await bcrypt.compare(req.body.password, user.password)) {
      res.send('Success')
    } else {
      res.send('Not Allowed')
    }
  } catch {
    res.status(500).send()
  }
})

app.listen(3000)
*/