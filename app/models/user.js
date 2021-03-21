"use strict";

const Mongoose = require("mongoose");
const Schema = Mongoose.Schema;
const Boom = require("@hapi/boom");

const userSchema = new Schema({
  firstName: String,
  lastName: String,
  email: String,
  password: String,
  lastUpdated: Date,
  lastLogin: String,
  userType: String,
  numberOfRecords: Number,
});

userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email });
};

userSchema.methods.comparePassword = function (userPassword) {
  const isMatch = this.password === userPassword;
  if (!isMatch) {
    throw Boom.unauthorized("Password mismatch");
  }
  return this;
};

module.exports = Mongoose.model("User", userSchema);
