"use strict";

const DateFunctionality = {
  //Return formatted date based on current date passed as parameter
  formatDateWithTime: function (currentDate) {
    let month = currentDate.getMonth();
    let months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    let hour = ("0" + currentDate.getHours()).slice(-2);
    let formattedDate =
      ("0" + currentDate.getDate()).slice(-2) +
      "-" +
      (months[month] +
        "-" +
        currentDate.getFullYear() +
        " " +
        hour +
        ":" +
        ("0" + currentDate.getMinutes()).slice(-2) +
        ":" +
        ("0" + currentDate.getSeconds()).slice(-2));

    return formattedDate;
  },
};

module.exports = DateFunctionality;
