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
  coordinates: {
    latitude: Number,
    longitude: Number,
  },
  categories: [
    {
      type: Schema.Types.ObjectId,
      ref: "Category",
    },
  ],
  images: [
    {
      type: Schema.Types.ObjectId,
      ref: "Image",
    },
  ],
  province: String,
  county: String,
});

module.exports = Mongoose.model("Monument", monumentSchema);
