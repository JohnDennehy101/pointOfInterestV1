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
    handler: async function (request, h) {
      const categories = await Category.find({ title: { $nin: ["Munster", "Leinster", "Connacht", "Ulster"] } }).lean();
      console.log(categories);
      return h.view("home", { title: "Add a monument", categories: categories });
    },
  },
  report: {
    handler: async function (request, h) {
      const monuments = await Monument.find().populate("user").lean();
      const provinceCategories = await Category.find({ title: { $in: ["Munster", "Leinster", "Connacht", "Ulster"] } }).populate("monuments").lean();
      const otherCategories = await Category.find({ title: { $nin: ["Munster", "Leinster", "Connacht", "Ulster"] } }).populate("monuments").lean();

      return h.view("report", {
        title: "Monuments added to Date",
        monuments: monuments,
        provinceCategories: provinceCategories,
        otherCategories: otherCategories
      });
    },
  },
  viewMonument: {
    handler: async function (request, h) {
      const monument = await Monument.findById(request.params.id).populate("categories").lean();

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
        category: Joi.any(),
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
      console.log(Array.isArray(categories));
      // if (Array.isArray(categories) && categories.length > 1) {
      //   console.log('working to here')
      // let categoryQuery = await Category.find({ $and: [ {title: {$in: [categories]}}, {title: {$nin: ['Munster', 'Ulster', 'Connacht', 'Leinster']}}]}, {title: 1});

      // console.log(categoryQuery)
      // if (categoryQuery.length !== categories.length) {
      //   console.log(categories)
      // for (let categoryTitle in categories) {
      //   let test = new Category({
      //           title: categories[categoryTitle],
      //           monuments: [],
      //         });

      //         console.log(test)

      //         await test.save()
      //         newCategoryObjectIds.push(test._id)
      // }
      // console.log(newCategoryObjectIds)
      // }

      // }

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
      });
      await newMonument.save();
      console.log(newMonument)
      console.log("Working till after saving monument");

      //Adding province category
      let category = await Category.find({ title: request.payload.province });
      console.log(category)
      console.log(category.length)

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
        newMonument.categories.push(category[0]._id)
      }

      //newMonument.categories.push(category._id);
      let monumentId = newMonument._id;
      await newMonument.save();

      //Other Categories code
      console.log('categories length')
      console.log(typeof categories)
      console.log(typeof categories == undefined)
      console.log(typeof categories == 'undefined')
      console.log(categories)
    
      if (!Array.isArray(categories) && typeof categories != 'undefined') {
        console.log("NOT ARRAY")
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
          newCategoryObjectIds.push(singleNewCategory._id)
          console.log(singleNewCategory);
        } else {
          console.log("Trying to add value to existing category");
          console.log(categoryQuery[0]);
          console.log(categoryQuery[0].monuments);
          newCategoryObjectIds.push(singleNewCategory._id)
          categoryQuery[0].monuments.push(monumentId);
          await categoryQuery[0].save();
        }
        console.log('WTF')
        console.log(categories)
        console.log(typeof categories)
        //console.log(categories.length)
       
      } else if (Array.isArray(categories)) {
        console.log("COMPUTED AS ARRAY")
        let categoryQuery = await Category.find({
          $and: [{ title: { $in: categories } }, { title: { $nin: ["Munster", "Ulster", "Connacht", "Leinster"] } }],
        });

        console.log("Category Query length" + categoryQuery);
        if (categoryQuery.length === categories.length) {
          console.log("Lenght of result is same as category");
          for (let individualCategory in categoryQuery) {
            console.log("Looping through results, trying to append objectIds to exsiting categories");
            categoryQuery[individualCategory].monuments.push(monumentId);
             newCategoryObjectIds.push(categoryQuery[individualCategory]._id)
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
              newCategoryObjectIds.push(existingCategoryCheck[0]._id)
              console.log("pushing to existing category");
              await existingCategoryCheck[0].save();
            } else {
              let singleNewCategory = new Category({
                title: categories[individualCategory],
                monuments: [monumentId],
              });

              await singleNewCategory.save();
              newCategoryObjectIds.push(singleNewCategory._id)
              console.log("pushing to new category");
              console.log("Just added new category");
              console.log(singleNewCategory);
            }
          }
        }
      }

      console.log(newCategoryObjectIds)

      if (newCategoryObjectIds.length > 0) {
        for (let id in newCategoryObjectIds) {
        console.log(newCategoryObjectIds[id])
        newMonument.categories.push(newCategoryObjectIds[id])
      }

      await newMonument.save()

      }

      

      return h.redirect("/report");
    },
  },

  editMonumentView: {
    handler: async function (request, h) {
      const monument = await Monument.findById(request.params.id).populate("categories").lean();
      let selectedCategories = monument.categories;
      let selectedCategoryTitles = []

      if (selectedCategories.length !== 0) {
        for (let category in selectedCategories) {
          selectedCategoryTitles.push(selectedCategories[category].title)
        }
      }
      const categories = await Category.find({ title: { $nin: ["Munster", "Leinster", "Connacht", "Ulster"] } }).lean();
  
      return h.view("editPointOfInterest", {
        title: "Edit Monument",
        monument: monument,
        categories: categories,
        selectedCategories: selectedCategoryTitles
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
      let categories = request.payload.category;
      console.log('start of edit flow')
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


      if (Array.isArray(categories)) {

        const otherCategories = await Category.find({ title: { $nin: ["Munster", "Leinster", "Connacht", "Ulster"] } }).lean();

      console.log(otherCategories)
      for (let singleCategory in otherCategories) {
        console.log('checking individual categories')
        console.log(otherCategories[singleCategory].title)
        let existingCategoryCheck = await Category.find({ title: otherCategories[singleCategory].title }).lean();
        console.log(existingCategoryCheck)
        console.log('lenght of query result' + existingCategoryCheck.length)

        if (existingCategoryCheck.length > 0 && !categories.includes(otherCategories[singleCategory].title)) {
          let deleteMonumentFromCategory = await Category.updateOne({ title: otherCategories[singleCategory].title }, {$pull: {monuments: {$in: [monumentId]} } }).lean();
          console.log('trying to remove monument from category')
          // await deleteMonumentFromCategory.save()
          console.log(deleteMonumentFromCategory)
        }
        else if (existingCategoryCheck.length > 0 && categories.includes(otherCategories[singleCategory].title)) {
          existingCategoryCheck[0].monuments.push(monumentId);
          console.log('this category has not been updated by the user')
          console.log(otherCategories[singleCategory].title)
        }

      }
      console.log(categories == undefined)
      console.log(categories === undefined)
      console.log(categories === [])
      } else if (!Array.isArray(categories) && categories !== '') {
        for (let categoryId in monument.categories) {
          //console.log('category ids')
          console.log(categoryId)
          if (categoryId === 0){
            //console.log('trying to skip province id')
            //console.log(monument.categories[0])
            continue
          }
          //monument.categories.pop()
          console.log(monument.categories)
        }
      }


      // console.log('went through monument categories')
      console.log(monument)

      


      const testCategories = await Category.find({ title: { $nin: ["Munster", "Leinster", "Connacht", "Ulster"] } }).lean();
      // console.log('Categories after looping through each to check if changes made to categories')
      console.log(testCategories)

      if (monumentEdit.imageUpload.hapi.filename.length !== 0) {
        cloudinaryPromise = async_func(imageBuffer);
        cloudinarySecureUrl = cloudinaryPromise.then((data) => {
          return data.secure_url;
        });
      } else {
        cloudinarySecureUrl = monument.image;
      }

      let cloudinarySecureUrlPromiseResolved = await cloudinarySecureUrl;





          //Other Categories code

          console.log(categories)
          console.log('type of categories')
          console.log(typeof categories)

      if (!Array.isArray(categories) && categories !== undefined) {
        // let categoryQuery = await Category.find({
        //   $and: [{ title: categories }, { title: { $nin: ["Munster", "Ulster", "Connacht", "Leinster"] } }],
        // });
        console.log('length of monument categories')
        console.log(monument.categories.length)
        
          for (let categoryId in monument.categories) {
             console.log(categoryId == '0')
            
             //Commenting out as user can change province
            // if (categoryId === '0') {
            //   console.log(categoryId)
            //   console.log('skipping first id')
            //   continue
            // }
            console.log('monument category title')
          console.log(monument.categories[categoryId])
          let previousCategoryQuery = await Category.findOneAndUpdate({ _id: monument.categories[categoryId]}, { $pull: { monuments: { $in: [monumentId] } } })
          console.log('after deleting monument id in a category')
          console.log(previousCategoryQuery)

           
          }
          

        

        // console.log(request.payload.province)
        // let provinceQuery = await Category.updateOne({title: request.payload.province}, { $push: { monuments: { $in: [monumentId] } } })
        // console.log(provinceQuery)
        //provinceQuery.monuments.push(provinceQuery._id)
        //await provinceQuery.save()
      
        let categoryQuery = await Category.find({ title: categories });

        

        
        console.log(categoryQuery);
        if (categoryQuery.length === 0) {
          let singleNewCategory = new Category({
            title: categories,
            monuments: [monumentId],
          });

          await singleNewCategory.save();
          newCategoryObjectIds.push(singleNewCategory._id)
          console.log(singleNewCategory);
        } else {
          console.log("Trying to add value to existing category");
          console.log(categoryQuery[0]);
          console.log(categoryQuery[0].monuments);
          newCategoryObjectIds.push(categoryQuery[0]._id)
          categoryQuery[0].monuments.push(monumentId);
         await categoryQuery[0].save();
        }
        console.log(categories == undefined)
        console.log(categories === undefined)
        console.log('key line is here')
      } else if (Array.isArray(categories) && categories.length > 0) {
        let categoryQuery = await Category.find({
          $and: [{ title: { $in: categories } }, { title: { $nin: ["Munster", "Ulster", "Connacht", "Leinster"] } }],
        });

        console.log("Category Query length" + categoryQuery);
        if (categoryQuery.length === categories.length) {
          console.log("Lenght of result is same as category");
          for (let individualCategory in categoryQuery) {
            console.log("Looping through results, trying to append objectIds to exsiting categories");
            //categoryQuery[individualCategory].monuments.push(monumentId);
             newCategoryObjectIds.push(categoryQuery[individualCategory]._id)
            //categoryQuery[individualCategory].save();
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
              //existingCategoryCheck[0].monuments.push(monumentId);
              newCategoryObjectIds.push(existingCategoryCheck[0]._id)
              console.log("pushing to existing category");
              //await existingCategoryCheck[0].save();
            } else {
              let singleNewCategory = new Category({
                title: categories[individualCategory],
                monuments: [monumentId],
              });

              await singleNewCategory.save();
              newCategoryObjectIds.push(singleNewCategory._id)
              console.log("pushing to new category");
              console.log("Just added new category");
              console.log(singleNewCategory);
            }
          }
        }
      }






      console.log('monument category ids');
      console.log(newCategoryObjectIds)
      monument.title = monumentEdit.title;
      monument.description = monumentEdit.description;
      monument.user = monumentEdit._id;
      monument.image = cloudinarySecureUrlPromiseResolved;
      monument.categories = [monument.categories[0]]

      await monument.save()
      console.log(monument)

      if (newCategoryObjectIds.length > 0) {
        for (let id in newCategoryObjectIds) {
        console.log(newCategoryObjectIds[id])
        monument.categories.push(newCategoryObjectIds[id])
        console.log("just pushed category id to monument")
      }
    }

      await monument.save();
      console.log(monument)

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
