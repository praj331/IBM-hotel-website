//for autentication

const { required } = require("joi");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");
//note passport from lectures

const userSchema= new Schema({
    email: {
       type: string, 
       required: true,
    },
});

User.plugin(passportLocalMongoose); //note

module.exports = mongoose.model('User',userSchema);

//note configuration metods or stratiies

