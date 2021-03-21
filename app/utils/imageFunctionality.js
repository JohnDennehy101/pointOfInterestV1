"use strict";

const Image = require("../models/image");
const cloudinary = require("cloudinary");
const streamifier = require("streamifier");

//Cloudinary configuration
cloudinary.config({
  cloud_name: "monuments",
  api_key: process.env.cloudinary_api_key,
  api_secret: process.env.cloudinary_api_secret,
});

const ImageFunctionality = {
  //This method accepts image stream, resolves promise with result from cloudinary stream.
  //Streamifier package used to create read stream
  streamUpload: async function (req) {
    return new Promise((resolve, reject) => {
      let stream = cloudinary.uploader.upload_stream((result, error) => {
        resolve(result);
      });

      streamifier.createReadStream(req).pipe(stream);
    });
  },
  //Wait for stream upload to complete and then return result
  awaitStreamUpload: async function (req) {
    let result = await this.streamUpload(req);

    return result;
  },

  //Pass image file data to promise, and resolve with data
  handleFileUpload: async function (file) {
    return new Promise((resolve, reject) => {
      const data = file._data;
      resolve(data);
    });
  },

  //Add image documents for each image passed in request. If no image passed, default image is used.
  //Returns image document ids and image document titles
  addMonumentImages: async function (image, data) {
    let monumentImageUrlArray = [];
    let monumentImageTitleArray = [];
    let cloudinaryPromise, cloudinarySecureUrl;

    if (image.length > 1) {
      for (let individualImage in image) {
        let imageBuffer = await this.handleFileUpload(image[individualImage]);

        cloudinaryPromise = this.awaitStreamUpload(imageBuffer);

        cloudinarySecureUrl = cloudinaryPromise.then((data) => {
          return data.secure_url;
        });

        let cloudinarySecureUrlPromiseResolved = await cloudinarySecureUrl;

        let newImage = new Image({
          title: image[individualImage].hapi.filename,
          imageUrl: cloudinarySecureUrlPromiseResolved,
        });

        await newImage.save();

        monumentImageUrlArray.push(newImage._id);
        monumentImageTitleArray.push(newImage.title);
      }
    } else {
      const imageBuffer = await this.handleFileUpload(image);
      let imageFileName = "";

      if (data.imageUpload.hapi.filename.length !== 0) {
        cloudinaryPromise = this.awaitStreamUpload(imageBuffer);
        imageFileName = image.hapi.filename;
        cloudinarySecureUrl = cloudinaryPromise.then((data) => {
          return data.secure_url;
        });
      } else {
        let dateObject = new Date();
        let dateString = dateObject.toString();
        imageFileName = "pointOfInterestDefaultImage " + dateString;
        cloudinarySecureUrl = "../images/pointOfInterestDefaultImage.png";
      }

      let cloudinarySecureUrlPromiseResolved = await cloudinarySecureUrl;

      let newImage = new Image({
        title: imageFileName,
        imageUrl: cloudinarySecureUrlPromiseResolved,
      });

      await newImage.save();

      monumentImageUrlArray.push(newImage._id);
      monumentImageTitleArray.push(newImage.title);
    }

    return {
      imageIds: monumentImageUrlArray,
      imageTitles: monumentImageTitleArray,
    };
  },

  //If user has not edited monument images, method runs through and returns empty arrays.
  //Add image documents for each new image passed in request on edit monument. If no image passed, default image is used.
  //Returns image document ids and image document titles (if user has edited images)

  editMonumentImages: async function (image) {
    let monumentImageUrlArray = [];
    let monumentImageTitleArray = [];
    let cloudinaryPromise, cloudinarySecureUrl;

    if (image.length > 1) {
      for (let individualImage in image) {
        let imageBuffer = await this.handleFileUpload(image[individualImage]);
        cloudinaryPromise = this.awaitStreamUpload(imageBuffer);

        cloudinarySecureUrl = cloudinaryPromise.then((data) => {
          return data.secure_url;
        });

        let cloudinarySecureUrlPromiseResolved = await cloudinarySecureUrl;

        let newImage = new Image({
          title: image[individualImage].hapi.filename,
          imageUrl: cloudinarySecureUrlPromiseResolved,
        });

        await newImage.save();

        monumentImageUrlArray.push(newImage._id);
        monumentImageTitleArray.push(newImage.title);
      }
    } else if (image.hapi.filename !== "") {
      let imageBuffer = await this.handleFileUpload(image);
      cloudinaryPromise = this.awaitStreamUpload(imageBuffer);
      cloudinarySecureUrl = cloudinaryPromise.then((data) => {
        return data.secure_url;
      });

      let cloudinarySecureUrlPromiseResolved = await cloudinarySecureUrl;

      let newImage = new Image({
        title: image.hapi.filename,
        imageUrl: cloudinarySecureUrlPromiseResolved,
      });

      await newImage.save();

      monumentImageUrlArray.push(newImage._id);
      monumentImageTitleArray.push(newImage.title);
    }

    return {
      imageIds: monumentImageUrlArray,
      imageTitles: monumentImageTitleArray,
    };
  },

  //update image documents, setting monument field with monument document id passed in function
  addMonumentIdToImageRecords: async function (monumentImageTitleArray, monumentId) {
    await Image.updateMany({ title: { $in: monumentImageTitleArray } }, { $set: { monument: monumentId } });
  },
  //delete image documents, based on monument document id passed in function
  deleteImageRecords: async function (monumentId) {
    await Image.deleteMany({ monument: monumentId });
  },
};

module.exports = ImageFunctionality;
