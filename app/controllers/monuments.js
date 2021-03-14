"use strict";

const Monument = require("../models/monuments");
const Category = require("../models/categories");
const User = require("../models/user");
const cloudinary = require("cloudinary");
const streamifier = require("streamifier");
const env = require("dotenv");
const Joi = require("@hapi/joi");
const axios = require("axios")
env.config();

cloudinary.config({
  cloud_name: "monuments",
  api_key: process.env.cloudinary_api_key,
  api_secret: process.env.cloudinary_api_secret,
});

const handleFileUpload = (file) => {
  return new Promise((resolve, reject) => {
    const filename = file.hapi.filename;
    const data = file._data;
    resolve(data);
  });
};

const Monuments = {
  home: {
    handler: async function (request, h) {
      const categories = await Category.find({ title: { $nin: ["Munster", "Leinster", "Connacht", "Ulster"] } }).lean();
      console.log(categories);
      return h.view("home", { title: "Add a monument", categories: categories });
    },
  },
  report: {
    handler: async function (request, h) {
      const monuments = await Monument.find().populate("user").lean();
      const provinceCategories = await Category.find({ title: { $in: ["Munster", "Leinster", "Connacht", "Ulster"] } })
        .populate("monuments")
        .lean();
      const otherCategories = await Category.find({ title: { $nin: ["Munster", "Leinster", "Connacht", "Ulster"] } })
        .populate("monuments")
        .lean();

      return h.view("report", {
        title: "Monuments added to Date",
        monuments: monuments,
        provinceCategories: provinceCategories,
        otherCategories: otherCategories,
      });
    },
  },
  viewMonument: {
    handler: async function (request, h) {
      const monument = await Monument.findById(request.params.id).populate("categories").lean();
      

      //Try to get weather for national monument
      //const apiWeatherRequest = await axios.get(`https://api.openweathermap.org/data/2.5/onecall?lat=${monument.coordinates.latitude}&lon=${monument.coordinates.longitude}&exclude=minutely,alerts&appid=${process.env.openweather_api_key}`)

      //let weatherData = apiWeatherRequest.data


      let testData = {
  lat: 90,
  lon: 89.5,
  timezone: 'Etc/GMT-6',
  timezone_offset: 21600,
  current: {
    dt: 1615760460,
    temp: 240.2,
    feels_like: 233.14,
    pressure: 1017,
    humidity: 97,
    dew_point: 239.91,
    uvi: 0,
    clouds: 48,
    visibility: 10000,
    wind_speed: 4.54,
    wind_deg: 85,
    wind_gust: 5.2,
    weather: [ [Object] ]
  },
  hourly: [
    {
      dt: 1615759200,
      temp: 240.2,
      feels_like: 233.14,
      pressure: 1017,
      humidity: 97,
      dew_point: 239.91,
      uvi: 0,
      clouds: 48,
      visibility: 10000,
      wind_speed: 4.54,
      wind_deg: 85,
      wind_gust: 5.2,
      weather: [Array],
      pop: 0
    },
    {
      dt: 1615762800,
      temp: 240.22,
      feels_like: 233.15,
      pressure: 1017,
      humidity: 97,
      dew_point: 239.93,
      uvi: 0,
      clouds: 43,
      visibility: 10000,
      wind_speed: 4.56,
      wind_deg: 85,
      wind_gust: 5.2,
      weather: [Array],
      pop: 0
    },
    {
      dt: 1615766400,
      temp: 240.22,
      feels_like: 233.13,
      pressure: 1018,
      humidity: 97,
      dew_point: 239.93,
      uvi: 0,
      clouds: 38,
      visibility: 10000,
      wind_speed: 4.59,
      wind_deg: 81,
      wind_gust: 5.21,
      weather: [Array],
      pop: 0
    },
    {
      dt: 1615770000,
      temp: 240.37,
      feels_like: 233.22,
      pressure: 1019,
      humidity: 96,
      dew_point: 239.99,
      uvi: 0,
      clouds: 16,
      visibility: 10000,
      wind_speed: 4.68,
      wind_deg: 79,
      wind_gust: 5.34,
      weather: [Array],
      pop: 0
    },
    {
      dt: 1615773600,
      temp: 240.7,
      feels_like: 233.44,
      pressure: 1019,
      humidity: 95,
      dew_point: 240.22,
      uvi: 0,
      clouds: 13,
      visibility: 10000,
      wind_speed: 4.83,
      wind_deg: 80,
      wind_gust: 5.4,
      weather: [Array],
      pop: 0
    },
    {
      dt: 1615777200,
      temp: 240.74,
      feels_like: 233.56,
      pressure: 1019,
      humidity: 95,
      dew_point: 236.95,
      uvi: 0,
      clouds: 9,
      visibility: 10000,
      wind_speed: 4.72,
      wind_deg: 82,
      wind_gust: 5.31,
      weather: [Array],
      pop: 0
    },
    {
      dt: 1615780800,
      temp: 240.8,
      feels_like: 233.57,
      pressure: 1020,
      humidity: 95,
      dew_point: 236.99,
      uvi: 0,
      clouds: 7,
      visibility: 10000,
      wind_speed: 4.79,
      wind_deg: 82,
      wind_gust: 5.43,
      weather: [Array],
      pop: 0
    },
    {
      dt: 1615784400,
      temp: 240.85,
      feels_like: 233.56,
      pressure: 1021,
      humidity: 95,
      dew_point: 237.07,
      uvi: 0,
      clouds: 5,
      visibility: 10000,
      wind_speed: 4.88,
      wind_deg: 83,
      wind_gust: 5.51,
      weather: [Array],
      pop: 0
    },
    {
      dt: 1615788000,
      temp: 240.86,
      feels_like: 233.52,
      pressure: 1021,
      humidity: 96,
      dew_point: 237.2,
      uvi: 0,
      clouds: 4,
      visibility: 10000,
      wind_speed: 4.96,
      wind_deg: 86,
      wind_gust: 5.61,
      weather: [Array],
      pop: 0
    },
    {
      dt: 1615791600,
      temp: 240.86,
      feels_like: 233.66,
      pressure: 1021,
      humidity: 97,
      dew_point: 237.31,
      uvi: 0,
      clouds: 0,
      visibility: 10000,
      wind_speed: 4.76,
      wind_deg: 87,
      wind_gust: 5.42,
      weather: [Array],
      pop: 0
    },
    {
      dt: 1615795200,
      temp: 240.97,
      feels_like: 233.77,
      pressure: 1022,
      humidity: 97,
      dew_point: 237.45,
      uvi: 0,
      clouds: 0,
      visibility: 10000,
      wind_speed: 4.76,
      wind_deg: 88,
      wind_gust: 5.4,
      weather: [Array],
      pop: 0
    },
    {
      dt: 1615798800,
      temp: 241.11,
      feels_like: 233.82,
      pressure: 1023,
      humidity: 98,
      dew_point: 237.61,
      uvi: 0,
      clouds: 0,
      visibility: 10000,
      wind_speed: 4.89,
      wind_deg: 90,
      wind_gust: 5.5,
      weather: [Array],
      pop: 0
    },
    {
      dt: 1615802400,
      temp: 241.22,
      feels_like: 233.94,
      pressure: 1023,
      humidity: 98,
      dew_point: 237.76,
      uvi: 0,
      clouds: 0,
      visibility: 10000,
      wind_speed: 4.88,
      wind_deg: 90,
      wind_gust: 5.53,
      weather: [Array],
      pop: 0
    },
    {
      dt: 1615806000,
      temp: 241.2,
      feels_like: 234.07,
      pressure: 1024,
      humidity: 98,
      dew_point: 237.8,
      uvi: 0,
      clouds: 0,
      visibility: 10000,
      wind_speed: 4.66,
      wind_deg: 94,
      wind_gust: 5.33,
      weather: [Array],
      pop: 0
    },
    {
      dt: 1615809600,
      temp: 241.2,
      feels_like: 234.23,
      pressure: 1025,
      humidity: 98,
      dew_point: 237.8,
      uvi: 0,
      clouds: 0,
      visibility: 10000,
      wind_speed: 4.44,
      wind_deg: 94,
      wind_gust: 5.12,
      weather: [Array],
      pop: 0
    },
    {
      dt: 1615813200,
      temp: 241.2,
      feels_like: 234.31,
      pressure: 1025,
      humidity: 100,
      dew_point: 237.9,
      uvi: 0,
      clouds: 0,
      visibility: 6376,
      wind_speed: 4.33,
      wind_deg: 92,
      wind_gust: 4.91,
      weather: [Array],
      pop: 0
    },
    {
      dt: 1615816800,
      temp: 241.1,
      feels_like: 234.44,
      pressure: 1025,
      humidity: 100,
      dew_point: 237.9,
      uvi: 0,
      clouds: 50,
      visibility: 6596,
      wind_speed: 4,
      wind_deg: 93,
      wind_gust: 4.63,
      weather: [Array],
      pop: 0
    },
    {
      dt: 1615820400,
      temp: 241.1,
      feels_like: 234.52,
      pressure: 1026,
      humidity: 99,
      dew_point: 237.8,
      uvi: 0,
      clouds: 61,
      visibility: 10000,
      wind_speed: 3.88,
      wind_deg: 92,
      wind_gust: 4.52,
      weather: [Array],
      pop: 0
    },
    {
      dt: 1615824000,
      temp: 241.1,
      feels_like: 234.62,
      pressure: 1026,
      humidity: 99,
      dew_point: 237.8,
      uvi: 0,
      clouds: 46,
      visibility: 10000,
      wind_speed: 3.74,
      wind_deg: 91,
      wind_gust: 4.31,
      weather: [Array],
      pop: 0
    },
    {
      dt: 1615827600,
      temp: 241.15,
      feels_like: 234.74,
      pressure: 1026,
      humidity: 99,
      dew_point: 237.8,
      uvi: 0,
      clouds: 37,
      visibility: 10000,
      wind_speed: 3.64,
      wind_deg: 91,
      wind_gust: 4.21,
      weather: [Array],
      pop: 0
    },
    {
      dt: 1615831200,
      temp: 241.2,
      feels_like: 234.77,
      pressure: 1027,
      humidity: 98,
      dew_point: 237.9,
      uvi: 0,
      clouds: 30,
      visibility: 10000,
      wind_speed: 3.67,
      wind_deg: 92,
      wind_gust: 4.25,
      weather: [Array],
      pop: 0
    },
    {
      dt: 1615834800,
      temp: 241.14,
      feels_like: 234.85,
      pressure: 1027,
      humidity: 98,
      dew_point: 237.8,
      uvi: 0,
      clouds: 0,
      visibility: 10000,
      wind_speed: 3.47,
      wind_deg: 91,
      wind_gust: 4.03,
      weather: [Array],
      pop: 0
    },
    {
      dt: 1615838400,
      temp: 241.14,
      feels_like: 234.98,
      pressure: 1027,
      humidity: 97,
      dew_point: 237.65,
      uvi: 0,
      clouds: 0,
      visibility: 10000,
      wind_speed: 3.27,
      wind_deg: 90,
      wind_gust: 3.82,
      weather: [Array],
      pop: 0
    },
    {
      dt: 1615842000,
      temp: 241.1,
      feels_like: 235.13,
      pressure: 1027,
      humidity: 97,
      dew_point: 237.64,
      uvi: 0,
      clouds: 0,
      visibility: 10000,
      wind_speed: 3,
      wind_deg: 86,
      wind_gust: 3.45,
      weather: [Array],
      pop: 0
    },
    {
      dt: 1615845600,
      temp: 241.2,
      feels_like: 235.41,
      pressure: 1028,
      humidity: 96,
      dew_point: 237.6,
      uvi: 0,
      clouds: 0,
      visibility: 10000,
      wind_speed: 2.75,
      wind_deg: 79,
      wind_gust: 3.22,
      weather: [Array],
      pop: 0
    },
    {
      dt: 1615849200,
      temp: 241.22,
      feels_like: 235.52,
      pressure: 1028,
      humidity: 95,
      dew_point: 237.46,
      uvi: 0,
      clouds: 0,
      visibility: 10000,
      wind_speed: 2.62,
      wind_deg: 73,
      wind_gust: 3.04,
      weather: [Array],
      pop: 0
    },
    {
      dt: 1615852800,
      temp: 241.22,
      feels_like: 235.56,
      pressure: 1028,
      humidity: 94,
      dew_point: 237.38,
      uvi: 0,
      clouds: 0,
      visibility: 10000,
      wind_speed: 2.55,
      wind_deg: 68,
      wind_gust: 3.01,
      weather: [Array],
      pop: 0
    },
    {
      dt: 1615856400,
      temp: 241.15,
      feels_like: 235.67,
      pressure: 1028,
      humidity: 94,
      dew_point: 237.27,
      uvi: 0,
      clouds: 0,
      visibility: 10000,
      wind_speed: 2.3,
      wind_deg: 64,
      wind_gust: 2.71,
      weather: [Array],
      pop: 0
    },
    {
      dt: 1615860000,
      temp: 241.27,
      feels_like: 235.76,
      pressure: 1028,
      humidity: 93,
      dew_point: 237.35,
      uvi: 0,
      clouds: 0,
      visibility: 10000,
      wind_speed: 2.34,
      wind_deg: 46,
      wind_gust: 2.71,
      weather: [Array],
      pop: 0
    },
    {
      dt: 1615863600,
      temp: 241.52,
      feels_like: 235.8,
      pressure: 1027,
      humidity: 93,
      dew_point: 237.61,
      uvi: 0,
      clouds: 0,
      visibility: 10000,
      wind_speed: 2.65,
      wind_deg: 36,
      wind_gust: 3.12,
      weather: [Array],
      pop: 0
    },
    {
      dt: 1615867200,
      temp: 241.71,
      feels_like: 235.79,
      pressure: 1027,
      humidity: 92,
      dew_point: 237.74,
      uvi: 0,
      clouds: 0,
      visibility: 10000,
      wind_speed: 2.94,
      wind_deg: 31,
      wind_gust: 3.41,
      weather: [Array],
      pop: 0
    },
    {
      dt: 1615870800,
      temp: 241.76,
      feels_like: 235.73,
      pressure: 1028,
      humidity: 92,
      dew_point: 237.82,
      uvi: 0,
      clouds: 0,
      visibility: 10000,
      wind_speed: 3.09,
      wind_deg: 34,
      wind_gust: 3.61,
      weather: [Array],
      pop: 0
    },
    {
      dt: 1615874400,
      temp: 241.79,
      feels_like: 235.66,
      pressure: 1028,
      humidity: 93,
      dew_point: 237.92,
      uvi: 0,
      clouds: 0,
      visibility: 10000,
      wind_speed: 3.23,
      wind_deg: 27,
      wind_gust: 3.7,
      weather: [Array],
      pop: 0
    },
    {
      dt: 1615878000,
      temp: 241.85,
      feels_like: 235.79,
      pressure: 1027,
      humidity: 94,
      dew_point: 238.01,
      uvi: 0,
      clouds: 0,
      visibility: 10000,
      wind_speed: 3.14,
      wind_deg: 22,
      wind_gust: 3.61,
      weather: [Array],
      pop: 0
    },
    {
      dt: 1615881600,
      temp: 241.99,
      feels_like: 235.85,
      pressure: 1027,
      humidity: 94,
      dew_point: 238.2,
      uvi: 0,
      clouds: 0,
      visibility: 10000,
      wind_speed: 3.26,
      wind_deg: 20,
      wind_gust: 3.81,
      weather: [Array],
      pop: 0
    },
    {
      dt: 1615885200,
      temp: 242.17,
      feels_like: 235.86,
      pressure: 1027,
      humidity: 94,
      dew_point: 238.36,
      uvi: 0,
      clouds: 0,
      visibility: 10000,
      wind_speed: 3.5,
      wind_deg: 16,
      wind_gust: 4.01,
      weather: [Array],
      pop: 0
    },
    {
      dt: 1615888800,
      temp: 242.3,
      feels_like: 235.96,
      pressure: 1027,
      humidity: 93,
      dew_point: 238.48,
      uvi: 0,
      clouds: 0,
      visibility: 10000,
      wind_speed: 3.55,
      wind_deg: 13,
      wind_gust: 4.1,
      weather: [Array],
      pop: 0
    },
    {
      dt: 1615892400,
      temp: 242.4,
      feels_like: 236.08,
      pressure: 1027,
      humidity: 93,
      dew_point: 238.5,
      uvi: 0,
      clouds: 0,
      visibility: 10000,
      wind_speed: 3.52,
      wind_deg: 14,
      wind_gust: 4.11,
      weather: [Array],
      pop: 0
    },
    {
      dt: 1615896000,
      temp: 242.5,
      feels_like: 236.3,
      pressure: 1027,
      humidity: 92,
      dew_point: 238.52,
      uvi: 0,
      clouds: 0,
      visibility: 10000,
      wind_speed: 3.35,
      wind_deg: 16,
      wind_gust: 3.86,
      weather: [Array],
      pop: 0
    },
    {
      dt: 1615899600,
      temp: 242.7,
      feels_like: 236.34,
      pressure: 1027,
      humidity: 98,
      dew_point: 239.31,
      uvi: 0,
      clouds: 0,
      visibility: 10000,
      wind_speed: 3.59,
      wind_deg: 7,
      wind_gust: 4.1,
      weather: [Array],
      pop: 0
    },
    {
      dt: 1615903200,
      temp: 242.8,
      feels_like: 236.44,
      pressure: 1026,
      humidity: 95,
      dew_point: 239.14,
      uvi: 0,
      clouds: 4,
      visibility: 10000,
      wind_speed: 3.59,
      wind_deg: 5,
      wind_gust: 4.13,
      weather: [Array],
      pop: 0
    },
    {
      dt: 1615906800,
      temp: 242.8,
      feels_like: 236.46,
      pressure: 1026,
      humidity: 93,
      dew_point: 239.06,
      uvi: 0,
      clouds: 17,
      visibility: 10000,
      wind_speed: 3.55,
      wind_deg: 5,
      wind_gust: 4.13,
      weather: [Array],
      pop: 0
    },
    {
      dt: 1615910400,
      temp: 242.98,
      feels_like: 236.61,
      pressure: 1026,
      humidity: 92,
      dew_point: 239.07,
      uvi: 0,
      clouds: 18,
      visibility: 10000,
      wind_speed: 3.6,
      wind_deg: 3,
      wind_gust: 4.13,
      weather: [Array],
      pop: 0
    },
    {
      dt: 1615914000,
      temp: 243.16,
      feels_like: 236.71,
      pressure: 1026,
      humidity: 91,
      dew_point: 239.18,
      uvi: 0,
      clouds: 14,
      visibility: 10000,
      wind_speed: 3.72,
      wind_deg: 359,
      wind_gust: 4.34,
      weather: [Array],
      pop: 0
    },
    {
      dt: 1615917600,
      temp: 243.31,
      feels_like: 236.76,
      pressure: 1026,
      humidity: 91,
      dew_point: 239.3,
      uvi: 0,
      clouds: 12,
      visibility: 10000,
      wind_speed: 3.86,
      wind_deg: 359,
      wind_gust: 4.44,
      weather: [Array],
      pop: 0
    },
    {
      dt: 1615921200,
      temp: 243.34,
      feels_like: 236.97,
      pressure: 1026,
      humidity: 91,
      dew_point: 239.3,
      uvi: 0,
      clouds: 0,
      visibility: 10000,
      wind_speed: 3.61,
      wind_deg: 2,
      wind_gust: 4.2,
      weather: [Array],
      pop: 0
    },
    {
      dt: 1615924800,
      temp: 243.3,
      feels_like: 237.21,
      pressure: 1026,
      humidity: 91,
      dew_point: 239.37,
      uvi: 0,
      clouds: 0,
      visibility: 10000,
      wind_speed: 3.21,
      wind_deg: 3,
      wind_gust: 3.74,
      weather: [Array],
      pop: 0
    },
    {
      dt: 1615928400,
      temp: 243.4,
      feels_like: 237.49,
      pressure: 1026,
      humidity: 92,
      dew_point: 239.42,
      uvi: 0,
      clouds: 0,
      visibility: 10000,
      wind_speed: 2.95,
      wind_deg: 1,
      wind_gust: 3.4,
      weather: [Array],
      pop: 0
    }
  ],
  daily: [
    {
      dt: 1615788000,
      sunrise: 0,
      sunset: 0,
      temp: [Object],
      feels_like: [Object],
      pressure: 1021,
      humidity: 96,
      dew_point: 237.2,
      wind_speed: 4.96,
      wind_deg: 86,
      weather: [ {
            "id": 741,
            "main": "Fog",
            "description": "fog",
            "icon": "50n"
        }],
      clouds: 4,
      pop: 0,
      uvi: 0
    },
    {
      dt: 1615874400,
      sunrise: 0,
      sunset: 0,
      temp: [Object],
      feels_like: [Object],
      pressure: 1028,
      humidity: 93,
      dew_point: 237.92,
      wind_speed: 3.23,
      wind_deg: 27,
      weather: [ {
            "id": 741,
            "main": "Fog",
            "description": "fog",
            "icon": "50n"
        }],
      clouds: 0,
      pop: 0,
      uvi: 0
    },
    {
      dt: 1615960800,
      sunrise: 0,
      sunset: 0,
      temp: [Object],
      feels_like: [Object],
      pressure: 1027,
      humidity: 85,
      dew_point: 239.41,
      wind_speed: 2.33,
      wind_deg: 307,
      weather: [ {
            "id": 741,
            "main": "Fog",
            "description": "fog",
            "icon": "50n"
        }],
      clouds: 0,
      pop: 0,
      uvi: 0
    },
    {
      dt: 1616047200,
      sunrise: 0,
      sunset: 0,
      temp: [Object],
      feels_like: [Object],
      pressure: 1007,
      humidity: 94,
      dew_point: 254.41,
      wind_speed: 11.53,
      wind_deg: 214,
      weather: [ {
            "id": 741,
            "main": "Fog",
            "description": "fog",
            "icon": "50n"
        }],
      clouds: 100,
      pop: 1,
      snow: 1.82,
      uvi: 0
    },
    {
      dt: 1616133600,
      sunrise: 0,
      sunset: 0,
      temp: [Object],
      feels_like: [Object],
      pressure: 990,
      humidity: 94,
      dew_point: 255.59,
      wind_speed: 7.38,
      wind_deg: 196,
      weather: [ {
            "id": 741,
            "main": "Fog",
            "description": "fog",
            "icon": "50n"
        }],
      clouds: 100,
      pop: 1,
      snow: 5.26,
      uvi: 0
    },
    {
      dt: 1616220000,
      sunrise: 0,
      sunset: 0,
      temp: [Object],
      feels_like: [Object],
      pressure: 986,
      humidity: 94,
      dew_point: 250.1,
      wind_speed: 11.28,
      wind_deg: 128,
      weather: [ {
            "id": 741,
            "main": "Fog",
            "description": "fog",
            "icon": "50n"
        }],
      clouds: 100,
      pop: 1,
      snow: 3.01,
      uvi: 0
    },
    {
      dt: 1616306400,
      sunrise: 0,
      sunset: 0,
      temp: [Object],
      feels_like: [Object],
      pressure: 994,
      humidity: 89,
      dew_point: 241.4,
      wind_speed: 12.41,
      wind_deg: 86,
      weather: [ {
            "id": 741,
            "main": "Sun",
            "description": "adsf",
            "icon": "50n"
        }],
      clouds: 100,
      pop: 0.2,
      snow: 0.26,
      uvi: 0
    },
    {
      dt: 1616392800,
      sunrise: 0,
      sunset: 0,
      temp: [Object],
      feels_like: [Object],
      pressure: 994,
      humidity: 93,
      dew_point: 244.86,
      wind_speed: 7.23,
      wind_deg: 74,
      weather: [ {
            "id": 741,
            "main": "Fog",
            "description": "fog",
            "icon": "50n"
        }],
      clouds: 100,
      pop: 0.2,
      snow: 0.77,
      uvi: 0
    }
  ]
}

let currentWeather = testData.current
let dailyWeather = testData.daily
console.log(dailyWeather[0].weather[0].main)

const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };

let weatherForecastNextWeek = []

for (let dailyForecast in dailyWeather) {
let dateObject = new Date(dailyWeather[dailyForecast].dt * 1000)

let dailyWeatherSummary = dailyWeather[dailyForecast].weather
console.log(dailyWeatherSummary)

console.log(dateObject)



let formattedDate = dateObject.toLocaleString("en-IE", options)


let dayWeatherObject = {
  "Date": formattedDate,
  "Summary": dailyWeatherSummary[0]['main'],
  "Description": dailyWeatherSummary[0]['description']

}

weatherForecastNextWeek.push(dayWeatherObject)


}

console.log(weatherForecastNextWeek)



let currentWeatherFormattedObject = {
 "Perceived Temperature": currentWeather['feels_like'],
 "Pressure": currentWeather['pressure'],
 "Humidity": currentWeather['humidity'],
 "Wind Speed": currentWeather['wind_speed'],

}



      //console.log(test)
      

      return h.view("viewPointOfInterest", {
        title: monument.title,
        monument: monument,
        currentWeather: currentWeather,
        currentWeatherFormattedObject: currentWeatherFormattedObject,
        weatherForecastNextWeek: weatherForecastNextWeek
      });
    },
  },

  addMonument: {
    payload: {
      output: "stream",
      parse: true,
      allow: "multipart/form-data",
      maxBytes: 2 * 1000 * 1000,
      multipart: true,
    },
    validate: {
      payload: {
        title: Joi.string().required(),
        description: Joi.string().required(),
        imageUpload: Joi.any(),
        province: Joi.string().required(),
        county: Joi.string().required(),
        category: Joi.any(),
        latitude: Joi.number().required(),
        longitude: Joi.number().required(),
      },
      failAction: function (request, h, error) {
        return h
          .view("home", {
            title: "Error adding Monument",
            errors: error.details,
          })
          .takeover()
          .code(400);
      },
    },

    handler: async function (request, h) {
      const data = request.payload;
      let categories = request.payload.category;
      let newCategoryObjectIds = [];
      
     

      console.log(data);

      const image = await data.imageUpload;

      let streamUpload = (req) => {
        return new Promise((resolve, reject) => {
          let stream = cloudinary.uploader.upload_stream((result, error) => {
            resolve(result);
          });

          streamifier.createReadStream(req).pipe(stream);
        });
      };

      async function async_func(req) {
        let result = await streamUpload(req);

        return result;
      }

      let cloudinaryPromise;
      let cloudinarySecureUrl;

      const imageBuffer = await handleFileUpload(image);

      if (data.imageUpload.hapi.filename.length !== 0) {
        cloudinaryPromise = async_func(imageBuffer);
        cloudinarySecureUrl = cloudinaryPromise.then((data) => {
          return data.secure_url;
        });
      } else {
        cloudinarySecureUrl = "../images/pointOfInterestDefaultImage.png";
      }

      // if (!Array.isArray(categories) && categories !== "") {
      //   categories = [categories];
      // }

      let cloudinarySecureUrlPromiseResolved = await cloudinarySecureUrl;
      const provinceCategoryRef = await Category.find({ title: request.payload.province });
      const id = request.auth.credentials.id;
      const user = await User.findById(id);
      const newMonument = new Monument({
        title: request.payload.title,
        description: request.payload.description,
        user: user._id,
        categories: [],
        image: cloudinarySecureUrlPromiseResolved,
        province: request.payload.province,
        county: request.payload.county,
        coordinates: {'latitude': request.payload.latitude, 'longitude': request.payload.longitude} 
       // [request.payload.latitude, request.payload.longitude]
        
      });
      await newMonument.save();
      console.log(newMonument);
      console.log("Working till after saving monument");

      //Adding province category
      let category = await Category.find({ title: request.payload.province });
      console.log(category);
      console.log(category.length);

      if (category.length === 0) {
        category = new Category({
          title: request.payload.province,
          monuments: newMonument._id,
        });

        await category.save();
        newMonument.categories.push(category._id);
        console.log("Working till after saving province category");
      } else {
        console.log(category);
        category[0].monuments.push(newMonument._id);
        await category[0].save();
        newMonument.categories.push(category[0]._id);
      }

      //newMonument.categories.push(category._id);
      let monumentId = newMonument._id;
      await newMonument.save();

      //Other Categories code
      console.log("categories length");
      console.log(typeof categories);
      console.log(typeof categories == undefined);
      console.log(typeof categories == "undefined");
      console.log(categories);

      if (!Array.isArray(categories) && typeof categories != "undefined") {
        console.log("NOT ARRAY");
        let categoryQuery = await Category.find({
          $and: [{ title: categories }, { title: { $nin: ["Munster", "Ulster", "Connacht", "Leinster"] } }],
        });
        console.log(categoryQuery);
        if (categoryQuery.length === 0) {
          let singleNewCategory = new Category({
            title: categories,
            monuments: [monumentId],
          });

          await singleNewCategory.save();
          newCategoryObjectIds.push(singleNewCategory._id);
          console.log(singleNewCategory);
        } else {
          console.log("Trying to add value to existing category");
          console.log(categoryQuery[0]);
          console.log(categoryQuery[0].monuments);
          //newCategoryObjectIds.push(singleNewCategory._id)
          newCategoryObjectIds.push(categoryQuery[0]._id);
          categoryQuery[0].monuments.push(monumentId);
          await categoryQuery[0].save();
        }
        console.log("WTF");
        console.log(categories);
        console.log(typeof categories);
        //console.log(categories.length)
      } else if (Array.isArray(categories)) {
        console.log("COMPUTED AS ARRAY");
        let categoryQuery = await Category.find({
          $and: [{ title: { $in: categories } }, { title: { $nin: ["Munster", "Ulster", "Connacht", "Leinster"] } }],
        });

        console.log("Category Query length" + categoryQuery);
        if (categoryQuery.length === categories.length) {
          console.log("Lenght of result is same as category");
          for (let individualCategory in categoryQuery) {
            console.log("Looping through results, trying to append objectIds to exsiting categories");
            categoryQuery[individualCategory].monuments.push(monumentId);
            newCategoryObjectIds.push(categoryQuery[individualCategory]._id);
            categoryQuery[individualCategory].save();
          }
        } else if (categoryQuery.length !== categories.length) {
          console.log("Length of result is not same as category");
          for (let individualCategory in categories) {
            console.log("Checking each individual category");
            let existingCategoryCheck = await Category.find({ title: categories[individualCategory] });

            console.log(existingCategoryCheck);

            console.log("Lenght of result" + existingCategoryCheck.length);
            console.log(existingCategoryCheck[0]);
            console.log(existingCategoryCheck.length);

            if (existingCategoryCheck.length === 1) {
              existingCategoryCheck[0].monuments.push(monumentId);
              newCategoryObjectIds.push(existingCategoryCheck[0]._id);
              console.log("pushing to existing category");
              await existingCategoryCheck[0].save();
            } else {
              let singleNewCategory = new Category({
                title: categories[individualCategory],
                monuments: [monumentId],
              });

              await singleNewCategory.save();
              newCategoryObjectIds.push(singleNewCategory._id);
              console.log("pushing to new category");
              console.log("Just added new category");
              console.log(singleNewCategory);
            }
          }
        }
      }

      console.log(newCategoryObjectIds);

      if (newCategoryObjectIds.length > 0) {
        for (let id in newCategoryObjectIds) {
          console.log(newCategoryObjectIds[id]);
          newMonument.categories.push(newCategoryObjectIds[id]);
        }

        await newMonument.save();
      }

      return h.redirect("/report");
    },
  },

  editMonumentView: {
    handler: async function (request, h) {
      const monument = await Monument.findById(request.params.id).populate("categories").lean();
      let selectedCategories = monument.categories;
      let selectedCategoryTitles = [];

      if (selectedCategories.length !== 0) {
        for (let category in selectedCategories) {
          selectedCategoryTitles.push(selectedCategories[category].title);
        }
      }
      const categories = await Category.find({ title: { $nin: ["Munster", "Leinster", "Connacht", "Ulster"] } }).lean();

      return h.view("editPointOfInterest", {
        title: "Edit Monument",
        monument: monument,
        categories: categories,
        selectedCategories: selectedCategoryTitles,
      });
    },
  },
  editMonument: {
    payload: {
      output: "stream",
      parse: true,
      allow: "multipart/form-data",
      maxBytes: 2 * 1000 * 1000,
      multipart: true,
    },
     validate: {
      payload: {
        title: Joi.string().required(),
        description: Joi.string().required(),
        imageUpload: Joi.any(),
        province: Joi.string().required(),
        county: Joi.string().required(),
        category: Joi.any(),
        latitude: Joi.number().required(),
        longitude: Joi.number().required()
      },
      failAction: function (request, h, error) {
        return h
          .view("home", {
            title: "Error adding Monument",
            errors: error.details,
          })
          .takeover()
          .code(400);
      },
    },
    handler: async function (request, h) {
      const monumentEdit = request.payload;
      let categories = request.payload.category;
      console.log("start of edit flow");
      let newCategoryObjectIds = [];

      const image = await monumentEdit.imageUpload;

      const imageUploadObject = await handleFileUpload(image);

      let streamUpload = (req) => {
        return new Promise((resolve, reject) => {
          let stream = cloudinary.uploader.upload_stream((result, error) => {
            resolve(result);
          });

          streamifier.createReadStream(req).pipe(stream);
        });
      };

      async function async_func(req) {
        let result = await streamUpload(req);

        return result;
      }
      let cloudinaryPromise;
      let cloudinarySecureUrl;

      const imageBuffer = await handleFileUpload(image);

      const monument = await Monument.findById(request.params.id);
      let monumentId = monument._id;

      let pullAllExistingCategories = await Category.updateMany({ $pull: { monuments: { $in: [monument._id] } } });
      console.log(pullAllExistingCategories);

      console.log("Trying approach of pulling all pre-existing ids before updating");

      //Pushing monument id to province category
      console.log(request.payload.province);
      let provinceResult = await Category.updateOne(
        { title: request.payload.province },
        { $push: { monuments: monumentId } }
      );
      console.log(provinceResult);

      if (Array.isArray(categories)) {
        const otherCategories = await Category.find({
          title: { $nin: ["Munster", "Leinster", "Connacht", "Ulster"] },
        }).lean();

        console.log(otherCategories);
        for (let singleCategory in otherCategories) {
          console.log("checking individual categories");
          console.log(otherCategories[singleCategory].title);
          let existingCategoryCheck = await Category.find({ title: otherCategories[singleCategory].title }).lean();
          console.log(existingCategoryCheck);
          console.log("lenght of query result" + existingCategoryCheck.length);

          if (existingCategoryCheck.length > 0 && categories.includes(otherCategories[singleCategory].title)) {
            existingCategoryCheck[0].monuments.push(monumentId);

            console.log("Existing Categories");
            console.log(existingCategoryCheck);
            let updateExistingCategory = await Category.updateOne(
              { title: existingCategoryCheck[0].title },
              { $push: { monuments: monumentId } }
            );
            console.log(updateExistingCategory);

            //Pushing id here as it will be gone
            newCategoryObjectIds.push(existingCategoryCheck[0]._id);
            console.log(existingCategoryCheck[0].monuments);

            console.log("this category has not been updated by the user");
            console.log(otherCategories[singleCategory].title);
          }
        }

        for (let individualCategory in categories) {
          console.log("Checking each individual category");
          let existingCategoryCheck = await Category.find({ title: categories[individualCategory] });

          console.log(existingCategoryCheck);

          console.log("Lenght of result" + existingCategoryCheck.length);
          console.log(existingCategoryCheck[0]);
          console.log(existingCategoryCheck.length);

          if (existingCategoryCheck.length === 1) {
          } else {
            let singleNewCategory = new Category({
              title: categories[individualCategory],
              monuments: [monumentId],
            });

            await singleNewCategory.save();
            newCategoryObjectIds.push(singleNewCategory._id);
            console.log("pushing to new category");
            console.log("Just added new category");
            console.log(singleNewCategory);
          }
        }
      }

      //Other Categories code

      console.log(categories);
      console.log("type of categories");
      console.log(typeof categories);

      if (!Array.isArray(categories) && categories !== undefined) {
        console.log("Printing category that was checked");
        console.log(categories);
        let categoryQuery = await Category.find({ title: categories });

        console.log(categoryQuery);
        if (categoryQuery.length === 0) {
          let singleNewCategory = new Category({
            title: categories,
            monuments: [monumentId],
          });

          await singleNewCategory.save();
          console.log("added single new category");
          newCategoryObjectIds.push(singleNewCategory._id);
          console.log(singleNewCategory);
        } else {
          console.log("Trying to add value to existing category");
          console.log(categoryQuery[0]);
          console.log(categoryQuery[0].monuments);
          newCategoryObjectIds.push(categoryQuery[0]._id);
          categoryQuery[0].monuments.push(monumentId);
          await categoryQuery[0].save();
        }
      }

      if (monumentEdit.imageUpload.hapi.filename.length !== 0) {
        cloudinaryPromise = async_func(imageBuffer);
        cloudinarySecureUrl = cloudinaryPromise.then((data) => {
          return data.secure_url;
        });
      } else {
        cloudinarySecureUrl = monument.image;
      }

      let cloudinarySecureUrlPromiseResolved = await cloudinarySecureUrl;

      console.log("monument category ids");
      console.log(newCategoryObjectIds);
      monument.title = monumentEdit.title;
      monument.description = monumentEdit.description;
      monument.user = monumentEdit._id;
      monument.image = cloudinarySecureUrlPromiseResolved;
      monument.categories = [monument.categories[0]];
      monument.latitude = monumentEdit.latitude,
      monument.longitude = monumentEdit.longitude

      await monument.save();
      console.log(monument);

      if (newCategoryObjectIds.length > 0) {
        for (let id in newCategoryObjectIds) {
          if (!monument.categories.includes(newCategoryObjectIds[id])) {
            console.log(newCategoryObjectIds[id]);
            monument.categories.push(newCategoryObjectIds[id]);
            console.log("just pushed category id to monument");
          }
        }
      }

      await monument.save();
      console.log(monument);

      return h.redirect("/report");
    },
  },
  deleteMonument: {
    handler: async function (request, h) {
      const recordId = request.params.id;
      await Monument.deleteOne({ _id: recordId });
      //const monumentRecord = await Monument.findById({ _id: recordId })
      await Category.updateMany({ $pull: { monuments: { $in: [recordId] } } });
      let test = await Category.find();
      console.log(test);

      return h.redirect("/report");
    },
  },
  getCountyMonuments: {
    handler: async function (request, h) {
      console.log(request.params.county);
      let countyMonuments = await Monument.find({ county: request.params.county }).populate("user").lean();
      let resultCount = await Monument.find({ county: request.params.county }).populate("user").count().lean();
      let allMonuments = await Monument.find().populate("user").lean();

      if (resultCount === 0) {
        resultCount = undefined;
      }

      if (countyMonuments.length === 0) {
        countyMonuments = undefined;
      }

      const categories = await Category.find().populate("monuments").lean();
      return h.view("report", {
        monuments: countyMonuments,
        allMonuments: allMonuments,
        categories: categories,
        resultCount: resultCount,
      });
    },
  },
  getMonumentByTitle: {
    handler: async function (request, h) {
      let monument = await Monument.find({ title: request.params.title }).populate("user").lean();
      let allMonuments = await Monument.find().populate("user").lean();
      const categories = await Category.find().populate("monuments").lean();

      if (monument.length === 0) {
        monument = undefined;
      }

      return h.view("report", {
        monuments: monument,
        allMonuments: allMonuments,
        categories: categories,
        resultCount: 1,
      });
    },
  },
  searchMonumentTitles: {
    handler: async function (request, h) {
      let monument = await Monument.find({ title: { $regex: request.params.title } })
        .populate("user")
        .lean();
      let resultCount = await Monument.find({ title: { $regex: request.params.title } })
        .populate("user")
        .count()
        .lean();

      let allMonuments = await Monument.find().populate("user").lean();
      const categories = await Category.find().populate("monuments").lean();

      if (monument.length === 0) {
        monument = undefined;
      }
      if (resultCount === 0) {
        resultCount = undefined;
      }

      return h.view("report", {
        monuments: monument,
        allMonuments: allMonuments,
        categories: categories,
        resultCount: resultCount,
      });
    },
  },
};

module.exports = Monuments;
