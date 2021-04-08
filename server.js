require('dotenv').config();
// server.js
// where your node app starts

// init project
var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var shortId = require('shortid');

var app = express();
var port = process.env.PORT || 3000;

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// enable CORS (https://en.wikipedia.org/wiki/Cross-origin_resource_sharing)
// so that your API is remotely testable by FCC 
var cors = require('cors');
app.use(cors({optionsSuccessStatus: 200}));  // some legacy browsers choke on 204

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));
//app.use('/public', express.static(`${process.cwd()}/public`));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (req, res) {
  res.sendFile(__dirname + '/views/index.html');
});

// --------------- LIST PROJECTS ROUTES start ------------------------------
app.get("/timestamp", (req, res) => {
  res.sendFile(__dirname + '/views/timestamp.html');
});

app.get("/requestHeaderParserMicroservice", (req, res) => {
  res.sendFile(__dirname + '/views/requestHeaderParserMicroservice.html');
});

app.get("/urlShortener", (req, res) => {
  res.sendFile(__dirname + '/views/urlShortener.html');
});

// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});
// --------------- LIST PROJECTS ROUTES end --------------------------------


// ---------------------- TIMESTAMP start ----------------------------------
app.get("/api/timestamp", (req, res) => {
  const currentTime = new Date();
  res.json({
    "unix": currentTime.getTime(),
    "utc": currentTime.toUTCString()
  })
});

app.get("/api/timestamp/:date_string", (req, res) => {
  const dateString = req.params.date_string;
  const newDateStringFormat = new Date(dateString);
  const convertUnix = new Date(parseInt(dateString));

  if (/\d{10,}/g.test(dateString)) {
    res.json({
      "unix": convertUnix.getTime(),
      "utc": convertUnix.toUTCString()
    })
  }

  if (newDateStringFormat == "Invalid Date") {
    res.json({"error": "Invalid Date"});
  } else {
    res.json({
      "unix": newDateStringFormat.getTime(),
      "utc": newDateStringFormat.toUTCString()
    })
  }
});
// ---------------------- TIMESTAMP end ----------------------------------

// ---------------------- HEADER PARSER start ----------------------------
app.get("/api/whoami", (req, res) => {
  res.json({
    "ipaddress": req.socket.remoteAddress,
    "language": req.headers["accept-language"],
    "software": req.headers["user-agent"]
  });
});

// ---------------------- HEADER PARSER end ------------------------------

// ---------------------- URL SHORTENER start ----------------------------
// body-parser deprecated and replaced with express
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const ShortURL = mongoose.model('ShortURL', new mongoose.Schema({
  original_url: String,
  short_url: String
}));

app.post("/api/shorturl/new/", function (req, res) {
  const urlFromUser = req.body.url;
  const shortenedUrl = shortId.generate();
  
  if (!/^(http:\/\/)|(\.com)|(\.org)|(\.net)$/g.test(urlFromUser)) {
    res.json({
      "error": "invalid url"
    });
  } else {
      const newUrl = new ShortURL({
        "original_url": urlFromUser,
        "short_url": shortenedUrl
      });

      newUrl.save((err, doc) => {
        if (err) return console.log(err);

        res.json({
          "original_url": newUrl.original_url,
          "short_url": newUrl.short_url
        });
      });
  }
});

app.get("/api/shorturl/:short_url", (req, res) => {
  let generatedShortUrl = req.params.short_url;
  ShortURL.find({ short_url: generatedShortUrl }).then((urls) => {
    let redirectedUrl = urls[0];
    res.redirect(redirectedUrl.original_url);
  });
});

// ---------------------- URL SHORTENER end ----------------------------

// listen for requests :)
var listener = app.listen(port, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
