const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const userRouter = require('./routes/user');
require('dotenv').config(); // Load environment variables


const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use('/users', userRouter);

mongoose.connect(process.env.MONGO_URI);



app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
