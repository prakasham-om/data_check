const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const connectDB = require('./config/mongo');
const companyRoutes = require('./routes/companyRoutes');
//const sheetRoutes = require('./routes/sheetRoters'); // Corrected import path
const e = require('express');

const app = express();

app.use(express.json());

app.use(cors({
   origin: [
    "https://data-check-1.onrender.com",  // deployed frontend
    "http://localhost:5173",// local dev frontend
      "https://data-check-dusky.vercel.app"
  ]
}));


// const corsOptions = {
//   origin: function (origin, callback) {
//     // allow requests with no origin (like Postman)
//     if (!origin) return callback(null, true);
//     if (allowedOrigins.indexOf(origin) === -1) {
//       const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
//       return callback(new Error(msg), false);
//     }
//     return callback(null, true);
//   },
//   credentials: true, // allow cookies
// };

// app.use(cors(corsOptions));


// API routes
app.use('/api/company', companyRoutes);
//app.use('/api/sheet', sheetRoutes);
app.use('/api/csv', require('./routes/csvRoutes'));
// Server port
const PORT = 5000;

// Connect to MongoDB and start server
connectDB()
  .then(() => {
    app.listen(PORT, () => console.log('Server listening on port', PORT));
  })
  .catch(err => console.error('MongoDB connection error:', err));
