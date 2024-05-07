const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config();
const bodyParser = require('body-parser')
const mongoose = require('mongoose');
const shortid = require('shortid');

app.use(cors());
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})

let Schema = mongoose.Schema;

const exerciseSchema = new mongoose.Schema({
  userId: {
    type: Schema.Types.ObjectId
  },
  username: String,
  description: {type: String, required: true},
  duration: {type: Number, required: true},
  date: String,
});

const userSchema = new mongoose.Schema({
  username: String,
});

let User = mongoose.model('User', userSchema);
let Exercise = mongoose.model('Exercise', exerciseSchema);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users', async (req, res) => {
  let newUsername = req.body.username;
  let newUser = new User({username: newUsername});
  try{
    let userSaved = await newUser.save();
    res.json({
      username: userSaved.username,
      _id: userSaved._id,
    })
  } catch (err) {
		console.error(err);
		return res.json({ message: 'User creation failed!' });

  }
});

app.get('/api/users', async (req, res) => {
  try {
    let userFound = await User.find();
    if (userFound) {
      return res.json(userFound);
    }
  } catch (err) {
    console.error(err);
  }
});

app.post('/api/users/:_id/exercises', async (req, res) => {
  let userId = req.params._id;
  let description = req.body.description;
  let date = req.body.date;
  let duration = req.body.duration;

  if (!date) date = new Date().toISOString().substring(0, 10);
  try {
    let userFoundInDb = await User.findById({_id: userId});
    console.log("findUserState: ", userFoundInDb);
    let newExercise = new Exercise({
      userId: userFoundInDb._id,
      username: userFoundInDb.username,
      description: description,
      duration: duration,
      date: date,
    });
    let saveExState = await newExercise.save();
    console.log("saveExState: ", saveExState);
      return res.json({
				username: userFoundInDb.username,
				description: newExercise.description,
				duration: newExercise.duration,
				date: new Date(newExercise.date).toDateString(),
				_id: userFoundInDb._id,
			});
  } catch (err) {
    console.error(err);
  }
});

app.get('/api/users/:_id/logs', async (req, res) => {
  let queryId = new mongoose.Types.ObjectId(req.params._id);
  const from = req.query.from || new Date(0).toISOString().substring(0, 10);
	const to =
		req.query.to || new Date(Date.now()).toISOString().substring(0, 10);
	const limit = Number(req.query.limit) || 0;
  try {
    let user = await User.findById(queryId).exec();
    console.log("user: ", user)
    let exercises = await Exercise.find({userId: queryId})
    .select('description duration date')
    .limit(limit)
    .exec();

    console.log("ex: ", exercises);

    let parsedDatesLog = exercises.map((exercise) => {
      return {
        description: exercise.description,
        duration: exercise.duration,
        date: new Date(exercise.date).toDateString(),
      };
    });

    return res.json({
      _id: user._id,
      username: user.username,
      count: parsedDatesLog.length,
      log: parsedDatesLog,
    });
  } catch (err) {
    console.error(err);
    return res.json({message: err});
  }
  
});




const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
