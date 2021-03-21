"use strict";
const Category = require("../models/categories");

const CategoryFunctionality = {
  //Find province categories (and populate monuments in returned result)
  findProvinceCategories: async function () {
    return Category.find({ title: { $in: ["Munster", "Leinster", "Connacht", "Ulster"] } })
      .populate("monuments")
      .lean();
  },
  //Find all other categories (and populate monuments in returned result)
  findAllOtherCategories: async function () {
    return Category.find({ title: { $nin: ["Munster", "Leinster", "Connacht", "Ulster"] } })
      .populate("monuments")
      .lean();
  },
  //Removed monument id from categories (used on editing of monument - initially monumentId is removed from all categories on edit).
  pullPriorMonumentIds: async function (monumentId) {
    return Category.updateMany({ $pull: { monuments: { $in: [monumentId] } } });
  },

  //Add relevant province category with monument id
  editMonumentProvince: async function (province, monumentId) {
    return Category.updateOne({ title: province }, { $push: { monuments: monumentId } });
  },

  //Remove monument id from categories (on deletion of monument)
  removeMonumentId: async function (recordId) {
    return Category.updateMany({ $pull: { monuments: { $in: [recordId] } } });
  },

  //Add province category (and include monument id) if relevant category does not already exist for province
  addMonumentProvinceCategory: async function (province, newMonument) {
    let category = await Category.find({ title: province });

    if (category.length === 0) {
      category = new Category({
        title: province,
        monuments: newMonument._id,
      });

      await category.save();
    } else {
      category[0].monuments.push(newMonument._id);
      category[0].save();
    }

    return category._id;
  },

  //For all non-provincial categories (category checkboxes on add monument screen)
  //Check if category exists. If it does, append monument id to monuments field on category.
  //If it does not exist, create category and include monument id on monuments field on newly created category.
  addMonumentAdditionalCategories: async function (categories, monumentId) {
    let newCategoryObjectIds = [];

    if (!Array.isArray(categories) && typeof categories != "undefined") {
      let categoryQuery = await Category.find({
        $and: [{ title: categories }, { title: { $nin: ["Munster", "Ulster", "Connacht", "Leinster"] } }],
      });

      if (categoryQuery.length === 0) {
        let singleNewCategory = new Category({
          title: categories,
          monuments: [monumentId],
        });

        await singleNewCategory.save();
        newCategoryObjectIds.push(singleNewCategory._id);
      } else {
        newCategoryObjectIds.push(categoryQuery[0]._id);
        categoryQuery[0].monuments.push(monumentId);
        await categoryQuery[0].save();
      }
    } else if (Array.isArray(categories)) {
      let categoryQuery = await Category.find({
        $and: [{ title: { $in: categories } }, { title: { $nin: ["Munster", "Ulster", "Connacht", "Leinster"] } }],
      });

      if (categoryQuery.length === categories.length) {
        for (let individualCategory in categoryQuery) {
          categoryQuery[individualCategory].monuments.push(monumentId);
          newCategoryObjectIds.push(categoryQuery[individualCategory]._id);
          categoryQuery[individualCategory].save();
        }
      } else if (categoryQuery.length !== categories.length) {
        for (let individualCategory in categories) {
          let existingCategoryCheck = await Category.find({ title: categories[individualCategory] });

          if (existingCategoryCheck.length === 1) {
            existingCategoryCheck[0].monuments.push(monumentId);
            newCategoryObjectIds.push(existingCategoryCheck[0]._id);
            await existingCategoryCheck[0].save();
          } else {
            let singleNewCategory = new Category({
              title: categories[individualCategory],
              monuments: [monumentId],
            });

            await singleNewCategory.save();
            newCategoryObjectIds.push(singleNewCategory._id);
          }
        }
      }
    }

    return newCategoryObjectIds;
  },

  //For all non-provincial categories (category checkboxes on edit monument screen)
  //Check if category exists. If it does, append monument id to monuments field on category.
  //If it does not exist, create category and include monument id on monuments field on newly created category.
  editMonumentAdditionalCategories: async function (categories, monumentId) {
    let newCategoryObjectIds = [];
    if (Array.isArray(categories)) {
      const otherCategories = await this.findAllOtherCategories();

      for (let singleCategory in otherCategories) {
        let existingCategoryCheck = await Category.find({ title: otherCategories[singleCategory].title }).lean();

        if (existingCategoryCheck.length > 0 && categories.includes(otherCategories[singleCategory].title)) {
          existingCategoryCheck[0].monuments.push(monumentId);

          let updateExistingCategory = await Category.updateOne(
            { title: existingCategoryCheck[0].title },
            { $push: { monuments: monumentId } }
          );

          //Pushing id here as it will be gone
          newCategoryObjectIds.push(existingCategoryCheck[0]._id);
        }
      }

      for (let individualCategory in categories) {
        let existingCategoryCheck = await Category.find({ title: categories[individualCategory] });

        if (existingCategoryCheck.length === 1) {
        } else {
          let singleNewCategory = new Category({
            title: categories[individualCategory],
            monuments: [monumentId],
          });

          await singleNewCategory.save();
          newCategoryObjectIds.push(singleNewCategory._id);
        }
      }
    }

    //Other Categories code

    if (!Array.isArray(categories) && categories !== undefined) {
      let categoryQuery = await Category.find({ title: categories });

      if (categoryQuery.length === 0) {
        let singleNewCategory = new Category({
          title: categories,
          monuments: [monumentId],
        });

        await singleNewCategory.save();

        newCategoryObjectIds.push(singleNewCategory._id);
      } else {
        newCategoryObjectIds.push(categoryQuery[0]._id);
        categoryQuery[0].monuments.push(monumentId);
        await categoryQuery[0].save();
      }
    }

    return newCategoryObjectIds;
  },
};

module.exports = CategoryFunctionality;
