"use strict";

const Mongoose = require("mongoose");
const Schema = Mongoose.Schema;

const monumentSchema = new Schema({
  title: String,
  description: String,
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  image: String,
  province: String,
  county: String
});

module.exports = Mongoose.model("Monument", monumentSchema);
