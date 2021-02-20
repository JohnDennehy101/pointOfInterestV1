"use strict";

const Monument = require("../models/monuments");
const User = require("../models/user");

const Monuments = {
  home: {
    handler: function (request, h) {
      return h.view("home", { title: "Add a monument" });
    },
  },
  report: {
    handler: async function (request, h) {
      const monuments = await Monument.find().populate("user").lean();
      return h.view("report", {
        title: "Monuments added to Date",
        monuments: monuments,
      });
    },
  },
  addMonument: {
    handler: async function (request, h) {
      const data = request.payload;
      const id = request.auth.credentials.id;
      const user = await User.findById(id);
      const newMonument = new Monument({
        title: data.title,
        description: data.description,
        user: user._id
      });
      await newMonument.save();
      return h.redirect("/report");
    },
  },
};

module.exports = Monuments;