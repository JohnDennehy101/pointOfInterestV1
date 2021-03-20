"use strict";

const Mongoose = require("mongoose");
const Schema = Mongoose.Schema;

const imageSchema = new Schema({
  title: String,
  imageUrl: String,
  monument: {
    type: Schema.Types.ObjectId,
    ref: "Monument",
  },
});

module.exports = Mongoose.model("Image", imageSchema);
