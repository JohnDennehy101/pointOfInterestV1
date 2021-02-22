"use strict";

const Accounts = require("./app/controllers/accounts");
const Monuments = require("./app/controllers/monuments");

module.exports = [
  { method: "GET", path: "/", config: Accounts.index },
  { method: "GET", path: "/signup", config: Accounts.showSignup },
  { method: "GET", path: "/login", config: Accounts.showLogin },
  { method: "GET", path: "/logout", config: Accounts.logout },
  { method: "POST", path: "/signup", config: Accounts.signup },
  { method: 'GET', path: '/settings', config: Accounts.showSettings },
  { method: 'POST', path: '/settings', config: Accounts.updateSettings },
  { method: "POST", path: "/login", config: Accounts.login },
  { method: "GET", path: "/home", config: Monuments.home },
  { method: "GET", path: "/report", config: Monuments.report },
  { method: "GET", path: "/editMonument/{id}", config: Monuments.editMonument },
  { method: 'POST', path: '/addMonument', config: Monuments.addMonument },

  {
    method: "GET",
    path: "/{param*}",
    handler: {
      directory: {
        path: "./public",
      },

    },
    options: { auth: false }
  },
];