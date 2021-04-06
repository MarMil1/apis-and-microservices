// server.js
// where your node app starts

// init project
var express = require('express');
var app = express();
var port = process.env.PORT || 3000;

// enable CORS (https://en.wikipedia.org/wiki/Cross-origin_resource_sharing)
// so that your API is remotely testable by FCC 
var cors = require('cors');
app.use(cors({optionsSuccessStatus: 200}));  // some legacy browsers choke on 204

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

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

// listen for requests :)
var listener = app.listen(port, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
