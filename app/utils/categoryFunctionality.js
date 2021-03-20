"use strict";
const Category = require("../models/categories");

const CategoryFunctionality = {
  findProvinceCategories: async function () {
    return Category.find({ title: { $in: ["Munster", "Leinster", "Connacht", "Ulster"] } })
      .populate("monuments")
      .lean();
  },
  findAllOtherCategories: async function () {
    return Category.find({ title: { $nin: ["Munster", "Leinster", "Connacht", "Ulster"] } })
      .populate("monuments")
      .lean();
  },
  handleMonumentProvinceCategory: async function (province, newMonument) {
    let category = await Category.find({ title: province });

    if (category.length === 0) {
      category = new Category({
        title: province,
        monuments: newMonument._id,
      });

      await category.save();
    } else {
      console.log(category);
      category[0].monuments.push(newMonument._id);
      category[0].save();
    }

    return category._id;
  },

  handleMonumentAdditionalCategories: async function (categories, monumentId) {
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
};

module.exports = CategoryFunctionality;
