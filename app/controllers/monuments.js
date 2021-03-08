"use strict";

const Monument = require("../models/monuments");
const Category = require("../models/categories");
const User = require("../models/user");
const cloudinary = require("cloudinary");
const streamifier = require("streamifier");
const env = require("dotenv");
const Joi = require("@hapi/joi");
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
    handler: function (request, h) {
      return h.view("home", { title: "Add a monument" });
    },
  },
  report: {
    handler: async function (request, h) {
      const monuments = await Monument.find().populate("user").lean();
      const categories = await Category.find().populate("monuments").lean()

      
      return h.view("report", {
        title: "Monuments added to Date",
        monuments: monuments,
        categories: categories
      });
    },
  },
  viewMonument: {
    handler: async function (request, h) {
      const monument = await Monument.findById(request.params.id).lean();

      return h.view("viewPointOfInterest", {
        title: monument.title,
        monument: monument,
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

      let cloudinarySecureUrlPromiseResolved = await cloudinarySecureUrl;
      const provinceCategoryRef = await Category.find({ title: request.payload.province });
      const id = request.auth.credentials.id;
      const user = await User.findById(id);
      const newMonument = new Monument({
        title: request.payload.title,
        description: request.payload.description,
        user: user._id,
        //categories: provinceCategoryRef._id,
        categories: [],
        image: cloudinarySecureUrlPromiseResolved,
        province: request.payload.province,
        county: request.payload.county,
      });
      await newMonument.save();
      let category = await Category.find({ title: request.payload.province });

      if (category.length === 0) {
        category = new Category({
          title: request.payload.province,
          monuments: newMonument._id,
        });

        await category.save();
      } else {
        console.log(category);
        category[0].monuments.push(newMonument._id);
        await category[0].save();
      }

      newMonument.categories.push(category._id);
      await newMonument.save();

      return h.redirect("/report");
    },
  },

  editMonumentView: {
    handler: async function (request, h) {
      const monument = await Monument.findById(request.params.id).lean();
      return h.view("editPointOfInterest", {
        title: "Edit Monument",
        monument: monument,
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
    handler: async function (request, h) {
      const monumentEdit = request.payload;

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

      if (monumentEdit.imageUpload.hapi.filename.length !== 0) {
        cloudinaryPromise = async_func(imageBuffer);
        cloudinarySecureUrl = cloudinaryPromise.then((data) => {
          return data.secure_url;
        });
      } else {
        cloudinarySecureUrl = monument.image;
      }

      let cloudinarySecureUrlPromiseResolved = await cloudinarySecureUrl;

      monument.title = monumentEdit.title;
      monument.description = monumentEdit.description;
      monument.user = monumentEdit._id;
      monument.image = cloudinarySecureUrlPromiseResolved;

      await monument.save();

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

      const categories = await Category.find().populate("monuments").lean()
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
      const categories = await Category.find().populate("monuments").lean()

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
      const categories = await Category.find().populate("monuments").lean()

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
