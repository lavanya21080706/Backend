const express = require('express');
const app = express();
const authRouter = require('./routes/auth');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const db = require('./config/db');
const cors = require('cors')
const boardRouter = require('./routes/boardDetails.js')


// Load environment variables
dotenv.config();


const port = process.env.PORT

app.use(express.json());
app.use(cors())

// Register auth routes
app.use('/api/ver1/auth', authRouter);
app.use("/api/ver1/boardDetails", boardRouter);

//health api
app.get('/health', (req, res) => {
    res.json(
        {
            "status": "health check successful"
        })
});

// Start server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
