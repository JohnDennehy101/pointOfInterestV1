"use strict";

const Monument = require("../models/monuments");
const User = require("../models/user");
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
      resolve(
data
      )
      

     
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

      (result, error) => {

resolve(result)

      }

    );
  
   streamifier.createReadStream(req).pipe(stream);
   

  });

};

async function async_func(req) {

  let result = await streamUpload(req);

  return result;
 

}


const imageBuffer = await handleFileUpload(image);
console.log(imageBuffer)

let cloudinaryPromise = async_func(imageBuffer);
let cloudinarySecureUrl = cloudinaryPromise.then((data) => {

  return data.secure_url

       })

      

    let cloudinarySecureUrlPromiseResolved = await cloudinarySecureUrl;

 const id = request.auth.credentials.id;
        const user = await User.findById(id);
      const newMonument = new Monument({
        title: request.payload.title,
        description: request.payload.description,
        user: user._id,
        image: cloudinarySecureUrlPromiseResolved,
      });
      await newMonument.save();
      return h.redirect("/report");

      }

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

      console.log(monumentEdit.imageUpload._readableState);

      const image = await monumentEdit.imageUpload;

      const imageUploadObject = await handleFileUpload(image);



let streamUpload = (req) => {

  return new Promise((resolve, reject) => {

    let stream = cloudinary.uploader.upload_stream(

      (result, error) => {

resolve(result)

      }

    );
  
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
console.log(imageBuffer)













      const monument = await Monument.findById(request.params.id);

      console.log(monumentEdit.imageUpload._readableState.length)
      console.log(monumentEdit.imageUpload._readableState)
      console.log(monumentEdit.imageUpload)


if (monumentEdit.imageUpload.hapi.filename.length !== 0) {

  cloudinaryPromise = async_func(imageBuffer);
cloudinarySecureUrl = cloudinaryPromise.then((data) => {

  return data.secure_url

       })

      

   
}
else {
  cloudinarySecureUrl = monument.image
}

 let cloudinarySecureUrlPromiseResolved = await cloudinarySecureUrl;




      monument.title = monumentEdit.title;
      monument.description = monumentEdit.description;
      monument.user = monumentEdit._id;
      monument.image = cloudinarySecureUrlPromiseResolved;

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