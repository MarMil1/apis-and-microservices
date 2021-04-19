const mongoose = require('mongoose');

const ShortURL = mongoose.model('ShortURL', new mongoose.Schema({
    original_url: String,
    short_url: String
  }));

  module.exports = ShortURL;