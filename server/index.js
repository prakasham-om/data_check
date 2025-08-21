require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const connectDB = require('./config/mongo')
const companyRoutes = require('./routes/companyRoutes')

const app = express()

// Array of allowed URLs

app.use(
  cors({
    origin: ["https://data-check-qh8f.vercel.app"], // your frontend domain
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);


app.use(bodyParser.json())
app.get("/", (req, res) => res.send("✅ Google Sheets API is running"));


app.use('/api/company', companyRoutes)

const PORT = process.env.PORT || 5000

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log('Server listening on', PORT))
  })
  .catch(err => console.error(err))
