require('dotenv').config();

// init project
const express = require('express');
const mongoose = require('mongoose');
const shortId = require('shortid');
const ShortURL = require('./models/shorturl');
const ExerciseUser = require('./models/exerciseUser');


const app = express();
const port = process.env.PORT || 3000;

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then( () => {console.log('Database Connected Successfully!')} )
  .catch( (error) => {console.log(error)} );

// enable CORS (https://en.wikipedia.org/wiki/Cross-origin_resource_sharing)
// so that your API is remotely testable by FCC 
const cors = require('cors');
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

app.get("/exerciseTracker", (req, res) => {
  res.sendFile(__dirname + '/views/exerciseTracker.html');
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

app.post("/api/shorturl/new/", function (req, res) {
  const urlFromUser = req.body.url;
  const shortenedUrl = shortId.generate();
  const regex = /(http:\/\/)|(https:\/\/)[w]{3}\.[a-z]{1,}\.[a-z]{2,3}/g;

  const newUrl = new ShortURL({
    "original_url": urlFromUser,
    "short_url": shortenedUrl
  });
  
  // check in web address is valid
  if (!regex.test(urlFromUser)) {
    res.json({
      "error": "invalid url"
    });
  } else {
    // if valid check if it exists in the db 
    ShortURL.findOne({ original_url: urlFromUser }, (err, webAddress) => {
      if (err) {
        res.send("There was an error. Try again.");
        return;
      }

      // if address exists show its link and short id from db
      if (webAddress !== null) {
        res.json({
          "new_url": false,
          "original_url": webAddress.original_url,
          "short_url": webAddress.short_url
        });

      // if address doesn't exist save short id and address to db and show it
      } else {
        newUrl.save((err, doc) => {
          if (err) return console.log(err);

          res.json({
            "new_url": true,
            "original_url": newUrl.original_url,
            "short_url": newUrl.short_url
          });
        });
      }
    });
  }
});

app.get("/api/shorturl/:short_url", (req, res) => {
  let generatedShortUrl = req.params.short_url;

  // find short id url and redirect to original url
  ShortURL.find({ short_url: generatedShortUrl }).then((urls) => {
    let redirectedUrl = urls[0];
    res.redirect(redirectedUrl.original_url);
  });
});

// ---------------------- URL SHORTENER end ----------------------------

// ---------------------- EXERCISE TRACKER start ----------------------------

// post username and create id in mongodb
app.post("/api/exercise/new-user/", (req, res) => {
  const userName = req.body.username;
  const userIdMongoose = mongoose.Types.ObjectId(); 
  
  const newUser = new ExerciseUser ({
    username: userName,
    _id: userIdMongoose
  });
  
    // check if user already exists, if not create new user
  ExerciseUser.findOne({ username: userName }, (err, ifUserExists) => {
    if (err) return console.log(err);

    if (ifUserExists !== null) {
      res.send("Username already taken");
    } else {
    // save new username and id to mongodb
      newUser.save((err, doc) => {
        if (err) return console.log(err);
        console.log("Username Created Successfully!");
        res.json({
          "username": newUser.username,
          "_id": newUser["_id"]
        });
      });
    }
  });
});

// get all the users from the database
app.get("/api/exercise/users", (req, res) => {
  ExerciseUser.find({}, (err, newUsers) => {
    let users = [];

    if (err) return console.log(err);
    console.log("User List Displayed Successfully!");
    newUsers.forEach(user => 
      users.push({
        "_id": user.id,
        "username": user.username
      })
    );
      res.json(users);
  });
});

// add id, activity, duration and description to mongodb
app.post("/api/exercise/add", (req, res) => {
  const userIdPosted = req.body.userId;
  const userDescriptionPosted = req.body.description;
  const userDurationPosted = req.body.duration;
  let userDatePosted = req.body.date;

  if (userDatePosted !== "") {
    userDatePosted = new Date(req.body.date).toDateString();
  } else {
    userDatePosted = new Date().toDateString();
  } 

  const exerciseLog = {
    date: userDatePosted,
    description: userDescriptionPosted,
    duration: parseInt(userDurationPosted)
  };
  
  ExerciseUser.findOne({ _id: userIdPosted }, (err, user) => {
    if (err) console.log(err);

    if (user === null) {
      res.send("Unknown UserId");
      return;
    }

    const username = user.username;
    const userId = user.id;
    
    user.log.push(exerciseLog);

    user.save((err, doc) => {
      if (err) { 
        let start = err.message.search("Path");
        let stop = err.message.search("required");
        return res.send(err.message.slice(start, stop + 8));
      }
      console.log("User Log Added Successfully!");
      res.json({
        "_id": userId,
        "username": username,
        "date": exerciseLog.date,
        "duration": exerciseLog.duration,
        "description": exerciseLog.description
      });
    });
  });
});

// check user log by passing userID (ex. /api/exercise/log?userId=1234)
// or limit date and number of logs shown (ex. /api/exercise/log?userId=1234&from=...&to=...&limit=...) 
app.get("/api/exercise/log/", (req, res) => {
  const userId = req.query.userId;
  const fromDate = req.query.from;
  const fromQueryDate = Date.parse(fromDate);
  const toDate = req.query.to;
  const toQueryDate = Date.parse(toDate);
  const limit = req.query.limit;

  if (userId === undefined || userId === "") {
    res.send("Unknown userId");
    return;
  }
  
  // check if the parameters are in correct format
  if (fromDate !== undefined && isNaN(fromQueryDate) === true) {
    res.send("Invalid 'from' parameter");
    return;
  } else if (toDate !== undefined && isNaN(toQueryDate) === true) {
    res.send("Invalid 'to' parameter");
    return;
  } else if (limit !== undefined && isNaN(limit) === true) {
    res.send("Invalid 'limit' parameter");
    return;
  } else {

    ExerciseUser.findOne({ _id: userId }, (err, userLogs) => {
      let filter = [];
      let logsArr = [];
      if (err || !userLogs) {
        res.send("Error in username search");
        return;
      } else {
        console.log("User Log Shown Successfully!");

        userLogs.log.forEach(entry => {
          let unixLogDate = Date.parse(entry.date);
          log = {
            description: entry.description,
            duration: entry.duration,
            date: entry.date    
          };

          // check if to and from parameters exist
          if (fromDate !== undefined && toDate !== undefined) {
            if (unixLogDate >= fromQueryDate && unixLogDate <= toQueryDate) {
              logsArr.push(log);
            }
          // check if only from parameter exists
          } else if (fromDate !== undefined) {
              if (unixLogDate >= fromQueryDate) {
                logsArr.push(log);
            }
          // if neither of to or from parameters exist push all user logs
          } else {
            logsArr.push(log);
          }
        });

        // check if limit exists (if it does limit the logs array to be shown)
        if (limit !== undefined) {
          logsArr = logsArr.slice(0, limit);
        }

        res.json({
          _id: userLogs.id,
          username: userLogs.username,
          count: logsArr.length,
          log: logsArr
        });
      }
    });
  }
});

// ---------------------- EXERCISE TRACKER end ----------------------------

// listen for requests :)
const listener = app.listen(port, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
