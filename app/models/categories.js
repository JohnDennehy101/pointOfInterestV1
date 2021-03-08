"use strict";

const Mongoose = require("mongoose");
const Schema = Mongoose.Schema;

const categorySchema = new Schema({
  title: String,
  monuments: [
    {
      type: Schema.Types.ObjectId,
      ref: "Monument",
    },
  ],
});

module.exports = Mongoose.model("Category", categorySchema);
