"use strict";

const Monument = require("../models/monuments");
const Category = require("../models/categories");
const User = require("../models/user");
const cloudinary = require("cloudinary");
const streamifier = require("streamifier");
const env = require("dotenv");
const Joi = require("@hapi/joi");
const axios = require("axios");
env.config();

cloudinary.config({
  cloud_name: "monuments",
  api_key: process.env.cloudinary_api_key,
  api_secret: process.env.cloudinary_api_secret,
});

const handleFileUpload = (file) => {
  return new Promise((resolve, reject) => {
    //const filename = file.hapi.filename;
    const data = file._data;
    resolve(data);
  });
};

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

      const monument = await Monument.findById(request.params.id).populate("categories").lean();
      let weatherData,
        currentWeather,
        dailyWeather,
        formattedSunsetTime,
        currentWeatherFormattedObject,
        currentWeatherDescription,
        weatherAvailable;
      let weatherForecastNextWeek = [];

      async function getWeatherDetails() {
        try {
          const apiWeatherRequest = await axios.get(
            `https://api.openweathermap.org/data/2.5/onecall?lat=${monument.coordinates.latitude}&lon=${monument.coordinates.longitude}&units=metric&exclude=minutely,alerts&appid=${process.env.openweather_api_key}`
          );

          if (apiWeatherRequest.status == 200) {
            return apiWeatherRequest.data;
          } else {
            return undefined;
          }
        } catch (err) {
          console.log("hitting error block");
          //console.log(err)
          return undefined;
        }
      }

      let weatherApiResponse = await getWeatherDetails();

      if (typeof weatherApiResponse !== "undefined") {
        weatherAvailable = true;
        weatherData = weatherApiResponse;
        currentWeather = weatherData.current;
        currentWeatherDescription = currentWeather.weather[0].main;
        dailyWeather = weatherData.daily;
        console.log(dailyWeather[0].weather[0].main);

        const fullDateOptions = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
        const timeOptions = { hour: "numeric", minute: "numeric", second: "numeric" };

        let sunsetDateObject = new Date(currentWeather.sunset * 1000);

        formattedSunsetTime = sunsetDateObject.toLocaleString("en-IE", timeOptions);

        for (let dailyForecast in dailyWeather) {
          let dateObject = new Date(dailyWeather[dailyForecast].dt * 1000);

          let dailyWeatherSummary = dailyWeather[dailyForecast].weather;
          console.log(dailyWeatherSummary);

          console.log(dateObject);

          let formattedDate = dateObject.toLocaleString("en-IE", fullDateOptions);

          let dayWeatherObject = {
            Date: formattedDate,
            Summary: dailyWeatherSummary[0]["main"],
            Description: dailyWeatherSummary[0]["description"],
          };

          weatherForecastNextWeek.push(dayWeatherObject);
        }

        console.log(weatherForecastNextWeek);

        currentWeatherFormattedObject = {
          "Perceived Temperature": currentWeather["feels_like"],
          Pressure: currentWeather["pressure"],
          Humidity: currentWeather["humidity"],
          "Wind Speed": currentWeather["wind_speed"],
        };
      } else {
        weatherAvailable = false;
        currentWeather = undefined;
        currentWeatherFormattedObject = undefined;
        weatherForecastNextWeek = undefined;
        formattedSunsetTime = undefined;
        currentWeatherDescription = undefined;
      }

      return h.view("viewPointOfInterest", {
        title: monument.title,
        monument: monument,
        currentWeather: currentWeather,
        currentWeatherFormattedObject: currentWeatherFormattedObject,
        currentWeatherDescription: currentWeatherDescription,
        weatherForecastNextWeek: weatherForecastNextWeek,
        sunset: formattedSunsetTime,
        weatherAvailable: weatherAvailable,
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
      let newCategoryObjectIds = [];
      let cloudinaryPromise;
      let cloudinarySecureUrl;
      let monumentImageUrlArray = []
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


      

      console.log("image field")
      if (image.length > 1) {
        for (let individualImage in image) {
          let imageBuffer = await handleFileUpload(image[individualImage]);
          cloudinaryPromise = async_func(imageBuffer);
          cloudinarySecureUrl = cloudinaryPromise.then((data) => {
          return data.secure_url;
        });

          let cloudinarySecureUrlPromiseResolved = await cloudinarySecureUrl;

          monumentImageUrlArray.push(cloudinarySecureUrlPromiseResolved)



        }
        
      }
      else {
        const imageBuffer = await handleFileUpload(image);

      if (data.imageUpload.hapi.filename.length !== 0) {
        cloudinaryPromise = async_func(imageBuffer);
        cloudinarySecureUrl = cloudinaryPromise.then((data) => {
          return data.secure_url;
        });
      } else {
        cloudinarySecureUrl = "../images/pointOfInterestDefaultImage.png";
      }

      

      let cloudinarySecureUrlPromiseResolved = await cloudinarySecureUrl;
      monumentImageUrlArray.push(cloudinarySecureUrlPromiseResolved)

      }
      console.log(monumentImageUrlArray)
      console.log(image)

      

      
      const provinceCategoryRef = await Category.find({ title: request.payload.province });
      const id = request.auth.credentials.id;
      const user = await User.findById(id);
      const existingRecordCount = user.numberOfRecords;
      const newMonument = new Monument({
        title: request.payload.title,
        description: request.payload.description,
        user: user._id,
        categories: [],
        image: monumentImageUrlArray,
        province: request.payload.province,
        county: request.payload.county,
        coordinates: { latitude: request.payload.latitude, longitude: request.payload.longitude },
        // [request.payload.latitude, request.payload.longitude]
      });
      await newMonument.save();

      console.log(newMonument);
      user.numberOfRecords = existingRecordCount + 1;
      await user.save();
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
      const id = request.auth.credentials.id;
      const user = await User.findById(id).lean();
      let adminUser = false;

      if (user.userType === "Admin") {
        adminUser = true;
      }

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
      (monument.latitude = monumentEdit.latitude), (monument.longitude = monumentEdit.longitude);

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
      const id = request.auth.credentials.id;
      const user = await User.findById(id);
      const existingRecordCount = user.numberOfRecords;

      if (existingRecordCount > 0) {
        user.numberOfRecords = existingRecordCount - 1;
      }

      await user.save();

      const recordId = request.params.id;
      await Monument.deleteOne({ _id: recordId });
      //const monumentRecord = await Monument.findById({ _id: recordId })
      await Category.updateMany({ $pull: { monuments: { $in: [recordId] } } });

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
