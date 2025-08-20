require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const connectDB = require('./config/mongo')
const companyRoutes = require('./routes/companyRoutes')

const app = express()

// Array of allowed URLs
const allowedOrigins = [
  'https://data-check.onrender.com/',
  'http://localhost:5173',
  'https://your-other-frontend.com'
]

const corsOptions = {
  origin: function (origin, callback) {
    // allow requests with no origin (like Postman)
    if (!origin) return callback(null, true)
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`
      return callback(new Error(msg), false)
    }
    return callback(null, true)
  },
  credentials: true, // if you need to send cookies
}

app.use(cors(corsOptions))
app.use(bodyParser.json())
app.use('/api/company', companyRoutes)

const PORT = process.env.PORT || 5000

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log('Server listening on', PORT))
  })
  .catch(err => console.error(err))
