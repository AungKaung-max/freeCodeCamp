const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
require('dotenv').config()

const userSchema = mongoose.Schema({
  username: String
})

const exercisesSchema = mongoose.Schema({
  userId: String,
  description: String,
  duration: Number,
  date: {
    type:Date,
    default:Date.now()
  }
})

const User = mongoose.model('User', userSchema);
const Exercise = mongoose.model('Exercise', exercisesSchema);

mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Mongoose connected successfully"))
  .catch((err) => console.log("Mongoose connection error!", err)
  )

app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: false }))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users', async (req, res) => {
  const { username } = req.body;
  const user = await User.create({ username });
  return res.json(user)
})

app.get('/api/users', async (req, res) => {
  const user = await User.find();
  return res.json(user);
})

app.post('/api/users/:_id/exercises', async (req, res) => {
  const { description, duration, date } = req.body;
  const { _id } = req.params;
  const user = await User.findOne({ _id });
  const exercise = await Exercise.create({ userId: _id, description, duration, date: date });
  const responseData = {
    username: user.username,
    _id: user._id,
    description: exercise.description,
    duration: exercise.duration,
    date: new Date(exercise.date).toDateString(),
  };

  return res.json(responseData);
})

app.get('/api/users/:_id/logs', async (req, res) => {
  const { from, to, limit } = req.query;

  const { _id } = req.params;
  const user = await User.findById(_id);
  let query = { userId: _id };
  if (from || to) {
    query.date = {}
    if (from) {
      query.date.$gte = new Date(from);
    }
    if (to) {
      query.date.$lte = new Date(to);
    }
  }
  const exercise = await Exercise.find(query)
    .select('description date duration -_id')
    .limit(limit ? parseInt(limit) : 0);
  console.log(exercise);

  const log = exercise.map((exercise) => ({
    description: exercise.description,
    duration: exercise.duration,
    date: new Date(exercise.date).toDateString()
  }));

  const responseData = {
    username: user.username,
    _id: user._id,
    count: log.length,
    log
  };
  return res.json(responseData)
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
