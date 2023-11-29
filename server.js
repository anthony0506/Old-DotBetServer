const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const https = require('https');
require('dotenv').config();
const fs = require('fs');
var bodyParser = require('body-parser');
const path = require("path");

const app = express();

app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
// app.get("/", express.static(path.join(__dirname, "./public")));
app.use(express.static("public"));

app.use('/api/users', require('./routes/api/users'));
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/game', require('./routes/api/game'));

// Connect to MongoDB
// mongoose.connect('mongodb://127.0.0.1/dotbet')
//   .then(() => console.log('Connected to MongoDB'))
//   .catch(err => console.error('Failed to connect to MongoDB', err));
mongoose.connect(`mongodb+srv://sunshine950101:${process.env.MONGODB_PASSWORD}@dotbet.yhwdbbo.mongodb.net/dotbet?retryWrites=true&w=majority`)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Failed to connect to MongoDB', err));

// Start the server
// const port = 3306;
// app.listen(port, async () => {
//   console.log(`Server started on port ${port}`);
// });

app.get('/', (req, res) => {
  res.send("DotBet Backend Server is running properly.");
});
https
  .createServer(
    // Provide the private and public key to the server by reading each
    // file's content with the readFileSync() method.
    {
      key: fs.readFileSync("../privkey1.pem"),
      cert: fs.readFileSync("../cert1.pem"),
    },
    app
  )
  .listen(443, () => {
    console.log("serever is runing at port 443");
  });

