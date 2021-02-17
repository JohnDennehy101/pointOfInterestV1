"use strict";

const Donation = require("../models/donations");
const User = require("../models/user");

const Donations = {
  home: {
    handler: function (request, h) {
      return h.view("home", { title: "Make a Donation" });
    },
  },
  report: {
    handler: async function (request, h) {
      const donations = await Donation.find().populate("donor").lean();
      return h.view("report", {
        title: "Donations to Date",
        donations: donations,
      });
    },
  },
  donate: {
    handler: async function (request, h) {
      const data = request.payload;
      const id = request.auth.credentials.id;
      const user = await User.findById(id);
      const newDonation = new Donation({
        amount: data.amount,
        method: data.method,
        donor: user._id
      });
      await newDonation.save();
      return h.redirect("/report");
    },
  },
};

module.exports = Donations;