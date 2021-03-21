"use strict";
const User = require("../models/user");
const Category = require("../models/categories");
const Monument = require("../models/monuments");
const Joi = require("@hapi/joi");
const DateFunctionality = require("../utils/dateFunctionality");
const Boom = require("@hapi/boom");

const Accounts = {
  //Shown to users on first landing on site
  index: {
    auth: false,
    handler: function (request, h) {
      return h.view("main");
    },
  },
  //Signup view rendered to users
  showSignup: {
    auth: false,
    handler: function (request, h) {
      return h.view("signup");
    },
  },
  //Method used when user clicks 'Sign Up'.
  signup: {
    auth: false,

    //Joi validation checks that each piece of required info is present. If not, user is redirected back to sign up page.
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
      //If email already in use, boom error thrown and user is redirected to sign up page
      try {
        let checkEmailInUse = await User.findByEmail(email);
        if (checkEmailInUse) {
          const message = "Email address already in use";
          throw Boom.unauthorized(message);
        }

        const payload = request.payload;
        const userType = payload.userType;

        //Setting account type as user (only changing to admin if user has explicitly chosen admin in dropdown)
        let accountType = "User";

        if (typeof userType !== "undefined") {
          if (userType === "Admin") {
            accountType = "Admin";
          }
        }

        //Adding new user
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

        //Setting cookie
        request.cookieAuth.set({ id: user.id });
        return h.redirect("/home");
      } catch (err) {
        return h.view("signup", { errors: [{ message: err.message }] });
      }
    },
  },

  //Method used to show settings page to user
  showSettings: {
    handler: async function (request, h) {
      let showUpdatedNotification;
      let now = new Date();
      const id = request.auth.credentials.id;
      const user = await User.findById(id).lean();
      let adminUser = false;

      //If adminUser, set to true to indicate that additional icon in header for adminDashboard should be shown.
      if (user.userType === "Admin") {
        adminUser = true;
      }

      //Checking to see if user has last updated in the last 2 seconds. If they have, set to true to display settings updated notification to user.
      if (user) {
        if (user.lastUpdated !== null) {
          if (now.getTime() - 2000 < user.lastUpdated) {
            showUpdatedNotification = "true";
          } else {
            showUpdatedNotification = "false";
          }
        }
      }

      return h.view("settings", {
        title: "User Settings",
        user: user,
        successNotification: showUpdatedNotification,
        lastUpdated: user.lastUpdated,
        adminUser: adminUser,
      });
    },
  },

  //Method called when user updates their user settings.
  updateSettings: {
    //Joi validation makes sure that required info is present in request
    validate: {
      payload: {
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        email: Joi.string().email().required(),
        password: Joi.string().required(),
        userType: Joi.string(),
      },
      //If user has not provided all required info, failAction redirects them to settings view.
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
      //Updating user properties based on request values
      user.firstName = userEdit.firstName;
      user.lastName = userEdit.lastName;
      user.email = userEdit.email;
      user.password = userEdit.password;
      user.userType = userEdit.userType;
      let now = new Date();
      //Setting lastupdated property to current time
      user.lastUpdated = now.getTime();
      await user.save();

      return h.redirect("/settings");
    },
  },
  //Method used to display adminDashboard
  showAdminDashboard: {
    handler: async function (request, h) {
      //Obtain all users
      const allUsers = await User.find().lean();
      //Obtain user count
      const allUsersCount = await User.find().count();
      //Obtain categories count
      const allCategoriesCount = await Category.find().count();
      //Obtain monument count
      const allMonumentsCount = await Monument.find().count();

      const id = request.auth.credentials.id;
      const user = await User.findById(id).lean();
      let adminUser = false;

      //Checking userType
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

  //Method used to delete user
  deleteAccount: {
    handler: async function (request, h) {
      let userId = request.params.id;
      const loggedInId = request.auth.credentials.id;
      const user = await User.findById(userId);
      const loggedInUser = await User.findById(loggedInId);
      await User.deleteOne({ _id: userId });

      //Checking if admin user is deleting account other than their own
      if (loggedInUser._id != userId) {
        //If admin user, redirect them to adminDashboard instead of logging them out after deletion. Otherwise, log user out after deletion.
        if (loggedInUser.userType === "User") {
          return h.redirect("/accountDeleted");
        } else if (loggedInUser.userType === "Admin") {
          //accountJustDeleted flag is used to display notification that account has just been deleted
          return h.redirect("/adminDashboard", { accountJustDeleted: "true" });
        }
      } else {
        return h.redirect("/accountDeleted");
      }
    },
  },
  //Method used to clear cookie after account deletion
  accountDeleted: {
    handler: function (request, h) {
      //Clear cookie, accountJustDeleted flag is used to display notification that account has just been deleted
      request.cookieAuth.clear();
      return h.view("signup", { accountJustDeleted: "true" });
    },
  },

  //Method used to display login view to users
  showLogin: {
    auth: false,
    handler: function (request, h) {
      return h.view("login");
    },
  },
  //Method used to login users
  login: {
    auth: false,
    handler: async function (request, h) {
      const { email, password } = request.payload;
      try {
        //Check if email provided in request matches existing user
        let user = await User.findByEmail(email);
        if (!user) {
          const message = "Email address is not registered";
          throw Boom.unauthorized(message);
        }
        //Check if user's password matches that provided in request
        user.comparePassword(password);
        //Set cookie
        request.cookieAuth.set({ id: user.id });

        //Setting last login date for users
        let now = new Date();
        let lastLoginDateString = DateFunctionality.formatDateWithTime(now);
        user.lastLogin = lastLoginDateString;
        await user.save();
        return h.redirect("/report");
      } catch (err) {
        return h.view("login", { errors: [{ message: err.message }] });
      }
    },
  },
  //Method used to logout users
  logout: {
    handler: function (request, h) {
      //Clear the cookie, redirect them to the first main view shown to users that land on the site
      request.cookieAuth.clear();
      return h.redirect("/");
    },
  },
};

module.exports = Accounts;
