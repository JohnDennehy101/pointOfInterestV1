"use strict";

const Monument = require("../models/monuments");
const User = require("../models/user");
const fs = require('fs');

const handleFileUpload = file => {
    return new Promise((resolve, reject) => {
      const filename = file.hapi.filename
      const data = file._data
      console.log(data);

        fs.writeFile(`./public/images/${filename}`, data, err => {
        if (err) {
          
          reject(err)
        }
        resolve({
          message: 'Upload successfully!',
          imageUrl: `./images/${filename}`
        })
      })
    })
  }

const Monuments = {
  home: {
    handler: function (request, h) {
      return h.view("home", { title: "Add a monument" });
    },
  },
  report: {
    handler: async function (request, h) {
      const monuments = await Monument.find().populate("user").lean();
      return h.view("report", {
        title: "Monuments added to Date",
        monuments: monuments,
      });
    },
  },
  addMonument: {
     payload: {

          output: "stream",
                        parse: true,
                        allow: "multipart/form-data",
                        maxBytes: 2 * 1000 * 1000,
                        multipart: true
        },
     
    handler: async function (request, h) {
      
      const data = request.payload;

      const image = await data.imageUpload;

      const imageUploadObject = await handleFileUpload(image);
     
      
      const id = request.auth.credentials.id;
      const user = await User.findById(id);
      const newMonument = new Monument({
        title: data.title,
        description: data.description,
        user: user._id,
        image: imageUploadObject.imageUrl
      });
      await newMonument.save();
      return h.redirect("/report");
    },
     
  },
  editMonumentView: {
    handler: async function(request, h) {
      const monument = await Monument.findById(request.params.id).lean();
      return h.view("editPointOfInterest", {
        title: "Edit Monument",
        monument: monument
      })
    }
  },
  editMonument: {
     payload: {

          output: "stream",
                        parse: true,
                        allow: "multipart/form-data",
                        maxBytes: 2 * 1000 * 1000,
                        multipart: true
        },
    handler: async function(request, h) {
      const monumentEdit = request.payload;

      const image = await monumentEdit.imageUpload;

      const imageUploadObject = await handleFileUpload(image);


      const monument = await Monument.findById(request.params.id);
      monument.title = monumentEdit.title;
      monument.description = monumentEdit.description;
      monument.user = monumentEdit._id;
      monument.image = imageUploadObject.imageUrl;

      await monument.save();


      return h.redirect("/report")
    }
  },
  deleteMonument: {
    handler: async function(request, h) {
      const recordId = request.params.id;
      await Monument.deleteOne({ "_id" : recordId})
return h.redirect("/report")
    }
  }
};

module.exports = Monuments;