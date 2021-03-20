"use strict";

const Monument = require("../models/monuments");
const Category = require("../models/categories");
const User = require("../models/user");
const env = require("dotenv");
const Joi = require("@hapi/joi");
const ImageFunctionality = require("../utils/imageFunctionality");
const WeatherFunctionality = require("../utils/weatherFunctionality");
const CategoryFunctionality = require("../utils/categoryFunctionality");
env.config();

const Monuments = {
  home: {
    handler: async function (request, h) {
      const id = request.auth.credentials.id;
      const user = await User.findById(id).lean();
      let adminUser = false;

      if (user.userType === "Admin") {
        adminUser = true;
      }
      const categories = await Category.find({ title: { $nin: ["Munster", "Leinster", "Connacht", "Ulster"] } }).lean();

      console.log(categories);
      return h.view("home", { title: "Add a monument", categories: categories, adminUser: adminUser });
    },
  },
  report: {
    handler: async function (request, h) {
      const id = request.auth.credentials.id;
      const user = await User.findById(id).lean();
      let adminUser = false;

      if (user.userType === "Admin") {
        adminUser = true;
      }

      const monuments = await Monument.find().populate("user").populate("images").lean();
      const provinceCategories = await CategoryFunctionality.findProvinceCategories();
      const otherCategories = await CategoryFunctionality.findAllOtherCategories();

      return h.view("report", {
        title: "Monuments added to Date",
        monuments: monuments,
        provinceCategories: provinceCategories,
        otherCategories: otherCategories,
        adminUser: adminUser,
      });
    },
  },
  viewMonument: {
    handler: async function (request, h) {
      const id = request.auth.credentials.id;
      const user = await User.findById(id).lean();
      let adminUser = false;

      if (user.userType === "Admin") {
        adminUser = true;
      }

      const monument = await Monument.findById(request.params.id).populate("categories").populate("images").lean();

      let weatherApiResponse = await WeatherFunctionality.getWeatherDetails(monument);
      let weatherDataObject = await WeatherFunctionality.manipulateApiResponse(weatherApiResponse);

      return h.view("viewPointOfInterest", {
        title: monument.title,
        monument: monument,
        currentWeather: weatherDataObject.currentWeather,
        currentWeatherFormattedObject: weatherDataObject.currentWeatherFormattedObject,
        currentWeatherDescription: weatherDataObject.currentWeatherDescription,
        weatherForecastNextWeek: weatherDataObject.weatherForecastNextWeek,
        sunset: weatherDataObject.formattedSunsetTime,
        weatherAvailable: weatherDataObject.weatherAvailable,
        adminUser: adminUser,
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

      const image = await data.imageUpload;

      const id = request.auth.credentials.id;
      const user = await User.findById(id);
      const existingRecordCount = user.numberOfRecords;
      let imageResult = await ImageFunctionality.addMonumentImages(image, data);

      const newMonument = new Monument({
        title: request.payload.title,
        description: request.payload.description,
        user: user._id,
        categories: [],
        images: imageResult.imageIds,
        province: request.payload.province,
        county: request.payload.county,
        coordinates: { latitude: request.payload.latitude, longitude: request.payload.longitude },
      });

      await newMonument.save();

      user.numberOfRecords = existingRecordCount + 1;
      await user.save();

      //Adding province category
      let provinceCategoryId = await CategoryFunctionality.addMonumentProvinceCategory(
        request.payload.province,
        newMonument
      );

      newMonument.categories.push(provinceCategoryId);

      let monumentId = newMonument._id;
      await newMonument.save();

      //Other Categories code

      let otherCategoryIds = await CategoryFunctionality.addMonumentAdditionalCategories(categories, monumentId);

      if (otherCategoryIds.length > 0) {
        for (let id in otherCategoryIds) {
          console.log(otherCategoryIds[id]);
          newMonument.categories.push(otherCategoryIds[id]);
        }

        await newMonument.save();
      }

      await ImageFunctionality.addMonumentIdToImageRecords(imageResult.imageTitles, monumentId);

      return h.redirect("/report");
    },
  },

  editMonumentView: {
    handler: async function (request, h) {
      const id = request.auth.credentials.id;
      const user = await User.findById(id).lean();
      let adminUser = false;

      if (user.userType === "Admin") {
        adminUser = true;
      }

      const monument = await Monument.findById(request.params.id).populate("categories").populate("images").lean();
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
        adminUser: adminUser,
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
      const monumentEdit = request.payload;

      let categories = request.payload.category;

      const image = await monumentEdit.imageUpload;

      let imageResult = await ImageFunctionality.editMonumentImages(image);

      const monument = await Monument.findById(request.params.id);
      let monumentId = monument._id;

      //Removing existing categories (to ensure any previous categories that are no longer checked are up to date)
      await CategoryFunctionality.pullPriorMonumentIds(monumentId);

      //Pushing monument id to province category
      await CategoryFunctionality.editMonumentProvince(request.payload.province, monumentId);

      //Obtaining other category mongodb document ids (if user has selected additional categorisation to province)
      let newOtherCategoryIds = await CategoryFunctionality.editMonumentAdditionalCategories(categories, monument._id);

      monument.title = monumentEdit.title;
      monument.description = monumentEdit.description;
      monument.user = monumentEdit._id;

      if (imageResult.imageIds.length > 0) {
        monument.images = imageResult.imageIds;
      }

      monument.categories = [monument.categories[0]];
      monument.coordinates.latitude = monumentEdit.latitude;
      monument.coordinates.longitude = monumentEdit.longitude;

      if (newOtherCategoryIds.length > 0) {
        for (let id in newOtherCategoryIds) {
          if (!monument.categories.includes(newOtherCategoryIds[id])) {
            monument.categories.push(newOtherCategoryIds[id]);
          }
        }
      }

      await monument.save();

      await ImageFunctionality.addMonumentIdToImageRecords(imageResult.imageTitles, monument._id);

      return h.redirect("/report");
    },
  },
  deleteMonument: {
    handler: async function (request, h) {
      const id = request.auth.credentials.id;

      const recordId = request.params.id;
      await Monument.deleteOne({ _id: recordId });
      await CategoryFunctionality.removeMonumentId(recordId);
      //await Category.updateMany({ $pull: { monuments: { $in: [recordId] } } });

      let testing = await ImageFunctionality.deleteImageRecords(recordId);
      console.log(testing);

      const user = await User.findById(id);
      let existingRecordCount = user.numberOfRecords;
      if (existingRecordCount > 0) {
        user.numberOfRecords = existingRecordCount - 1;
      }

      await user.save();

      return h.redirect("/report");
    },
  },
  getCountyMonuments: {
    handler: async function (request, h) {
      let countyMonuments = await Monument.find({ county: request.params.county })
        .populate("user")
        .populate("images")
        .lean();
      let resultCount = await Monument.find({ county: request.params.county })
        .populate("user")
        .populate("images")
        .count()
        .lean();
      let allMonuments = await Monument.find().populate("user").populate("images").lean();

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
      let monument = await Monument.find({ title: request.params.title }).populate("user").populate("images").lean();
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
