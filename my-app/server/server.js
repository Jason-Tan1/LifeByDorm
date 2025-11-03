//Setting Up Express and Cors
const express = require('express')
const cors = require('cors') //Used for security reasons 
const app = express()

app.use(cors())

app.use(express.json())

const users = []

//Route for Testing Purposes
app.get('/users', (req, res) => {
  res.json(users)
})

app.post('/users', (req, res) =>{
  const user =  {name: req.body.name, password: req.body.password }
  users.push(user)
  res.status(201).send()
})

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000')
})