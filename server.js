const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const userRouter = require('./routes/user');
require('dotenv').config(); // Load environment variables
const cors = require('cors');



const app = express();
const port = 3000;
// app.use(cors({
//     origin: 'http://localhost:3000', // Allow requests from this origin
//     methods: ['GET', 'POST'], // Allow these HTTP methods
//     credentials: true // Allow cookies to be sent
//   }));
app.use(cors())
app.use(bodyParser.json());
app.use('/users', userRouter);

mongoose.connect(process.env.MONGO_URI);


app.get('/', async (req, res) => {
   
    res.status(200).json({ message: 'working' });

});


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
