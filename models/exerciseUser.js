const mongoose = require('mongoose');

const ExerciseUser = mongoose.model('ExerciseUser', new mongoose.Schema({
    username: { type: String, unique: true },
    _id: String,
    log: [{
      date: String,
      duration: { type: Number, required: true },
      description: { type: String, required: true }
    }]
  }));

  module.exports = ExerciseUser;