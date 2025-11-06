const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password:String,
}, {
  // Add this options object
  timestamps: true 
});


const Event = mongoose.model('User', userSchema);
module.exports=Event;