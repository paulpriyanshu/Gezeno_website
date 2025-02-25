const express = require('express')
const users = require('../models/users')
const {  Brand,
    ParentCategory,
    SubCategory,
    SubSubCategory,
    SubSubSubCategory,
    SubSubSubSubCategory,
    Product,
    ProductVariant,Carousel,CustomSection,Filter,Size,Cart,
    TermsAndCondition} = require('../models/product')
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
async function getCategoryById(id, populateSubCategories = true) {
  // First, try to find the category in each schema (ParentCategory, SubCategory, etc.)
  let category = await ParentCategory.findById(id).exec();
  
  if (category) {
    if (populateSubCategories) {
      category = await category.populate({
        path: 'subCategories',
        populate: {
          path: 'subSubCategories',
          populate: {
            path: 'subSubSubCategories',
            populate: {
              path: 'subSubSubSubCategories'
            }
          }
        }
      });
    }
    return category;
  }

  category = await SubCategory.findById(id).exec();
  if (category) {
    if (populateSubCategories) {
      category = await category.populate({
        path: 'subSubCategories',
        populate: {
          path: 'subSubSubCategories',
          populate: {
            path: 'subSubSubSubCategories'
          }
        }
      });
    }
    return category;
  }

  category = await SubSubCategory.findById(id).exec();
  if (category) {
    if (populateSubCategories) {
      category = await category.populate({
        path: 'subSubSubCategories',
        populate: {
          path: 'subSubSubSubCategories'
        }
      });
    }
    return category;
  }

  category = await SubSubSubCategory.findById(id).exec();
  if (category) {
    if (populateSubCategories) {
      category = await category.populate({
        path: 'subSubSubSubCategories'
      });
    }
    return category;
  }

  category = await SubSubSubSubCategory.findById(id).exec();
  if (category) {
    return category; // No further subcategories to populate
  }
 

  return null; // Category not found in any collection
}
async function getProductsByCategory(categoryId) {
  // Fetch the category details with subcategories populated
  const category = await getCategoryById(categoryId);
  if (!category) {
    throw new Error("Category not found");
  }

  // Helper function to recursively extract all nested category IDs
  const extractCategoryIds = (cat) => {
    const ids = [cat._id];
    if (cat.subCategories) {
      for (const sub of cat.subCategories) {
        ids.push(...extractCategoryIds(sub));
      }
    }
    return ids;
  };

  // Get all nested category IDs
  const allCategoryIds = extractCategoryIds(category);

  // Query products belonging to any of these categories
  const products = await Product.find({
    $or: [
      { category: { $in: allCategoryIds } },
      { subCategory: { $in: allCategoryIds } },
      { subSubCategory: { $in: allCategoryIds } },
      { subSubSubCategory: { $in: allCategoryIds } },
      { subSubSubSubCategory: { $in: allCategoryIds } },
    ],
  })
    .select('name brand price images filters sizes subCategory')
    .populate('filters.filter', 'name') // Populate filter names
    .populate('brand', 'name') // Populate brand names
    .populate({
      path: 'subCategory',
      select: 'name description image subSubCategories',
      populate: {
        path: 'subSubCategories',
        select: 'name description image subSubSubCategories',
        populate: {
          path: 'subSubSubCategories',
          select: 'name description image subSubSubSubCategories',
          populate: {
            path: 'subSubSubSubCategories',
            select: 'name description image',
          },
        },
      },
    })
    .exec();

  return { category, products };
}
// Endpoint to get a category by its ID
router.get('/productOfCategory/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const category = await getCategoryById(id);
    console.log("this is the category",category._id)

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    const products = await getProductsByCategory(category);

    // Return only the filtered response
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching category', error: error.message });
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
      filters,
      isActive,
      sizes // Sizes array
    } = req.body;

    // Validate required fields
    if (!name || !price || !description) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, price, and description",
      });
    }

    // Helper function to safely convert to ObjectId array
    const toObjectIdArray = (value) => {
      if (Array.isArray(value)) {
        return value.map((id) => new mongoose.Types.ObjectId(id));
      } else if (value) {
        return [new mongoose.Types.ObjectId(value)];
      }
      return [];
    };

    // Process filters array
    console.log("these are filters",filters)
    const processedFilters = filters.map((filter) => ({
          filter: filter.filter._id, // Convert filter ID to ObjectId
          tags: Array.isArray(filter.tags) ? filter.tags : [], // Ensure tags is an array
        }))
      
    console.log("these are processed filters",processedFilters)
    // Process sizes array
    const processedSizes = sizes?.length>0
      ? sizes.map((size) => ({
          size: size.size._id, // Convert size ID to ObjectId
          tags: Array.isArray(size.tags) ? size.tags : [], // Ensure tags is an array
        }))
      : [];

    // Create product object with validated data
    const productData = {
      name,
      parentProduct:null,
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
      filters: processedFilters, // Assign processed filters
      sizes: processedSizes, // Assign processed sizes

      // Handle reviews array with proper ObjectId conversion
      reviews: Array.isArray(reviews)
        ? reviews.map((review) => ({
            user: new mongoose.Types.ObjectId(review.user),
            name: review.name,
            rating: review.rating,
            comment: review.comment,
            createdAt: review.createdAt || Date.now(),
          }))
        : [],
    };

    // Create the product
    const product = await Product.create(productData);
    console.log("this is uploaded",product)
    // If product is successfully created
    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.error('Error in createProduct:', error);

    // Handle specific MongoDB errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: "Validation Error",
        errors: Object.keys(error.errors).map((key) => ({
          field: key,
          message: error.errors[key].message,
        })),
      });
    }

    // Handle general errors
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});
  router.get('/getProducts', async (req, res) => {
    try {
        const products = await Product.find()
            .populate('category')
            .populate('subCategory')
            .populate('subSubCategory')
            .populate('brand')
            .populate('variants')
            .populate({
                path: 'filters.filter', // Populate the `filter` field inside the `filters` array
                model: 'Filter', // Specify the model to populate
                select: 'name tags' // Select only the `name` and `tags` fields
            }).populate({
              path:'sizes.size',
              model:'Size',
            })
         

        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
// Route to add an existing product as a variant under a parent product
router.post('/products/:parentId/add-variant/:variantId', async (req, res) => {
  try {
    const { parentId, variantId } = req.params;

    // Check if parent product exists
    const parentProduct = await Product.findById(parentId);
    if (!parentProduct) {
      return res.status(404).json({ message: 'Parent product not found' });
    }

    // Check if variant product exists
    const variantProduct = await Product.findById(variantId);
    if (!variantProduct) {
      return res.status(404).json({ message: 'Variant product not found' });
    }

    // Check if variant is already added
    if (parentProduct.variants.includes(variantId)) {
      return res.status(400).json({ message: 'Variant already linked to parent product' });
    }

    // Add the variant product's ID to the parent product's `variants` array
    parentProduct.variants.push(variantId);

    // Also set the `parentProduct` on the variant product
    variantProduct.parentProduct = parentId;

    // Save both the parent product and the variant product
    await parentProduct.save();
    await variantProduct.save();

    return res.status(200).json({ message: 'Variant added successfully', parentProduct });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});
router.get('/filters', async (req, res) => {
  try {
    const { id } = req.query; // Optional query parameter for filter ID

    if (id) {
      // Fetch a specific filter by ID
      const filter = await Filter.findById(id);
      if (!filter) {
        return res.status(404).json({
          success: false,
          message: 'Filter not found'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Filter retrieved successfully',
        filter
      });
    }

    // Fetch all filters
    const filters = await Filter.find();
    res.status(200).json({
      success: true,
      message: 'Filters retrieved successfully',
      filters
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});
router.post('/filters', async (req, res) => {
  try {
    const { name, tags } = req.body;
    console.log("name",name)
    console.log("tags",tags)

    if (!name || !tags ) {
      return res.status(400).json({
        success: false,
        message: 'Name and tags array are required'
      });
    }

    const newFilter = new Filter({ name, tags });
    await newFilter.save();

    res.status(201).json({
      success: true,
      message: 'Filter group created successfully',
      filter: newFilter
    }); 
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post('/editfilters/:id', async (req, res) => {
  try {
    const filterId = req.params.id;
    const { name, tags } = req.body;

    console.log("Editing filter with tags:", tags);

    // Fetch the existing filter group
    const existingFilter = await Filter.findById(filterId);

    if (!existingFilter) {
      return res.status(404).json({ success: false, message: 'Filter group not found' });
    }

    // Update the filter group name if provided
    if (name) existingFilter.name = name;

    // Update tags if provided
    if (tags && Array.isArray(tags)) {
      existingFilter.tags = Array.from(new Set([...existingFilter.tags, ...tags])); // Merge and remove duplicates
    }

    // Update the updatedAt timestamp
    existingFilter.updatedAt = new Date();

    // Save the updated filter group
    const updatedFilter = await existingFilter.save();

    res.status(200).json({
      success: true,
      message: 'Filter group updated successfully',
      updatedFilter
    });
  } catch (error) {
    console.error("Error updating filter:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});
router.post('/filters/:id', async (req, res) => {
  try {
    const filterId = req.params.id;

    // Fetch and delete the filter group
    const deletedFilter = await Filter.findByIdAndDelete(filterId);

    if (!deletedFilter) {
      return res.status(404).json({ success: false, message: 'Filter group not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Filter group deleted successfully'
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});
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
router.post('/sizes', async (req, res) => {
  try {
    const { name, tags } = req.body; // Expecting 'name' and 'tags' from request body

    // Create a new Size instance
    const size = new Size({ name, tags });

    // Save to the database
    await size.save();

    res.status(201).json({
      success: true,
      message: 'Size created successfully',
      size,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});
router.get('/sizes', async (req, res) => {
  try {
    // Fetch all sizes from the database
    const sizes = await Size.find();

    if (sizes.length === 0) {
      return res.status(200).json({
        success: false,
        message: 'No sizes found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Sizes retrieved successfully',
      sizes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get Size by ID API
router.get('/sizes/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch the size by its ID
    const size = await Size.findById(id);

    if (!size) {
      return res.status(404).json({
        success: false,
        message: 'Size not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Size retrieved successfully',
      size,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});
// Update Size API
router.post('/sizes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, tags } = req.body;

    // Validate input: Check if tags is an array (if provided) or name is provided
    if (!name && (!tags || !Array.isArray(tags))) {
      return res.status(400).json({
        success: false,
        message: 'At least one field (name or tags) must be provided for updating.',
      });
    }

    // Find the size by ID
    const size = await Size.findById(id);

    if (!size) {
      return res.status(404).json({
        success: false,
        message: 'Size not found.',
      });
    }

    // Replace the entire tags array if provided
    if (tags && Array.isArray(tags)) {
      size.tags = tags; // Replace with the new tags array
    }

    // Update the name if provided
    if (name) {
      size.name = name;
    }

    // Update the timestamp
    size.updatedAt = Date.now();

    // Save the updated size
    await size.save();

    res.status(200).json({
      success: true,
      message: 'Size updated successfully with new tags.',
      size,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});
router.get('/getFlatCategories', async (req, res) => {
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
            },
          },
        },
      })
      .exec();

    // Recursive function to flatten all categories
    const flattenCategories = (categoryList) => {
      let flatList = [];
      for (const category of categoryList) {
        // Add the current category with its id, name, and schema name
        flatList.push({
          _id: category._id,
          name: category.name,
          schema: 'ParentCategory' // The schema name (hardcoded, since it's a parent category)
        });

        // If there are subcategories, flatten them
        if (category.subCategories && category.subCategories.length > 0) {
          flatList = flatList.concat(flattenCategories(category.subCategories));
        }
        if (category.subSubCategories && category.subSubCategories.length > 0) {
          flatList = flatList.concat(flattenCategories(category.subSubCategories));
        }
        if (category.subSubSubCategories && category.subSubSubCategories.length > 0) {
          flatList = flatList.concat(flattenCategories(category.subSubSubCategories));
        }
        if (category.subSubSubSubCategories && category.subSubSubSubCategories.length > 0) {
          flatList = flatList.concat(flattenCategories(category.subSubSubSubCategories));
        }
      }
      return flatList;
    };

    const flatCategories = flattenCategories(categories);

    res.json(flatCategories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
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
      const categories = await ParentCategory.find();
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
      const categories = await SubCategory.find().populate({
        path:'parentCategory'
      })
  
  
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  router.get('/getSubSubCategories', async (req, res) => {
    try {
      const categories = await SubSubCategory.find()
  
      
  
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/getSubSubSubCategories', async (req, res) => {
    try {
      const categories = await SubSubSubCategory.find()
  
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: error.message });
    } 
  });


  
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
      await SubSubCategory.pdate(parentSubSubCategory, {
        $push: { subSubSubCategories: savedCategory._id }
      });
  
      res.status(201).json(savedCategory);
    } catch (error) {
      console.error("Error creating SubSubSubCategory:", error);
      res.status(500).json({ error: error.message });
    }
  });
  router.post('/deleteSubSubSubCategory/:id', async (req, res) => {
    try {
      const { id } = req.params;
  
      // Check if ID is provided
      if (!id) {
        return res.status(400).json({ error: 'SubSubSubCategory ID is required.' });
      }
  
      // Find the SubSubSubCategory to delete
      const subSubSubCategory = await SubSubSubCategory.findById(id);
  
      if (!subSubSubCategory) {
        return res.status(404).json({ error: 'SubSubSubCategory not found.' });
      }
  
      // Remove the SubSubSubCategory from the parent SubSubCategory's subSubSubCategories array
      await SubSubCategory.findByIdAndUpdate(subSubSubCategory.parentSubSubCategory, {
        $pull: { subSubSubCategories: id }
      });
  
      // Delete the SubSubSubCategory
      await SubSubSubCategory.findByIdAndDelete(id);
  
      res.status(200).json({ message: 'SubSubSubCategory deleted successfully.' });
    } catch (error) {
      console.error('Error deleting SubSubSubCategory:', error);
      res.status(500).json({ error: error.message });
    }
  });
  router.post('/updateSubSubSubCategory/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, image, parentSubSubCategory } = req.body;
  
      // Check if the SubSubSubCategory exists
      const existingCategory = await SubSubSubCategory.findById(id);
      if (!existingCategory) {
        return res.status(404).json({ error: 'SubSubSubCategory not found.' });
      }
  
      // Handle the change of parentSubSubCategory (optional)
      if (parentSubSubCategory && parentSubSubCategory !== existingCategory.parentSubSubCategory) {
        // Remove the category from the old parent's subSubSubCategories array
        await SubSubCategory.findByIdAndUpdate(existingCategory.parentSubSubCategory, {
          $pull: { subSubSubCategories: id }
        });
  
        // Add the category to the new parent's subSubSubCategories array
        await SubSubCategory.findByIdAndUpdate(parentSubSubCategory, {
          $push: { subSubSubCategories: id }
        });
      }
  
      // Update the SubSubSubCategory
      const updatedCategory = await SubSubSubCategory.findByIdAndUpdate(
        id,
        {
          name,
          description,
          image,
          parentSubSubCategory: parentSubSubCategory || existingCategory.parentSubSubCategory,
        },
        { new: true } // Return the updated document
      );
  
      res.status(200).json(updatedCategory);
    } catch (error) {
      console.error('Error updating SubSubSubCategory:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
router.post('/createSubSubCategory', async (req, res) => {
    try {
      const { name, description, image, parentSubCategory, subSubSubCategories, isActive } = req.body;
    
        // Step 1: Create the SubSubCategory
        const subSubCategory = await SubSubCategory.create({
          name,
          description,
          image,
          parentSubCategory,
          subSubSubCategories,
          isActive 
        });

    
    
        const savedSubSubCategory = await subSubCategory.save();
    
        // Step 2: Update the SubCategory with the new SubSubCategory ID
        await SubCategory.findByIdAndUpdate(
          parentSubCategory, 
          { $push: { subSubCategories: savedSubSubCategory._id } }, 
          { new: true }
        );
    
        res.status(201).json(savedSubSubCategory);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create sub-subcategory' });
      }
  });
  router.post('/updateSubSubCategory/:id', async (req, res) => {
    try {
      const { id } = req.params; // ID of the sub-subcategory to update
      const { name, description, image, parentSubCategory, isActive } = req.body;
  
      // Step 1: Find the existing sub-subcategory
      const existingSubSubCategory = await SubSubCategory.findById(id);
      if (!existingSubSubCategory) {
        return res.status(404).json({ error: 'Sub-subcategory not found' });
      }
  
      // Step 2: Handle parentSubCategoryId change
      if (parentSubCategory && parentSubCategory !== existingSubSubCategory.parentSubCategory) {
        // Remove sub-subcategory ID from the old parent subcategory
        if (existingSubSubCategory.parentSubCategory) {
          await SubCategory.findByIdAndUpdate(
            existingSubSubCategory.parentSubCategory,
            { $pull: { subSubCategories: id } },
            { new: true }
          );
        }
  
        // Add sub-subcategory ID to the new parent subcategory
        await SubCategory.findByIdAndUpdate(
          parentSubCategory,
          { $push: { subSubCategories: id } },
          { new: true }
        );
      }
  
      // Step 3: Update the sub-subcategory details
      const updatedSubSubCategory = await SubSubCategory.findByIdAndUpdate(
        id,
        {
          name,
          description,
          image,
          parentSubCategory,
          isActive,
        },
        { new: true }
      );
  
      res.status(200).json(updatedSubSubCategory);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to update sub-subcategory' });
    }
  });
  router.post('/deleteSubSubCategory/:id', async (req, res) => {
    try {
      const { id } = req.params; // ID of the sub-subcategory to delete
  
      // Step 1: Find the existing SubSubCategory
      const existingSubSubCategory = await SubSubCategory.findById(id);
      if (!existingSubSubCategory) {
        return res.status(404).json({ error: 'Sub-subcategory not found' });
      }
  
      const { parentSubCategoryId, subSubSubCategories } = existingSubSubCategory;
  
      // Step 2: Remove the SubSubCategory ID from the parent SubCategory
      if (parentSubCategoryId) {
        await SubCategory.findByIdAndUpdate(
          parentSubCategoryId,
          { $pull: { subSubCategories: id } },
          { new: true }
        );
      }
  
      // Step 3: Delete all associated SubSubSubCategories
      if (subSubSubCategories && subSubSubCategories.length > 0) {
        await SubSubSubCategory.deleteMany({ _id: { $in: subSubSubCategories } });
      }
  
      // Step 4: Delete the SubSubCategory
      await SubSubCategory.findByIdAndDelete(id);
  
      res.status(200).json({ message: 'Sub-subcategory and its sub-sub-subcategories deleted successfully' });
    } catch (error) {
      console.error('Error deleting sub-subcategory:', error);
      res.status(500).json({ error: 'Failed to delete sub-subcategory' });
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
router.get('/onlysubcategories/:id', async (req, res) => {
  try {
      const { id } = req.params;

      // Find the category by name and populate the subCategories array
      const category = await SubCategory.findById(id).populate('subCategories');
      
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
router.get('/getcategory/:categoryId', async (req, res) => {
  const { categoryId } = req.params;

  try {
    let categoryType = null;
    let data = null;

    // Check each category collection in sequence
    if (!data) data = await ParentCategory.findById(categoryId);
    if (data) categoryType = 'ParentCategory';

    if (!data) data = await SubCategory.findById(categoryId);
    if (data) categoryType = 'SubCategory';

    if (!data) data = await SubSubCategory.findById(categoryId);
    if (data) categoryType = 'SubSubCategory';

    if (!data) data = await SubSubSubCategory.findById(categoryId);
    if (data) categoryType = 'SubSubSubCategory';

    if (!data) data = await SubSubSubSubCategory.findById(categoryId);
    if (data) categoryType = 'SubSubSubSubCategory';

    if (!data) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Return the found category
    res.status(200).json({ categoryType, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


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
router.get('/hello',async(req,res)=>{
  res.json({
    msg:'hello '
  })
})
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
      filters,
      images,
      customFields,
      availableStock,
      maxQtyPerOrder,
      commingSoon,
      isActive,
    } = req.body;

    // Validate required fields
    if (!productId || !variantName || variantPrice == null) {
      return res.status(400).json({
        message: 'Product ID, variant name, and variant price are required',
      });
    }

    // Check if the product exists
    const existingProduct = await Product.findById(productId);
    if (!existingProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Validate and set sizes
    console.log("these are filters",filters)
    const formattedFilters = filters.map((filter) => ({
          filter: filter.filter._id, // Convert filter ID to ObjectId
          tags: Array.isArray(filter.tags) ? filter.tags : [], // Ensure tags is an array
        }))
      
    // console.log("these are processed filters",processedFilters)
    // Process sizes array
    const formattedSizes = sizes?.length>0
      ? sizes.map((size) => ({
          size: size.size._id, // Convert size ID to ObjectId
          tags: Array.isArray(size.tags) ? size.tags : [], // Ensure tags is an array
        }))
      : [];
    // Create new variant with the new fields
    const newVariant = new ProductVariant({
      productId,
      variantName,
      variantPrice,
      sizes: formattedSizes,
      filters: formattedFilters,
      images: images || [],
      availableStock: availableStock || 0,
      maxQtyPerOrder: maxQtyPerOrder || 5,
      commingSoon: commingSoon || false,
      isActive: isActive ?? true,
      customFields: customFields || {},
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
      variant: savedVariant,
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
  router.get('/products/:id', async (req, res) => {
    try {
      const { id } = req.params;
  
      // Find the product and populate all required fields
      const product = await Product.findById(id)
        .populate({
          path: 'filters.filter', // Populate filters inside product
          select: 'name',
        })
        .populate({
          path: 'sizes.size', // Populate sizes inside product
          select: 'name',
        })
        .populate({
          path: 'variants', // Populate variants (which are also products)
          populate: [
            {
              path: 'filters.filter', // Populate filters inside each variant
              select: 'name',
            },
            {
              path: 'sizes.size', // Populate sizes inside each variant
              select: 'name',
            },
          ],
        })
        .populate({
          path: 'parentProduct', // Populate the parentProduct if it's a variant
          select: 'name price filters sizes variants', // Select necessary fields
          populate: [
            {
              path: 'filters.filter', // Populate filters inside parent product
              select: 'name',
            },
            {
              path: 'sizes.size', // Populate sizes inside parent product
              select: 'name',
            },
            {
              path: 'variants', // Populate variants of the parent product
              populate: [
                {
                  path: 'filters.filter', // Populate filters inside each variant of the parent product
                  select: 'name',
                },
                {
                  path: 'sizes.size', // Populate sizes inside each variant of the parent product
                  select: 'name',
                },
              ],
            },
          ],
        });
  
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
  
      res.json(product);
    } catch (error) {
      console.error('Error fetching product:', error.message);
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
  router.post('/delete-product-variant/:variantId', async (req, res) => {
    try {
      const { variantId } = req.params;
  
      // Find the variant by ID
      const variant = await ProductVariant.findByIdAndDelete(variantId);
  
      // If the variant does not exist, return a 404 error
      if (!variant) {
        return res.status(404).json({ message: 'Product variant not found' });
      }
  
  
      // Return a success message
      return res.status(200).json({ message: 'Product variant deleted successfully' });
    } catch (error) {
      console.error('Error deleting product variant:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  });
  router.get('/get-product-variants/:productId', async (req, res) => {
    try {
      const { productId } = req.params;
  
      // Find variants by productId 
      const variants = await ProductVariant.find({ productId })
        .populate('productId', 'name')  // Populate product details, e.g., product name

  
      // If no variants are found for the product, return a 404 error
      if (variants.length === 0) {
        return res.status(200).json({ message: 'No variants found for this product' });
      }
  
      // Return the variants data
      return res.status(200).json({
        success: true,
        data: variants,
      });
    } catch (error) {
      console.error('Error fetching product variants:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  });



//get allproduct
router.post('/deleteproduct',async(req,res)=>{
    try {
        const data=await Product.deleteMany()
        res.send("deleted data")
    } catch (error) { 
        //console.log(error)
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


router.post('/Update-Product/:productId', async (req, res) => {
  // console.log("hello")
  const { productId } = req.params;
  const updateData = req.body;

  try {
    // Convert brand name to ObjectId if provided
    if (updateData.brand && updateData.brand.trim() !== "") {
      const brandDoc = await Brand.findById(updateData.brand);
      if (!brandDoc) return res.status(404).json({ message: "Brand not found" });
      updateData.brand = brandDoc._id;
    } else {
      updateData.brand = null; // Ensure brand is set to null if it's not provided or empty
    }

    // Convert category name to ObjectId if provided
    if (updateData.category) {
      const categoryDoc = await ParentCategory.findById(updateData.category);
      if (!categoryDoc) return res.status(404).json({ message: "Category not found" });
      updateData.category = categoryDoc._id;
    }

    // Convert subCategory name to ObjectId if provided
    if (updateData.subCategory) {
      const subCategoryDoc = await SubCategory.findById(updateData.subCategory);
      if (!subCategoryDoc) return res.status(404).json({ message: "SubCategory not found" });
      updateData.subCategory = subCategoryDoc._id;
    }

    // Handle filters update
    if (updateData.filters?.length > 0) {
      const updatedFilters = [];
      for (const filterObj of updateData.filters) {
        const { filter, tags } = filterObj;

        // Validate filter existence
        const filterDoc = await Filter.findById(filter);
        if (!filterDoc) {
          return res.status(404).json({ message: `Filter with ID ${filter} not found` });
        }

        // Push the valid filter to the array
        updatedFilters.push({ filter: filterDoc._id, tags: tags || [] });
      }
      updateData.filters = updatedFilters;
    }

    // Handle sizes update
    if (updateData.sizes?.length > 0) {
      const updatedSizes = [];
      for (const sizeObj of updateData.sizes) {
        const { size, tags } = sizeObj;

        // Validate size existence
        const sizeDoc = await Size.findById(size);
        if (!sizeDoc) {
          return res.status(404).json({ message: `Size with ID ${size} not found` });
        }

        // Push the valid size to the array
        updatedSizes.push({ size: sizeDoc._id, tags: tags || [] });
      }
      updateData.sizes = updatedSizes;
    }

    // Handle new variants
    // if (variants?.length > 0) {
    //   const newVariants = [];
    //   for (const variant of variants) {
    //     const {
    //       variantName,
    //       variantPrice,
    //       sizes,
    //       images,
    //       availableStock,
    //       maxQtyPerOrder,
    //       productSellingPrice,
    //       customFields,
    //     } = variant;

    //     // Create the new variant
    //     const newVariant = new ProductVariant({
    //       productId,
    //       variantName,
    //       variantPrice,
    //       sizes: sizes || [],
    //       images: images || [],
    //       availableStock: availableStock || 0,
    //       maxQtyPerOrder: maxQtyPerOrder || 5,
    //       productSellingPrice,
    //       customFields: customFields || {},
    //     });

    //     const savedVariant = await newVariant.save();
    //     newVariants.push(savedVariant);
    //   }

    //   // Add new variant IDs to the product's variant list
    //   const existingProduct = await Product.findById(productId);
    //   if (!existingProduct) return res.status(404).json({ message: "Product not found" });

    //   existingProduct.variants.push(...newVariants.map((v) => v._id));
    //   await existingProduct.save();
    // }

    // Exclude updatedAt field from updateData if it exists
    delete updateData.updatedAt;

    // Update the product
    const product = await Product.findByIdAndUpdate(productId, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("brand", "name") // Only select the 'name' field of the brand
      .populate("category", "name") // Only select the 'name' field of the category
      .populate("filters.filter", "name") // Populate filters
      .populate("sizes.size", "name") // Populate sizes
      .populate("variants", "variantName variantPrice sizes images");

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
router.post('/cart', async (req, res) => {
  try {
    const { cart } = req.body; // Expecting an array of product IDs
    const newCart = new Cart({ cart });
    await newCart.save();
    res.status(201).json(newCart);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get all carts
 */
router.get('/cart', async (req, res) => { 
  try {
    const carts = await Cart.find() // Populating product details
    
    // Extract only the array of products from each cart document
    const productsArray = carts.map((cart) => cart.cart);

    res.status(200).json(productsArray);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get a specific cart by ID
 */
router.get('/cart/:id', async (req, res) => {
  try {
    const cart = await Cart.findById(req.params.id).populate('cart');
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }
    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Update a cart (add/remove products)
 */
router.post('/updateCart/:id', async (req, res) => {
  try {
    const { cart } = req.body; // Expecting an updated array of product IDs
    const updatedCart = await Cart.findByIdAndUpdate(
      req.params.id,
      { cart },
      { new: true, runValidators: true } // `new: true` returns the updated document
    ).populate('cart');
    if (!updatedCart) {
      return res.status(404).json({ message: 'Cart not found' });
    }
    res.status(200).json(updatedCart);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Delete a cart
 */
router.post('/deleteCart/:id', async (req, res) => {
  try {
    const deletedCart = await Cart.findByIdAndDelete(req.params.id);
    if (!deletedCart) {
      return res.status(404).json({ message: 'Cart not found' });
    }
    res.status(200).json({ message: 'Cart deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



router.post('/search/:term', async (req, res) => {
  try {
    const term = req.params.term;
    const regex = new RegExp(term, 'i'); // Case-insensitive regex for searching
    const results = {};

    // Search in Parent Categories
    results.parentCategories = await ParentCategory.find({
      $or: [{ name: regex }, { description: regex }],
    }).populate('subCategories');

    // Search in Subcategories
    results.subCategories = await SubCategory.find({
      $or: [{ name: regex }, { description: regex }],
    }).populate('parentCategory subSubCategories');

    // Search in Sub-Subcategories
    results.subSubCategories = await SubSubCategory.find({
      $or: [{ name: regex }, { description: regex }],
    }).populate('parentSubCategory subSubSubCategories');

    // Search in Sub-Sub-Subcategories
    results.subSubSubCategories = await SubSubSubCategory.find({
      $or: [{ name: regex }, { description: regex }],
    }).populate('parentSubSubCategory subSubSubSubCategories');

    // Search in Sub-Sub-Sub-Subcategories
    results.subSubSubSubCategories = await SubSubSubSubCategory.find({
      $or: [{ name: regex }, { description: regex }],
    }).populate('parentSubSubSubCategory');

    // Search in Products
    results.products = await Product.find({
      $or: [
        { name: regex },
        { description: regex },
        { shortDetails: regex },
        { metatitle: regex },
        { metakeyword: regex },
        { metadescription: regex },
      ],
    }).populate(
      'category subCategory subSubCategory subSubSubCategory subSubSubSubCategory brand'
    );

    res.status(200).json({
      success: true,
      message: 'Search results retrieved successfully',
      data: results,
    });
  } catch (err) {
    console.error('Error while searching:', err);
    res.status(500).json({
      success: false,
      message: 'Error while searching',
      error: err.message
    });
  }
});
router.post('/terms-and-conditions', async (req, res) => {
  const { terms, privacyPolicy, returns, cancellation,aboutus,contactus } = req.body;

  try {
    // Find an existing document or create a new one
    const updatedTerms = await TermsAndCondition.findOneAndUpdate(
      {}, // Empty filter means it looks for the first document (or none)
      {
        terms, // Update or set these fields
        privacyPolicy,
        returns,
        cancellation,
        aboutus,
        contactus
      },
      {
        new: true, // Return the updated document
        upsert: true, // Create a new document if none exists
      }
    );

    res.status(201).json({ message: 'Terms saved successfully', data: updatedTerms });
  } catch (error) {
    res.status(500).json({ error: 'Error saving terms', details: error.message });
  }
});

// GET Route to Fetch Terms and Conditions
router.get('/terms-and-conditions', async (req, res) => {
  try {
    const termsData = await TermsAndCondition.findOne(); // Fetch the first document
    if (!termsData) {
      return res.status(404).json({
        terms: "",
        privacyPolicy: "",
        returns: "",
        cancellation: "",
        aboutus:"",
        contactus:""
      });
    }
    res.status(200).json(termsData);
  } catch (error) {
    res.status(500).json({ error: "Error fetching terms and conditions" });
  }
});
// Example Usage
// searchAll('searchTerm')
//   .then((results) => {
//     console.log('Search Results:', results);
//   })
//   .catch((err) => console.error(err));




module.exports = router;