"use strict";

const Monument = require("../models/monuments");
const User = require("../models/user");
const fs = require('fs');
const cloudinary = require('cloudinary');
const streamifier = require('streamifier');
const env = require('dotenv');
env.config();

cloudinary.config({ 
  cloud_name: 'monuments', 
  api_key: process.env.cloudinary_api_key, 
  api_secret: process.env.cloudinary_api_secret 
});

const handleFileUpload = file => {
    return new Promise((resolve, reject) => {
      const filename = file.hapi.filename
      const data = file._data
      console.log(data)
      //console.log(data);
      resolve(
data
      )
      

       // fs.writeFile(`./public/images/${filename}`, data, err => {
       // if (err) {
          
        //  reject(err)
        //}
        //resolve({
        //  message: 'Upload successfully!',
        //  imageUrl: `./images/${filename}`
       // })
      //})
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


let streamUpload = (req) => {

  return new Promise((resolve, reject) => {

    let stream = cloudinary.uploader.upload_stream(

      (error, result) => {

        if (result) {
          console.log('WORKING')
          resolve(result);
          

        } else {
console.log('Not WORKING')
          reject(error);

        }

      }

    );

   // fs.createReadStream(req.file.buffer).pipe(stream);
   console.log('CREATING STREAM')
   streamifier.createReadStream(req).pipe(stream);

  });

};


//let streamUpload  = (req) => {
  //cloudinary.uploader.upload_stream( (result) => console.log(result) ).end( req.file.buffer )
//}

async function async_func(req) {

  let result = await streamUpload(req);

  console.log(result);

}


const imageBuffer = await handleFileUpload(image);
async_func(imageBuffer);










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