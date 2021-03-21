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
  //Method used to display add monument functionality
  home: {
    handler: async function (request, h) {
      const id = request.auth.credentials.id;

      //Find user by credentials id
      const user = await User.findById(id).lean();
      let adminUser = false;

      //if admin user, set adminuser flag to true (used to check if additional adminDashboard icon should be shown in header)
      if (user.userType === "Admin") {
        adminUser = true;
      }

      //Find all non-provincial categories (as province is already covered off in province input field)
      //existing categories are displayed as list of checkboxes to allow users to add monument to existing categories
      const categories = await Category.find({ title: { $nin: ["Munster", "Leinster", "Connacht", "Ulster"] } }).lean();

      return h.view("home", { title: "Add a monument", categories: categories, adminUser: adminUser });
    },
  },
  //Method used to display dashboard of all added monuments
  report: {
    handler: async function (request, h) {
      const id = request.auth.credentials.id;
      //Find user by credentials id
      const user = await User.findById(id).lean();
      let adminUser = false;

      //if admin user, set adminUser flag to true (used to check if additional adminDashboard icon should be shown in header)
      if (user.userType === "Admin") {
        adminUser = true;
      }

      //Find all monuments
      const monuments = await Monument.find().populate("user").populate("images").lean();
      //Find province categories (for offset nav)
      const provinceCategories = await CategoryFunctionality.findProvinceCategories();
      //Find all other categories (for offset nav)
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
  //Method used to display view with details of relevant individual monument
  viewMonument: {
    handler: async function (request, h) {
      const id = request.auth.credentials.id;
      //Find user to request crednetials id
      const user = await User.findById(id).lean();
      let adminUser = false;

      //if admin user, set adminUser flag to true (used to check if additional adminDashboard icon should be shown in header)
      if (user.userType === "Admin") {
        adminUser = true;
      }

      //Find monument
      const monument = await Monument.findById(request.params.id).populate("categories").populate("images").lean();

      //Make OpenWeather API call with monument latitude and longitude
      let weatherApiResponse = await WeatherFunctionality.getWeatherDetails(monument);

      //Wrangle api response to return values in format that will be consumed by view monument view
      //If no response from api, everything set to undefined (to indicate that noWeatherDataComponent should be displayed)
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

  //Method for adding monument
  addMonument: {
    //Payload allows stream for images
    payload: {
      output: "stream",
      parse: true,
      allow: "multipart/form-data",
      maxBytes: 2 * 40000 * 40000,
      multipart: true,
    },
    //Joi validation makes sure relevant info is provided by user. If not failAction is triggered
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
      failAction: async function (request, h, error) {
        //Find all non-provincial categories (as province is already covered off in province input field)
        //existing categories are displayed as list of checkboxes to allow users to add monument to existing categories
        const categories = await Category.find({
          title: { $nin: ["Munster", "Leinster", "Connacht", "Ulster"] },
        }).lean();
        return h
          .view("home", {
            title: "Error adding Monument",
            errors: error.details,
            categories: categories,
          })
          .takeover()
          .code(400);
      },
    },

    handler: async function (request, h) {
      const data = request.payload;

      //categories variable contains value from request.payload.category
      let categories = request.payload.category;

      //image variable contains value from image input field
      const image = await data.imageUpload;

      const id = request.auth.credentials.id;
      //Find user by request credentials id
      const user = await User.findById(id);

      //Obtaining existing number of monuments associated with user and incrementing by 1
      const existingRecordCount = user.numberOfRecords;
      user.numberOfRecords = existingRecordCount + 1;
      await user.save();

      //Wrangle request payload to create cloudinary images, add image documents in mongodb and return image document ids and titles
      let imageResult = await ImageFunctionality.addMonumentImages(image, data);

      //Add new monument (note empty categories field on initial creation)
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

      //Adding province category (if province category does not exist, new one created and monument Id added).
      //If province category already exists, monument id is appended to existing province category
      let provinceCategoryId = await CategoryFunctionality.addMonumentProvinceCategory(
        request.payload.province,
        newMonument
      );

      //Adding province category document id to new monument categories array (which was empty on creation)
      newMonument.categories.push(provinceCategoryId);

      let monumentId = newMonument._id;
      await newMonument.save();

      //Additional categories check (if user has checked a category on monument creation or added a new category and checked it).
      //Adding other categories (if relevant other category does not exist, new one created and monument Id added).
      //If other category already exists, monument id is appended to existing category
      let otherCategoryIds = await CategoryFunctionality.addMonumentAdditionalCategories(categories, monumentId);

      //If the length of otherCategoryIds is greater than 0, user did select other categories for monument.
      //Programme loops through each, appending each category document id to the monument categories array (adding to the province category id that was already added above)
      if (otherCategoryIds.length > 0) {
        for (let id in otherCategoryIds) {
          newMonument.categories.push(otherCategoryIds[id]);
        }

        await newMonument.save();
      }

      //Set monument field on each image document associated with newly created monument.
      await ImageFunctionality.addMonumentIdToImageRecords(imageResult.imageTitles, monumentId);

      return h.redirect("/report");
    },
  },

  //Method for displaying edit monument view
  editMonumentView: {
    handler: async function (request, h) {
      const id = request.auth.credentials.id;
      //find user with request credentials id
      const user = await User.findById(id).lean();
      let adminUser = false;

      //If admin user, set adMinUser flag to true (to indicate that adminDashboard icon in header should be shown)
      if (user.userType === "Admin") {
        adminUser = true;
      }

      //Find individual monument
      const monument = await Monument.findById(request.params.id).populate("categories").populate("images").lean();
      let selectedCategories = monument.categories;
      let selectedCategoryTitles = [];

      //If monument already has non-province categories associated with it, push the titles of these categories to the selectedCategoryTitles array (so that these can be pre-checked on client side via JavaScript wrangling)
      if (selectedCategories.length !== 0) {
        for (let category in selectedCategories) {
          selectedCategoryTitles.push(selectedCategories[category].title);
        }
      }

      //Find all non-provincial categories (to display to user for selection on edit view)
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

  //Method for editing monument
  editMonument: {
    //Allow stream payload for images
    payload: {
      output: "stream",
      parse: true,
      allow: "multipart/form-data",
      maxBytes: 2 * 40000 * 40000,
      multipart: true,
    },
    //Joi validation ensures that all required info is provided in request. Otherwise, failAction is enabled.
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
      failAction: async function (request, h, error) {
        //Find all non-provincial categories (as province is already covered off in province input field)
        //existing categories are displayed as list of checkboxes to allow users to add monument to existing categories
        const categories = await Category.find({
          title: { $nin: ["Munster", "Leinster", "Connacht", "Ulster"] },
        }).lean();
        //Find individual monument
        const monument = await Monument.findById(request.params.id).populate("categories").populate("images").lean();
        let selectedCategories = monument.categories;
        let selectedCategoryTitles = [];

        //If monument already has non-province categories associated with it, push the titles of these categories to the selectedCategoryTitles array (so that these can be pre-checked on client side via JavaScript wrangling)
        if (selectedCategories.length !== 0) {
          for (let category in selectedCategories) {
            selectedCategoryTitles.push(selectedCategories[category].title);
          }
        }
        return h
          .view("editPointOfInterest", {
            title: "Error adding Monument",
            errors: error.details,
            categories: categories,
            selectedCategories: selectedCategoryTitles,
            monument: monument,
          })
          .takeover()
          .code(400);
      },
    },
    handler: async function (request, h) {
      const monumentEdit = request.payload;

      let categories = request.payload.category;

      const image = await monumentEdit.imageUpload;

      //If user has provided new input in images file, new image documents are created
      let imageResult = await ImageFunctionality.editMonumentImages(image);

      const monument = await Monument.findById(request.params.id);
      let monumentId = monument._id;

      //Removing existing categories (to ensure any previous categories that are no longer checked are up to date)
      await CategoryFunctionality.pullPriorMonumentIds(monumentId);

      //Pushing monument id to province category (as user may have changed the province on the form)
      await CategoryFunctionality.editMonumentProvince(request.payload.province, monumentId);

      //Obtaining other category mongodb document ids (if user has selected additional categorisation to province)
      let newOtherCategoryIds = await CategoryFunctionality.editMonumentAdditionalCategories(categories, monument._id);

      monument.title = monumentEdit.title;
      monument.description = monumentEdit.description;
      monument.user = monumentEdit._id;

      //If imageResult.imageIds array length is greater than 0, set monument images field to newly created image ids
      if (imageResult.imageIds.length > 0) {
        monument.images = imageResult.imageIds;
      }

      //Appending record province category id to monument categories array
      monument.categories = [monument.categories[0]];
      monument.coordinates.latitude = monumentEdit.latitude;
      monument.coordinates.longitude = monumentEdit.longitude;

      //If user has selected other categories for monument, these are appended to the monument categories array
      if (newOtherCategoryIds.length > 0) {
        for (let id in newOtherCategoryIds) {
          if (!monument.categories.includes(newOtherCategoryIds[id])) {
            monument.categories.push(newOtherCategoryIds[id]);
          }
        }
      }

      await monument.save();

      //Ensuring that each image document associated with this monument has monument field set to correct monument document id
      await ImageFunctionality.addMonumentIdToImageRecords(imageResult.imageTitles, monument._id);

      return h.redirect("/report");
    },
  },

  //Method for deleting monument
  deleteMonument: {
    handler: async function (request, h) {
      const id = request.auth.credentials.id;

      //recordId contains monument document id
      const recordId = request.params.id;
      await Monument.deleteOne({ _id: recordId });

      //Remove monument document id from categories
      await CategoryFunctionality.removeMonumentId(recordId);

      //Delete image documents associated with this monument (monument document id)
      await ImageFunctionality.deleteImageRecords(recordId);

      const user = await User.findById(id);
      let existingRecordCount = user.numberOfRecords;
      //If user's existing record count is greater than 0, decrement the count by 1
      if (existingRecordCount > 0) {
        user.numberOfRecords = existingRecordCount - 1;
      }

      await user.save();

      return h.redirect("/report");
    },
  },

  //Method for getting county monuments (filter functionality on report view)
  getCountyMonuments: {
    handler: async function (request, h) {
      //Check to see if any monuments exist for county passed in request.params.county
      let countyMonuments = await Monument.find({ county: request.params.county })
        .populate("user")
        .populate("images")
        .lean();

      //Check count of records for county passed in request.params.county
      let resultCount = await Monument.find({ county: request.params.county })
        .populate("user")
        .populate("images")
        .count()
        .lean();

      //Obtain all monuments (for filter component)
      let allMonuments = await Monument.find().populate("user").populate("images").lean();

      if (resultCount === 0) {
        resultCount = undefined;
      }

      if (countyMonuments.length === 0) {
        countyMonuments = undefined;
      }

      //Obtain categories (for offset nav)
      const categories = await Category.find().populate("monuments").lean();
      return h.view("report", {
        monuments: countyMonuments,
        allMonuments: allMonuments,
        categories: categories,
        resultCount: resultCount,
      });
    },
  },

  //Method for getting individual monument be specific title (filter functionality on report view)
  getMonumentByTitle: {
    handler: async function (request, h) {
      //Find monument associated with request.params.title
      let monument = await Monument.find({ title: request.params.title }).populate("user").populate("images").lean();
      //Find all monuments (for filter component functionality)
      let allMonuments = await Monument.find().populate("user").lean();
      //Find all categories (for offset nav)
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

  //Method for getting monuments by input provided by user (filter functionality on report view)
  searchMonumentTitles: {
    handler: async function (request, h) {
      //Find records associated with input provided by user in search input box (passed in request.params.title)
      let monument = await Monument.find({ title: { $regex: request.params.title } })
        .populate("user")
        .populate("images")
        .lean();
      //Find count of records that align with input provided by user in search input box (passed in request.params.title)
      let resultCount = await Monument.find({ title: { $regex: request.params.title } })
        .populate("user")
        .count()
        .lean();

      //Find all monuments (for filter component functionality)
      let allMonuments = await Monument.find().populate("user").lean();
      //Find all categories (for offset nav)
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
