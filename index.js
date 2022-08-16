require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
const dns = require('dns');

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

// Delete all exisiting documents in the database
Url.deleteMany({}, (error, mongooseDeleteResult) => {
    if(error) return console.error(error);
    console.log(mongooseDeleteResult);
});

// Count the number of exisiting documents. Use async and await to wait for the result before proceeding. 
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

// Return a JSON reponse from POST /api/shorturl route 
app.post('/api/shorturl', (req, res, next) => {
    // Use regex to get the domain name from the URL. Strip http prefix and the / file directory out of the URL. 
    const domainNameRegex = /(https?:\/\/)(([a-z]|[A-Z]|[0-9]|\-|\.)*)/ig;
    const domainNameMatch = domainNameRegex.exec(req.body.url);
    if(domainNameMatch === null){
        // Use return instead of next() so it won't continue to domainNameMatch[2]
        return res.json({error: 'invalid url'});
    }
    // Use dns.lookup to validate the domain name. It has to be declared last because
    // it can't be returned/escaped from the rest of the codes in the function.
    dns.lookup(domainNameMatch[2], (err, address, family) => {
        if(err) return res.json({error: "invalid URL"});
        // Use mongoose to find a document with {original_url: req.body.url}
        Url.findOne({original_url: req.body.url}, (err, doc) => {
            if(err) return console.error(err);
            // If not found, save it as a new document and return it as a JSON response. 
            if(doc === null){
                documentsCount();
                let newUrl = new Url({original_url: req.body.url, short_url: total + 1});
                newUrl.save((err, doc) => {
                    if(err) return console.error(err);
                })
                return res.json({original_url: req.body.url, short_url: total + 1});
            } else {
                // If found, return the result as a JSON response. 
                return res.json({original_url: doc.original_url, short_url: doc.short_url});
            }
        })
    });
});

// Redirect to a website with from GET /api/shorturl/:short_url route
app.get('/api/shorturl/:short_url', (req, res, next) => {
    // Use regex to check if req.params.short_url is a number
    const regex = /^\d*$/;
    if(regex.test(req.params.short_url)){
        // Use mongoose to find req.params.short_url
        Url.findOne({short_url: req.params.short_url}, (err, doc) => {
            if(err) return console.error(err);
            if(doc === null){
                // If not found, return an error.
                return res.json({error: "No short URL found for the given input"});
            } else {
                // If found, redirect to the original_url using the short_url reference 
                return res.redirect(doc.original_url);
            }
        });
    } else {
        // If req.params.short_url is not a number, return "Wrong format"
        return res.json({error: "Wrong format"});
    }
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});