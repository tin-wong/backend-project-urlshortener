require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
const dns = require('dns');


// Install and Set Up Mongoose
const mongoose = require('mongoose');
const { doesNotMatch } = require('assert');
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
Url.deleteMany({}, (error, mongooseDeleteResult) => {
    if(error) return console.error(error);
    console.log(mongooseDeleteResult);
});

let total = 0; 
async function mongooseCount(){
    const count = await Url.countDocuments({});
    return count;
};

async function documentsCount() {
    const count = await mongooseCount();
    total = count;
}
documentsCount()

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
        if(err) return console.error(err);
        const domainNameRegex = /(https?:\/\/)(.*)/ig;
        const domainNameMatch = domainNameRegex.exec(req.body.url);
        if(domainNameMatch === null){
            res.json({error: 'invalid url'});
            next()
        }
        console.log(domainNameMatch[2])
        dns.lookup(domainNameMatch[2], (err, records) => {
            if(err) return res.json({error: 'invalid url'});
            next();
        });
        if(doc === null){
            documentsCount();
            let newUrl = new Url({original_url: req.body.url, short_url: total + 1});
            newUrl.save((err, doc) => {
                if(err) return console.error(err);
            })
            res.json({original_url: req.body.url, short_url: total + 1});
            next();
        } else {
            res.json({original_url: doc.original_url, short_url: doc.short_url});
            next();
        }
    });
});

// 
app.get('/api/shorturl/:short_url', (req, res, next) => {
    const regex = /^\d*$/;
    if(regex.test(req.params.short_url)){
        Url.findOne({short_url: req.params.short_url}, (err, doc) => {
            if(err) return console.error(err);
            if(doc === null){
                res.json({error:"No short URL found for the given input"});
                next();
            } else {
                res.redirect(doc.original_url);
                next();
            }
        });
    } else {
        res.json({error: "Wrong format"});
        next();
    }
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});