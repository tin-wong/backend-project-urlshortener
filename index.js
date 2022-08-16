require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
const dns = require('dns');


// Install and Set Up Mongoose
const mongoose = require('mongoose');
const { doesNotMatch } = require('assert');
const { exit } = require('process');
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
//Url.deleteMany({}, (error, mongooseDeleteResult) => {
//     if(error) return console.error(error);
//     console.log(mongooseDeleteResult);
// });

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
    console.log('/api/shorturl route')
    const domainNameRegex = /(https?:\/\/)(.*)/ig;
    const domainNameMatch = domainNameRegex.exec(req.body.url);
    if(domainNameMatch === null){
        // Use return instead of next() so it won't continue to domainNameMatch[2]
        console.log('domainNameMatch test')
        return res.json({error: 'invalid url'});
    }

    dns.lookup(domainNameMatch[2], (err, address, family) => {
        console.log(domainNameMatch[2]);
        console.log(address);
        if(err) return res.json({error: "invalid URL"});
        Url.findOne({original_url: req.body.url}, (err, doc) => {
            if(err) return console.error(err);
            if(doc === null){
                documentsCount();
                let newUrl = new Url({original_url: req.body.url, short_url: total + 1});
                newUrl.save((err, doc) => {
                    if(err) return console.error(err);
                })
                return res.json({original_url: req.body.url, short_url: total + 1});
            } else {
                return res.json({original_url: doc.original_url, short_url: doc.short_url});
            }
    })
    
        // async function getAddr(href) {
        //     console.log("Check =>", href);
        //     let resVal = undefined;
        //     await dns.lookup( new URL(href).host , (err, address, family) => {
        //       return resVal = (err) ? false : address;
        //     });
          
        //     await new Promise((resolve, reject) => setTimeout(resolve, 1000));
        //     console.log("Check =>", href, "is host Good? [", resVal, "]");
        //     return resVal;
        // }

        // getAddr(domainNameMatch[2]);

        // const dnsLookup = new Promise((resolve, reject) => {
        //     dns.lookup(domainNameMatch[2], (err, records, family) => {
        //         if(err) reject(err);
        //         resolve(records);
        //     });
        // });
        // dnsLookup.then(res => {
        //     console.log(res)
        //     if(res === undefined){
        //         console.log(res)
        //     }
        // })
        // .catch(err => console.log(err));
        
        // let dnsValue = undefined;
        // dns.lookup(domainNameMatch[2], (err, records) => {
        //     if(records === undefined){
        //         returnInvalidUrl(records);
        //     }
        // });
        
        // function returnInvalidUrl(address){
        //     dnsValue = address;
        // }

        // console.log(dnsValue);


    });
});

// 
app.get('/api/shorturl/:short_url', (req, res, next) => {
    console.log('/api/shorturl/:short_url route')
    const regex = /^\d*$/;
    if(regex.test(req.params.short_url)){
        console.log('test1')
        Url.findOne({short_url: req.params.short_url}, (err, doc) => {
            console.log('test2')
            if(err) return console.error(err);
            console.log('test3')
            if(doc === null){
                console.log('test4')
                return res.json({error:"No short URL found for the given input"});
            } else {
                console.log('test5')
                return res.redirect(doc.original_url);
            }
        });
    } else {
        console.log('test6')
        return res.json({error: "Wrong format"});
    }
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});