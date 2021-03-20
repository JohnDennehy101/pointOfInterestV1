"use strict";

const Image = require("../models/image");
const cloudinary = require("cloudinary");
const streamifier = require("streamifier");

cloudinary.config({
  cloud_name: "monuments",
  api_key: process.env.cloudinary_api_key,
  api_secret: process.env.cloudinary_api_secret,
});
//const env = require("dotenv");

const ImageFunctionality = {
  streamUpload: async function (req) {
    return new Promise((resolve, reject) => {
      console.log(cloudinary.config);
      let stream = cloudinary.uploader.upload_stream((result, error) => {
        resolve(result);
      });

      streamifier.createReadStream(req).pipe(stream);
    });
  },
  awaitStreamUpload: async function (req) {
    let result = await this.streamUpload(req);

    return result;
  },

  handleFileUpload: async function (file) {
    return new Promise((resolve, reject) => {
      const data = file._data;
      resolve(data);
    });
  },

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
        imageFileName = "pointOfInterestDefaultImage.png";
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

  addMonumentIdToImageRecords: async function (monumentImageTitleArray, monumentId) {
    await Image.updateMany({ title: { $in: monumentImageTitleArray } }, { $set: { monument: monumentId } });
  },
  deleteImageRecords: async function (monumentId) {
    await Image.deleteMany({ monument: monumentId });
  },
};

module.exports = ImageFunctionality;
