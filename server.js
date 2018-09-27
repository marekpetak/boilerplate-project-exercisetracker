const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const shortid = require('shortid');

const cors = require('cors')

const mongoose = require('mongoose')
mongoose.connect(process.env.MLAB_URI || 'mongodb://localhost/exercise-track' )
const userSchema = mongoose.Schema({
  username: String,
  excersizes: [
    {
      description: {
        type: String,
        required: true
      },
      duration: {
        type: Number,
        required: true
      },
      date: Date
    }
  ]
});
var User = mongoose.model('User', userSchema);

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// POST create user
app.post('/api/exercise/new-user', (req, res) => {
  // body: username=marek return username & _id
  User.findOne({username: req.body.username}, (error, data) => {
    if (error) {
      console.log(error);
    } else {
      if (data) { 
        res.json({'warning': 'User already exists'});  
      } else {
       User.create({username: req.body.username}, (error, data) => { 
         if (error) {
           console.log(error);
         } else {
           res.json(data);
         }
       });
      }
    }
  });
});

// POST add excersise to user by _id
// username	"marek"
// description	"swimming"
// duration	30
// _id	"Bky07uLtQ"
// date	"Fri Sep 05 2008"
app.post('/api/exercise/add', (req, res) => {
  User.findById(req.body.userId, (error, data) => {
    if (error) {
     console.log(error); 
    } else {
      console.log('body', req.body);
      console.log(data);
      data.excersizes.push({description: req.body.description, duration: req.body.duration, date: new Date(req.body.date) || new Date() }); 
      data.save((error, data) => {
       if (error) {
         console.log(error);
       } else {
         res.json(data);
       }
     });
    }
  });
});

// GET get all users
app.get('/api/exercise/users', (req, res) => {
  User.find({}, (error, data) => {
    if (error) {
      console.log(error);
    } else {
      res.json(data);
    }
  })
});

// GET user excersize log
app.get('/api/exercise/log', (req, res) => {
  User.findById(req.query.userId).exec((error, data) => {
    if (error) {
      console.log(error);
    } else {
      const resObj = {
        "_id": data._id,
        "username": data.username
      }
      
      let result;
      if (req.query.from) {
        resObj['from'] = new Date(req.query.from);
        result = data.excersizes.filter((item) => {
          return (new Date(item.date)) > (new Date(req.query.from));
        });
        
        data.excersizes = result;
      }
      
      if (req.query.to) {
        resObj['to'] = new Date(req.query.to);
        result = data.excersizes.filter((item) => {
          return (new Date(item.date)) < (new Date(req.query.to));
        });
        
        data.excersizes = result;
      }
      
      resObj['count'] = data.excersizes.length;
      resObj['excersizes'] = data.excersizes;
      
      
      res.json(resObj);
    }
  });
  
});



// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
