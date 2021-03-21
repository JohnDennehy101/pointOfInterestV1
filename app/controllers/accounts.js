"use strict";
const User = require("../models/user");
const Category = require("../models/categories");
const Monument = require("../models/monuments");
const Joi = require("@hapi/joi");
const DateFunctionality = require("../utils/dateFunctionality");

const Accounts = {
  index: {
    auth: false,
    handler: function (request, h) {
      return h.view("main");
    },
  },
  showSignup: {
    auth: false,
    handler: function (request, h) {
      return h.view("signup");
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
        userType: Joi.string(),
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
        const userType = payload.userType;
       
        let accountType = "User";

        if (typeof userType !== "undefined") {
          if (userType === "Admin") {
            accountType = "Admin";
          }
        }

        const newUser = new User({
          firstName: payload.firstName,
          lastName: payload.lastName,
          email: payload.email,
          password: payload.password,
          userType: accountType,
          lastUpdated: null,
          numberOfRecords: 0,
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
      let showUpdatedNotification;
      let now = new Date();
      const id = request.auth.credentials.id;
      const user = await User.findById(id).lean();
      let adminUser = false;

      if (user.userType === "Admin") {
        adminUser = true;
      }

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
        adminUser: adminUser,
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
        userType: Joi.string(),
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
      user.userType = userEdit.userType;
      let now = new Date();
      user.lastUpdated = now.getTime();
      await user.save();

      return h.redirect("/settings");
    },
  },
  showAdminDashboard: {
    handler: async function (request, h) {
      const allUsers = await User.find().lean();
      const allUsersCount = await User.find().count();
      const allCategoriesCount = await Category.find().count();
      const allMonumentsCount = await Monument.find().count();

      const id = request.auth.credentials.id;
      const user = await User.findById(id).lean();
      let adminUser = false;

      if (user.userType === "Admin") {
        adminUser = true;
      }
      return h.view("adminDashboard", {
        adminUser: adminUser,
        allUsers: allUsers,
        allUsersCount: allUsersCount,
        allCategoriesCount: allCategoriesCount,
        allMonumentsCount: allMonumentsCount,
      });
    },
  },
  deleteAccount: {
    handler: async function (request, h) {
      let userId = request.params.id;
      const loggedInId = request.auth.credentials.id;
      const user = await User.findById(userId);
      const loggedInUser = await User.findById(loggedInId);
      await User.deleteOne({ _id: userId });
      
      if (loggedInUser._id != userId) {

        if (loggedInUser.userType === "User") {
        return h.redirect("/accountDeleted");
      } else if (loggedInUser.userType === "Admin") {
        return h.redirect("/adminDashboard", { accountJustDeleted: "true" });
      }

      }
      else {
         return h.redirect("/accountDeleted");
      }
      
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

        let now = new Date();
        let lastLoginDateString = DateFunctionality.formatDateWithTime(now);
        user.lastLogin = lastLoginDateString;
        await user.save();
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
