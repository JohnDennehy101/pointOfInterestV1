"use strict";
const User = require("../models/user");
const Joi = require("@hapi/joi");


const Accounts = {
  index: {
    auth: false,
    handler: function (request, h) {
      return h.view("main", { title: "Welcome to Donations" });
    },
  },
  showSignup: {
    auth: false,
    handler: function (request, h) {
      return h.view("signup", { title: "Sign up for donations" });
    },
  },
  signup: {
    auth: false,

    validate: {
      payload: {
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        email: Joi.string().email().required(),
        password: Joi.string().required(),
      },
      failAction: function (request, h, error) {
        return h
          .view("signup", {
            title: "Sign up error",
            errors: error.details,
          })
          .takeover()
          .code(400);
      },
    },
    handler: async function (request, h) {
      const { email } = request.payload;
      try {
        let checkEmailInUse = await User.findByEmail(email);
        if (checkEmailInUse) {
          const message = "Email address already in use";
          throw Boom.unauthorized(message);
        }

        const payload = request.payload;
        const newUser = new User({
          firstName: payload.firstName,
          lastName: payload.lastName,
          email: payload.email,
          password: payload.password,
          lastUpdated: null,
        });
        const user = await newUser.save();
        request.cookieAuth.set({ id: user.id });
        return h.redirect("/home");
      } catch (err) {
        return h.view("signup", { errors: [{ message: err.message }] });
      }
    },
  },
  showSettings: {
    handler: async function (request, h) {
      console.log("showing settings page");
      let showUpdatedNotification;
      let now = new Date();
      const id = request.auth.credentials.id;
      const user = await User.findById(id).lean();

      if (user) {
        if (user.lastUpdated !== null) {
          if (now.getTime() - 2000 < user.lastUpdated) {
            showUpdatedNotification = "true";
          } else {
            showUpdatedNotification = "false";
          }
        }
      }

      console.log(showUpdatedNotification);

      return h.view("settings", {
        title: "User Settings",
        user: user,
        successNotification: showUpdatedNotification,
        lastUpdated: user.lastUpdated,
      });
    },
  },
  updateSettings: {
    validate: {
      payload: {
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        email: Joi.string().email().required(),
        password: Joi.string().required(),
      },
      failAction: function (request, h, error) {
        return h
          .view("settings", {
            title: "Sign up error",
            errors: error.details,
          })
          .takeover()
          .code(400);
      },
    },
    handler: async function (request, h) {
      const userEdit = request.payload;
      const id = request.auth.credentials.id;
      const user = await User.findById(id);
      user.firstName = userEdit.firstName;
      user.lastName = userEdit.lastName;
      user.email = userEdit.email;
      user.password = userEdit.password;
      let now = new Date();
      user.lastUpdated = now.getTime();
      await user.save();
      console.log("Updated settings");

      console.log(now.getTime());
      return h.redirect("/settings");
    },
  },
  deleteAccount: {
    handler: async function (request, h) {
      let userId = request.params.id;
      await User.deleteOne({ _id: userId });
      //request.cookieAuth.clear();
      //return h.view("signup", {accountJustDeleted: 'true'})
      return h.redirect("/accountDeleted");
    },
  },
  accountDeleted: {
    handler: function (request, h) {
      request.cookieAuth.clear();
      return h.view("signup", { accountJustDeleted: "true" });
    },
  },
  showLogin: {
    auth: false,
    handler: function (request, h) {
      return h.view("login", { title: "Login to Donations" });
    },
  },
  login: {
    auth: false,
    handler: async function (request, h) {
      const { email, password } = request.payload;
      try {
        let user = await User.findByEmail(email);
        if (!user) {
          const message = "Email address is not registered";
          throw Boom.unauthorized(message);
        }
        user.comparePassword(password);
        request.cookieAuth.set({ id: user.id });
        return h.redirect("/home");
      } catch (err) {
        return h.view("login", { errors: [{ message: err.message }] });
      }
    },
  },
  logout: {
    handler: function (request, h) {
      request.cookieAuth.clear();
      return h.redirect("/");
    },
  },
};

module.exports = Accounts;
