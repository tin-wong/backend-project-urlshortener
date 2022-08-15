require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');


// Install and Set Up Mongoose
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true });

// Create a Model
const urlSchema = new mongoose.Schema({
    original_url:{
        type: String,
        required: true
    },
    short_url: Number
})

const Url = mongoose.model('Url', urlSchema);

//Delete all Documents
// Url.deleteMany({}, (error, mongooseDeleteResult) => {
//     if(error) return console.error(error);
//     console.log(mongooseDeleteResult);
// });

let url1 = new Url({original_url: "http://mezmo.com", short_url: 1});
url1.save((err, doc) => {
    if(err) return console.error(err);
    console.log(doc);
})

let documentsCount = Url.countDocuments({}, (err, count) => {
    if(err) return console.error(err);
    console.log(count);
});


// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

// Use body-parser to Parse POST Requests
app.use(bodyParser.urlencoded({extended: false}));
// This allow parsing JSON data sent in the POST request
app.use(bodyParser.json());

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

// 
app.post('/api/shorturl', (req, res, next) => {
    Url.findOne({original_url: req.body.url}, (err, doc) => {
        if(err) { console.log(err)};
        console.log(doc.short_url);
    });
    res.json({original_url: req.body.url, short_url: req.body});
    next();
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});