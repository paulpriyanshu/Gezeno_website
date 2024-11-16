const express = require('express')
const users = require('../models/users')
const {  Brand,
    ParentCategory,
    SubCategory,
    SubSubCategory,
    SubSubSubCategory,
    Product,
    ProductVariant,Carousel,CustomSection} = require('../models/product')
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const dotenv = require('dotenv');
const auth = require('../middleware/auth')
const mongoose = require("mongoose");

const router = express.Router()


router.post('/createbrands', async (req, res) => {
    try {
        const { name, image } = req.body;
        if(!name){
            return res.status(400).json({ message: 'Enter name' });
        }
        const brandExists = await Brand.findOne({name});
        if(brandExists){
            return res.status(400).json({ message: 'Brand already exists' });
        }
        const brand = new Brand({ name ,image });
        await brand.save();
        res.status(201).json({ success: true, data: brand });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});
router.post('/updateBrand/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, image } = req.body;

        // Validate input
        if (!id) {
            return res.status(400).json({ success: false, message: 'Brand ID is required' });
        }

        if (!name && !image) {
            return res.status(400).json({ success: false, message: 'At least one field (name or image) must be provided to update' });
        }

        // Find the brand by ID
        const brand = await Brand.findById(id);
        if (!brand) {
            return res.status(404).json({ success: false, message: 'Brand not found' });
        }

        // Check for duplicate brand name
        if (name && name !== brand.name) {
            const brandExists = await Brand.findOne({ name });
            if (brandExists) {
                return res.status(400).json({ success: false, message: 'Brand with this name already exists' });
            }
        }

        // Update brand details
        if (name) brand.name = name;
        if (image) brand.image = image;

        await brand.save();

        res.status(200).json({ success: true, message: 'Brand updated successfully', data: brand });
    } catch (error) {
        console.error('Error updating brand:', error);
        res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
});
router.get('/toggleBrand/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Validate brand ID
        if (!id) {
            return res.status(400).json({ success: false, message: 'Brand ID is required' });
        }

        // Find the brand by ID
        const brand = await Brand.findById(id);
        if (!brand) {
            return res.status(404).json({ success: false, message: 'Brand not found' });
        }

        // Toggle the `isActive` field
        brand.isActive = !brand.isActive;

        // Save the updated brand
        await brand.save();

        res.status(200).json({
            success: true,
            message: `Brand status updated to ${brand.isActive ? 'active' : 'inactive'}`,
            data: brand
        });
    } catch (error) {
        console.error('Error toggling brand status:', error);
        res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
});
router.post('/deletebrand/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: 'Enter brand id to delete' });
        }

        const brand = await Brand.findByIdAndDelete(id);

        if (!brand) {
            return res.status(404).json({ message: 'Brand not found' });
        }

        res.status(200).json({ success: true, message: 'Brand deleted successfully' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});
router.post('/brands/name/:name', async (req, res) => {
    const { name } = req.params;
    const { image, isActive, comingSoon } = req.body;
  
    try {
      // Create an update object with only the fields provided in the request body
      const updateFields = {};
      if (image !== undefined) updateFields.image = image;
      if (isActive !== undefined) updateFields.isActive = isActive;
      if (comingSoon !== undefined) updateFields.comingSoon = comingSoon;
  
      // Find and update the brand by name
      const brand = await Brand.findOneAndUpdate(
        { name },
        updateFields,
        { new: true, runValidators: true }
      );
  
      if (!brand) {
        return res.status(404).json({ success: false, message: 'Brand not found' });
      }
  
      res.json({ success: true, data: brand });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  
  router.get('/getactivebrands', async (req, res) => {
    try {
        const activeBrands = await Brand.find({ isActive: true });
        res.status(200).json({ success: true, data: activeBrands });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});
router.get('/getinactivebrands', async (req, res) => {
    try {
        const activeBrands = await Brand.find({ isActive: false });
        res.status(200).json({ success: true, data: activeBrands });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});
router.get('/getallbrands', async (req, res) => {
try {
        const brands = await Brand.find();
        res.status(200).json({ success: true, data: brands });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

router.get('/categories', async (req, res) => {
  try {
        // Fetch all categories with their associated subcategories
        const categories = await Category.find().populate('subCategories');

        // Attach products to each category based on matching `category` field
        const categoriesWithProducts = await Promise.all(categories.map(async (category) => {
            const products = await Product.find({ category: category._id })
                .populate('brand')          // Optionally populate brand
                .populate('variants');      // Optionally populate variants
            return {
                ...category.toObject(),
                products,  // Attach the matched products to the category
            };
        }));

        res.status(200).json({ success: true, categories: categoriesWithProducts });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
router.post('/createProduct', async (req, res) => {
    try {
      const {
        name,
        description,
        shortDetails,
        productSpecs,
        ratings,
        metatitle,
        metakeyword,
        metadescription,
        metascript,
        price,
        discountedPrice,
        category,
        subCategory,
        subSubCategory,
        subSubSubCategory,
        subSubSubSubCategory,
        brand,
        variants,
        images,
        rating,
        numOfReviews,
        reviews,
        stock,
        isActive
      } = req.body;
  
      // Validate required fields
      if (!name || !price || !description) {
        return res.status(400).json({
          success: false,
          message: "Please provide name, price and description"
        });
      }
  
      // Helper function to safely convert to ObjectId array
      const toObjectIdArray = (value) => {
        if (Array.isArray(value)) {
          return value.map(id => new mongoose.Types.ObjectId(id));
        } else if (value) {
          return [new mongoose.Types.ObjectId(value)];
        }
        return [];
      };
  
      // Create product object with validated data
      const productData = {
        name,
        description,
        price,
        stock: stock || 0,
        isActive: isActive ?? true, // Use nullish coalescing to default to true
        
        // Optional fields with defaults
        shortDetails: shortDetails || '',
        productSpecs: productSpecs || '',
        ratings: ratings || 0,
        metatitle: metatitle || '',
        metakeyword: metakeyword || '',
        metadescription: metadescription || '',
        metascript: metascript || '',
        discountedPrice: discountedPrice || null,
        rating: rating || 0,
        numOfReviews: numOfReviews || 0,
  
        // Convert ObjectId fields if they exist
        category: category ? new mongoose.Types.ObjectId(category) : null,
        brand: brand ? new mongoose.Types.ObjectId(brand) : null,
  
        // Handle array of ObjectIds
        subCategory: toObjectIdArray(subCategory),
        subSubCategory: toObjectIdArray(subSubCategory),
        subSubSubCategory: toObjectIdArray(subSubSubCategory),
        subSubSubSubCategory: toObjectIdArray(subSubSubSubCategory),
        variants: toObjectIdArray(variants),
  
        // Handle images array
        images: images || [],
  
        // Handle reviews array with proper ObjectId conversion
        reviews: Array.isArray(reviews) ? reviews.map(review => ({
          user: new mongoose.Types.ObjectId(review.user),
          name: review.name,
          rating: review.rating,
          comment: review.comment,
          createdAt: review.createdAt || Date.now()
        })) : []
      };
  
      // Create the product
      const product = await Product.create(productData);
  
      // If product is successfully created
      res.status(201).json({
        success: true,
        message: "Product created successfully",
        product
      });
  
    } catch (error) {
      console.error('Error in createProduct:', error);
      
      // Handle specific MongoDB errors
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          message: "Validation Error",
          errors: Object.keys(error.errors).map(key => ({
            field: key,
            message: error.errors[key].message
          }))
        });
      }
  
      // Handle general errors
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message
      });
    }
  });
router.get('/getProducts',async(req,res)=>{
    try {
        const products = await Product.find().populate(['category', 'subCategory', 'subSubCategory', 'brand','variants']);
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})
router.post('/createCategory',async(req,res)=>{
    try {
        const { name,description, image, parentCategory } = req.body;
        const category = await ParentCategory.create({
            name,
            description,
            image,
            parentCategory
        });
        res.status(201).json(category);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }

})
router.get('/getCategories', async (req, res) => {
    try {
      const categories = await ParentCategory.find()
        .populate({
          path: 'subCategories',
          populate: {
            path: 'subSubCategories',
            populate: {
              path: 'subSubSubCategories',
              populate: {
                path: 'subSubSubSubCategories',
              }
            }
          }
        })
        .exec();
  
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  router.get('/getOnlyCategories', async (req, res) => {
    try {
      const categories = await ParentCategory.find()
        
  
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  router.get('/getSingleCategory/:id', async (req, res) => {
    try {
      const { id } = req.params;
  
      // Find the parent category by ID and populate its subcategories
      const category = await ParentCategory.findById(id).populate('subCategories');
  
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
  
      res.json(category);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
router.post('/createSubCategory', async (req, res) => {
    const { name, description, image, parentCategory, subSubCategories, isActive } = req.body;

  try {
    const subCategory = await SubCategory.create({
      name,
      description,
      image,
      parentCategory,
      subSubCategories,
      isActive
    });
    const savedSubCategory = await subCategory.save();

    // Step 2: Update the ParentCategory with the new SubCategory ID
    await ParentCategory.findByIdAndUpdate(
      parentCategory,
      { $push: { subCategories: savedSubCategory._id } },
      { new: true }
    );

    res.status(201).json(savedSubCategory);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
  });
  router.post('/updateSubCategory/:id', async (req, res) => {
    const { id } = req.params; // SubCategory ID to update
    const { name, description, image, parentCategory, subSubCategories, isActive } = req.body;
  
    try {
      // Find the SubCategory by ID
      const subCategory = await SubCategory.findById(id);
      if (!subCategory) {
        return res.status(404).json({ error: 'SubCategory not found.' });
      }
  
      // Update fields if they are provided
      if (name) subCategory.name = name;
      if (description) subCategory.description = description;
      if (image) subCategory.image = image;
      if (typeof isActive !== 'undefined') subCategory.isActive = isActive;
  
      // Update subSubCategories array if provided
      if (subSubCategories) subCategory.subSubCategories = subSubCategories;
  
      // Handle parentCategory update
      if (parentCategory && parentCategory !== subCategory.parentCategory) {
        // Remove SubCategory ID from the old parent's subCategories array
        await ParentCategory.findByIdAndUpdate(subCategory.parentCategory, {
          $pull: { subCategories: subCategory._id }
        });
  
        // Add SubCategory ID to the new parent's subCategories array
        await ParentCategory.findByIdAndUpdate(parentCategory, {
          $push: { subCategories: subCategory._id }
        });
  
        // Update the parentCategory field
        subCategory.parentCategory = parentCategory;
      }
  
      // Save the updated SubCategory
      const updatedSubCategory = await subCategory.save();
  
      res.status(200).json(updatedSubCategory);
    } catch (error) {
      console.error('Error updating SubCategory:', error);
      res.status(400).json({ error: error.message });
    }
  });
  router.get('/getSubCategories', async (req, res) => {
    try {
      const categories = await ParentCategory.find()
        .populate({
          path: 'subCategories',
          populate: {
            path: 'subSubCategories',
          }
        })
        .exec();
  
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  router.get('/getSubSubCategories', async (req, res) => {
    try {
      const categories = await ParentCategory.find()
        .populate({
          path: 'subCategories',
          populate: {
            path: 'subSubCategories',
            populate: {
              path: 'subSubSubCategories'
            }
          }
        })
        .exec();
  
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/getSubSubSubCategories', async (req, res) => {
    try {
      const categories = await ParentCategory.find()
        .populate({
          path: 'subCategories',
          populate: {
            path: 'subSubCategories',
            populate: {
              path: 'subSubSubCategories'
            }
          }
        })
        .exec();
  
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
//   router.post('/createSubSubSubCategory', async (req, res) => {
//     try {
//         const { name, description, parentSubSubCategoryId } = req.body;
    
//         // Step 1: Create the SubSubCategory
//         const subSubSubCategory = new SubSubSubCategory({
//           name,
//           description,
//           parentSubSubCategory: parentSubSubCategoryId
//         });
    
//         const savedSubSubSubCategory = await subSubSubCategory.save();
    
//         // Step 2: Update the SubCategory with the new SubSubCategory ID
//         await SubCategory.findByIdAndUpdate(
//           parentSubSubCategoryId,
//           { $push: { subSubSubCategories: savedSubSubSubCategory._id } },
//           { new: true }
//         );
    
//         res.status(201).json(savedSubSubSubCategory);
//       } catch (error) {
//         console.error(error);
//         res.status(500).json(error);
//       }
//   });
router.post('/createSubSubSubCategory', async (req, res) => {
    try {
      const { name, description, image, parentSubSubCategory } = req.body;
  
      // Check if parentSubCategory is provided
      if (!parentSubSubCategory) {
        return res.status(400).json({ error: 'Parent SubCategory ID is required.' });
      }
  
      // Create a new SubSubSubCategory
      const newSubSubSubCategory = new SubSubSubCategory({
        name,
        description,
        image,
        parentSubSubCategory
      });
  
      // Save the new SubSubSubCategory to the database
      const savedCategory = await newSubSubSubCategory.save();
  
      // Optionally, add the SubSubSubCategory to the parent SubCategory's subSubSubCategories array
      await SubSubCategory.findByIdAndUpdate(parentSubSubCategory, {
        $push: { subSubSubCategories: savedCategory._id }
      });
  
      res.status(201).json(savedCategory);
    } catch (error) {
      console.error("Error creating SubSubSubCategory:", error);
      res.status(500).json({ error: error.message });
    }
  });
router.post('/createSubSubCategory', async (req, res) => {
    try {
        const { name, description, parentSubCategoryId } = req.body;
    
        // Step 1: Create the SubSubCategory
        const subSubCategory = new SubSubCategory({
          name,
          description,
          parentSubCategory: parentSubCategoryId
        });
    
        const savedSubSubCategory = await subSubCategory.save();
    
        // Step 2: Update the SubCategory with the new SubSubCategory ID
        await SubCategory.findByIdAndUpdate(
          parentSubCategoryId,
          { $push: { subSubCategories: savedSubSubCategory._id } },
          { new: true }
        );
    
        res.status(201).json(savedSubSubCategory);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create sub-subcategory' });
      }
  });

  router.post('/editcategory/:id', async (req, res) => {
    const { id } = req.params;       // Extract id from URL params
    const updateFields = req.body;    // Get update fields from request body
  
    try {
      // Find the category by ID and update with fields provided in the request body
      const updatedCategory = await ParentCategory.findByIdAndUpdate(
        id,                     // Filter by ID
        { $set: updateFields },  // Update fields dynamically
        { new: true, upsert: false } // Return the updated document if found, don't create a new one
      );
  
      // If no category is found, send an error response
      if (!updatedCategory) {
        return res.status(404).json({ success: false, message: 'Category not found' });
      }
  
      // Send the updated category as a response
      return res.status(200).json({ success: true, message: 'Category updated', data: updatedCategory });
    } catch (error) {
      console.error('Error updating category:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  });
  router.post('/deletecategory/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Find the category by ID and populate subCategories and subSubCategories
        const category = await ParentCategory.findById(id).populate({
            path: 'subCategories',
            populate: {
                path: 'subSubCategories'
            }
        });

        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        // Delete all associated SubCategories and SubSubCategories
        for (const subCategory of category.subCategories) {
            await SubSubCategory.deleteMany({ _id: { $in: subCategory.subSubCategories.map(sub => sub._id) } });
            await SubCategory.findByIdAndDelete(subCategory._id);
        }

        // Delete the Category
        await ParentCategory.findByIdAndDelete(id);

        // Check and delete category references in CustomSections if categoryId matches
        const customSection = await CustomSection.findOne({ 'categoryId': id });
        if (customSection) {
            await CustomSection.deleteMany({ 'categoryId': id });
        }

        // Check and delete category references in Carousel if categoryId matches
        const carouselItem = await Carousel.findOne({ 'categoryId': id });
        if (carouselItem) {
            await Carousel.deleteMany({ 'categoryId': id });
        }

        res.status(200).json({ success: true, message: 'Category and its subcategories deleted successfully, along with associated entries in CustomSections and Carousel if they existed.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
router.post('/createsubcategory', async (req, res) => {
    try {
        const { name, categoryName } = req.body;

        // Validate input
        if (!name || !categoryName) {
            return res.status(400).json({ success: false, message: 'Name and category name are required' });
        }

        // Find the category by name
        const category = await Category.findOne({ name: categoryName });
        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        // Check if a subcategory with the same name already exists under the same category
        const existingSubCategory = await SubCategory.findOne({ name, category: category._id });
        if (existingSubCategory) {
            return res.status(400).json({ success: false, message: 'Subcategory with this name already exists in this category' });
        }

        // Create the subcategory
        const subCategory = new SubCategory({
            name,
            category: category._id // Ensure the subcategory is associated with the category
        });

        // Save the subcategory
        await subCategory.save();

        // Add the new SubCategory to the Category's subCategories array
        category.subCategories.push(subCategory._id);

        // Save the updated category
        await category.save();

        // Respond with the created subcategory and the updated category
        res.status(201).json({
            success: true,
            message: 'Subcategory created successfully',
            subCategory,
            category
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// Get all subcategories in a category
// router.get('/getsubcategories/:categoryName', async (req, res) => {
//     try {
//         const { categoryName } = req.params;

//         // Find the category by name and populate the subCategories array
//         const category = await Category.findOne({ name: categoryName }).populate('subCategories');
        
//         if (!category) {
//             return res.status(404).json({ success: false, message: 'Category not found' });
//         }

//         // Return the populated subCategories
//         res.status(200).json({ success: true, subCategories: category.subCategories });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ success: false, message: 'Server error' });
//     }
// });
router.get('/getsubcategories/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Find the category by name and populate the subCategories array
        const category = await ParentCategory.findById(id).populate('subCategories');
        
        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        // Return the populated subCategories
        res.status(200).json({ success: true, subCategories: category.subCategories });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
router.get('/getsubsubcategories/:subcategoryId', async (req, res) => {
  try {
      const { subcategoryId } = req.params;

      // Find the subcategory by its ID and populate its subSubCategories
      const subcategory = await SubCategory.findById(subcategoryId).populate('subSubCategories');

      if (!subcategory) {
          return res.status(404).json({ success: false, message: 'Subcategory not found' });
      }

      // Return the populated subSubCategories
      res.status(200).json({ success: true, subSubCategories: subcategory.subSubCategories });
  } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Server error' });
  }
});
router.get('/getsubsubsubcategories/:subSubCategoryId', async (req, res) => {
  try {
      const { subSubCategoryId } = req.params;

      // Find the subSubCategory by its ID and populate its subSubSubCategories
      const subSubCategory = await SubSubCategory.findById(subSubCategoryId).populate('subSubSubCategories');

      if (!subSubCategory) {
          return res.status(404).json({ success: false, message: 'SubSubCategory not found' });
      }

      // Return the populated subSubSubCategories
      res.status(200).json({ success: true, subSubSubCategories: subSubCategory.subSubSubCategories });
  } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Server error' });
  }
});
router.post('/deleteSubCategory/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Ensure the ID is valid
        if (!id) {
            return res.status(400).json({ success: false, message: 'SubCategory ID is required' });
        }

        // Find the subCategory by ID
        const subCategory = await SubCategory.findById(id);
        if (!subCategory) {
            return res.status(404).json({ success: false, message: 'SubCategory not found' });
        }

        // Delete all associated SubSubCategories
        if (subCategory.subSubCategories && subCategory.subSubCategories.length > 0) {
            await SubSubCategory.deleteMany({ _id: { $in: subCategory.subSubCategories } });
        }

        // Remove the subCategory from its parent Category
        const parentCategory = await ParentCategory.findOne({ subCategories: subCategory._id });
        if (parentCategory) {
            await parentCategory.updateOne({ $pull: { subCategories: subCategory._id } });
        }

        // Delete the subCategory
        await SubCategory.deleteOne({ _id: id });

        res.status(200).json({ success: true, message: 'SubCategory and its associated sub-subcategories deleted successfully' });
    } catch (error) {
        console.error('Error deleting subcategory:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});
router.post('/createsubsubcategory', async (req, res) => {
    try {
        const { name, categoryName, subCategoryName } = req.body;

        if (!name || !categoryName || !subCategoryName) {
            return res.status(400).json({ 
                success: false, 
                message: 'Name, category name, and subcategory name are required' 
            });
        }

        // Find the category by name
        const category = await Category.findOne({ name: categoryName });
        if (!category) {
            return res.status(404).json({ 
                success: false, 
                message: 'Category not found' 
            });
        }

        // Find the subcategory by name within the found category
        const subCategory = await SubCategory.findOne({ 
            name: subCategoryName, 
            _id: { $in: category.subCategories } 
        });

        if (!subCategory) {
            return res.status(404).json({ 
                success: false, 
                message: 'SubCategory not found under the specified category' 
            });
        }

        // Check if a sub-subcategory with the same name already exists
        const existingSubSubCategory = await SubSubCategory.findOne({ name });
        if (existingSubSubCategory) {
            return res.status(400).json({ 
                success: false, 
                message: 'SubSubCategory with this name already exists' 
            });
        }

        // Create the new sub-subcategory
        const subSubCategory = new SubSubCategory({ name });
        await subSubCategory.save();

        // Add the new SubSubCategory to the SubCategory
        subCategory.subSubCategories.push(subSubCategory._id);
        await subCategory.save();

        res.status(201).json({ success: true, subSubCategory });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
router.delete('/deletesubsubcategory/:name', async (req, res) => {
    try {
        const { name } = req.params;

        const subSubCategory = await SubSubCategory.findOne({ name });
        if (!subSubCategory) {
            return res.status(404).json({ success: false, message: 'SubSubCategory not found' });
        }

        // Remove the subSubCategory from its parent SubCategory
        await SubCategory.updateOne(
            { subSubCategories: subSubCategory._id },
            { $pull: { subSubCategories: subSubCategory._id } }
        );

        // Delete the subSubCategory
        await subSubCategory.deleteOne();

        res.status(200).json({ success: true, message: 'SubSubCategory deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
//craete product variant
router.post('/create-product-variant', async (req, res) => {
    try {
        const {
            productId,
            variantName,
            variantPrice,
            sizes,
            images,
            customFields,
            availableStock,
            maxQtyPerOrder,
            productSellingPrice
        } = req.body;

        // Validate required fields
        if (!productId || !variantName || !variantPrice == null || productSellingPrice == null) {
            return res.status(400).json({ message: 'productId, variant name, variant price, product MRP, and product selling price are required' });
        }

        // Check if the product exists
        const existingProduct = await Product.findById(productId);
        if (!existingProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Create new variant with the new fields
        const newVariant = new ProductVariant({
            productId,
            variantName,
            variantPrice,
            sizes: sizes || [],
            images: images || [],
            availableStock: availableStock || 0,
            maxQtyPerOrder: maxQtyPerOrder || 5,
            productSellingPrice,
            customFields: customFields || {}
        });

        // Save the new variant
        const savedVariant = await newVariant.save();

        // Update the product with the new variant ID
        if (!Array.isArray(existingProduct.variants)) {
            existingProduct.variants = [];
        }
        existingProduct.variants.push(savedVariant._id);
        await existingProduct.save();

        return res.status(201).json({
            message: 'Product variant created successfully',
            variant: savedVariant
        });
    } catch (error) {
        console.error('Error creating product variant:', error);
        return res.status(500).json({ message: 'Server error' });
    }
});
// PUT /edit-product-variant/:variantId
router.post('/edit-product-variant/:variantId', async (req, res) => {
    try {
      const { variantId } = req.params;
      const {
        variantName,
        variantPrice,
        sizes,
        images,
        customFields,
        availableStock,
        maxQtyPerOrder
      } = req.body;
  
      // Check if variant exists
      const variant = await ProductVariant.findById(variantId);
      if (!variant) {
        return res.status(404).json({ message: 'Product variant not found' });
      }
  
      // Update fields if provided in the request body
      if (variantName) variant.variantName = variantName;
      if (variantPrice) variant.variantPrice = variantPrice;
      if (sizes) variant.sizes = sizes;
      if (images) variant.images = images;
      if (customFields) variant.customFields = customFields;
      if (availableStock !== undefined) variant.availableStock = availableStock;
      if (maxQtyPerOrder !== undefined) variant.maxQtyPerOrder = maxQtyPerOrder;

  
      // Save the updated variant
      const updatedVariant = await variant.save();
      return res.status(200).json({ message: 'Product variant updated successfully', variant: updatedVariant });
  
    } catch (error) {
      console.error('Error updating product variant:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  });
  // GET /get-product-variant/:variantId
  router.get('/products/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const product = await Product.findById(id);
  
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
  
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  });
  router.get('/get-product-variant/:variantId', async (req, res) => {
    try {
      const { variantId } = req.params;
  
      // Find the variant by ID
      const variant = await ProductVariant.findById(variantId);
  
      // If the variant does not exist, return a 404 error
      if (!variant) {
        return res.status(404).json({ message: 'Product variant not found' });
      }
  
      // Return the variant data
      return res.status(200).json(variant);
    } catch (error) {
      console.error('Error fetching product variant:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  });



//get allproduct
router.post('/deleteproduct',async(req,res)=>{
    try {
        const data=await Product.deleteMany()
        res.send("deleted data")
    } catch (error) { 
        console.log(error)
        res.send(error)
    } 
})

// get products according to the filters
router.post('/products/filter', async (req, res) => {
    try {
        const { category, subCategory, subSubCategory, brand, seller, gender } = req.query;
        const query = {};

        // Retrieve ObjectIds based on names
        if (category) {
            const categoryObj = await Category.findOne({ name: category });
            if (categoryObj) query.category = categoryObj._id;
        }

        if (gender) {
            const categoryObj = await Category.findOne({ name: gender });
            if (categoryObj) query.category = categoryObj._id;
        }

        if (subCategory) {
            const subCategoryObj = await SubCategory.findOne({ name: subCategory });
            if (subCategoryObj) query.subCategory = subCategoryObj._id;
        }

        if (subSubCategory) {
            const subSubCategoryObj = await SubSubCategory.findOne({ name: subSubCategory });
            if (subSubCategoryObj) query.subSubCategory = subSubCategoryObj._id;
        }

        if (brand) {
            const brandObj = await Brand.findOne({ name: brand });
            if (brandObj) query.brand = brandObj._id;
        }

        if (seller) query.seller = seller;  

        const products = await Product.find(query).populate('category subCategory subSubCategory brand variants');
        return res.status(200).json(products);
    } catch (error) {
        console.error('Error filtering products:', error);
        return res.status(500).json({ message: 'Server error' });
    }
});

// // search product 
// router.post('/products/search', async (req, res) => {
//     try {
//         const { query } = req.query;
//         let brandId, categoryId, subCategoryId, subSubCategoryId;

//         if (query) {
//             const brand = await Brand.findOne({ name: { $regex: query, $options: 'i' } });
//             if (brand) {
//                 brandId = brand._id;
//             }

//             // Search for the category by name and get its ObjectId
//             const category = await Category.findOne({ name: { $regex: query, $options: 'i' } });
//             if (category) {
//                 categoryId = category._id;
//             }

//             // Search for the subcategory by name and get its ObjectId
//             const subCategory = await SubCategory.findOne({ name: { $regex: query, $options: 'i' } });
//             if (subCategory) {
//                 subCategoryId = subCategory._id;
//             }

//             // Search for the subsubcategory by name and get its ObjectId
//             const subSubCategory = await SubSubCategory.findOne({ name: { $regex: query, $options: 'i' } });
//             if (subSubCategory) {
//                 subSubCategoryId = subSubCategory._id;
//             }
//         }

//         // Search products based on name, description, brand, category, subcategory, or subsubcategory
//         const products = await Product.find({
//             $or: [
//                 { name: { $regex: query, $options: 'i' } },
//                 { description: { $regex: query, $options: 'i' } },
//                 ...(brandId ? [{ brand: brandId }] : []),
//                 ...(categoryId ? [{ category: categoryId }] : []),
//                 ...(subCategoryId ? [{ subCategory: subCategoryId }] : []),
//                 ...(subSubCategoryId ? [{ subSubCategory: subSubCategoryId }] : [])
//             ]
//         }).populate('category subCategory subSubCategory brand variants');

//         return res.status(200).json(products);
//     } catch (error) {
//         console.error('Error searching products:', error);
//         return res.status(500).json({ message: 'Server error' });
//     }
// });


//get single product
router.get('/products/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        return res.status(200).json(product);
    } catch (error) {
        console.error('Error fetching product:', error);
        return res.status(500).json({ message: 'Server error' });
    }
});


router.post('/update-product/:productId', async (req, res) => {
    const { productId } = req.params;
    const updateData = req.body;

    try {
        // Convert brand name to ObjectId if provided
        if (updateData.brand) {
            const brandDoc = await Brand.findById(updateData.brand);
            if (!brandDoc) return res.status(404).json({ message: "Brand not found" });
            updateData.brand = brandDoc._id;
        }

        // Convert category name to ObjectId if provided
        if (updateData.category) {
            const categoryDoc = await ParentCategory.findById( updateData.category);
            if (!categoryDoc) return res.status(404).json({ message: "Category not found" });
            updateData.category = categoryDoc._id;
        }

        // Convert subCategory name to ObjectId if provided
        if (updateData.subCategory) {
            const subCategoryDoc = await SubCategory.findById(updateData.subCategory);
            if (!subCategoryDoc) return res.status(404).json({ message: "SubCategory not found" });
            updateData.subCategory = subCategoryDoc._id;
        }

        // Convert subSubCategory name to ObjectId if provided
        if (updateData.subSubCategory) {
            const subSubCategoryDoc = await SubSubCategory.findById( updateData.subSubCategory );
            if (!subSubCategoryDoc) return res.status(404).json({ message: "SubSubCategory not found" });
            updateData.subSubCategory = subSubCategoryDoc._id;
        }
        if (updateData.subSubSubCategory) {
            const subSubCategoryDoc = await SubSubSubCategory.findById(updateData.subSubSubCategory );
            if (!subSubCategoryDoc) return res.status(404).json({ message: "SubSubCategory not found" });
            updateData.subSubCategory = subSubCategoryDoc._id;
        }


        // Exclude updatedAt field from updateData if it exists
        delete updateData.updatedAt;

        // Update the product
        const product = await Product.findByIdAndUpdate(productId, updateData, { new: true, runValidators: true })
            .populate('brand', 'name') // Only select the 'name' field of the brand
            .populate('category', 'name'); // Only select the 'name' field of the category

        if (!product) return res.status(404).json({ message: "Product not found" });

        res.status(200).json({ message: "Product updated successfully", product });
    } catch (error) {
        console.error("Error updating product:", error.message);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
});

//delete product
router.post('/deleteproduct/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const deletedProduct = await Product.findByIdAndDelete(id);
        if (!deletedProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }
        return res.status(200).json({ message: 'Product deleted successfully', product: deletedProduct });
    } catch (error) {
        console.error('Error deleting product:', error);
        return res.status(500).json({ message: 'Server error' });
    }
});


//sort by price
router.post('/products-sort-by-price', async (req, res) => {
    try {
        const sortOrder = req.query.sort === 'desc' ? -1 : 1; 

        const products = await Product.find()
            .sort({ price: sortOrder }) 
            .populate('category')
            .populate('subCategory')
            .populate('subSubCategory')
            .populate('brand')
            .populate('variants')
            .populate('user');

        res.status(200).json({
            success: true,
            count: products.length,
            products,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
        });
    }
});

router.get('/products/new-arrivals', async (req, res) => {
    try {
        const newArrivals = await Product.find({ isNewArrival: true })
            .populate('category')
            .populate('subCategory')
            .populate('subSubCategory')
            .populate('brand')
            .populate('variants');

        res.status(200).json({
            success: true,
            count: newArrivals.length,
            products: newArrivals,
        });
    } catch (error) {
        console.error("Error fetching new arrivals:", error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
        });
    }
});

router.get('/products/popular', async (req, res) => {
    try {
        const popular = await Product.find({ isTopSelling: true })
            .populate('category')
            .populate('subCategory')
            .populate('subSubCategory')
            .populate('brand')
            .populate('variants');

        res.status(200).json({
            success: true,
            count: popular.length,
            products: popular,
        });
    } catch (error) {
        console.error("Error fetching new arrivals:", error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
        });
    }
});


module.exports = router;