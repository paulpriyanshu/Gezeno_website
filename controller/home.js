const express = require('express');
const router = express.Router();
const { Carousel,Banner,CustomSection,Header, SecondaryCarousel,SubMenu,SubCategory,SubSubCategory,SubSubSubCategory,SubSubSubSubCategory, ThirdCarousel, FourthCarousel, OurBestPicks, TooHotToBeMissed, GezenoOriginals, Widgets,ParentCategory, MobileCategoryHeader } = require('../models/product'); // Ensure to import your models
const { populate } = require('../models/users');
const mongoose=require('mongoose')


router.post('/carousel', async (req, res) => {
  try {
    const { categoryId } = req.body;
    
    // Initialize variable to determine the collection type
    let categoryType = null;

    // Check if categoryId exists in ParentCategory collection
    const parentCategory = await ParentCategory.findById(categoryId);
    if (parentCategory) {
      categoryType = 'ParentCategory';
    }

    // Check if categoryId exists in SubCategory collection
    const subCategory = await SubCategory.findById(categoryId);
    if (subCategory) {
      categoryType = 'SubCategory';
    }
    

    // Check if categoryId exists in SubSubCategory collection
    const subSubCategory = await SubSubCategory.findById(categoryId);
    if (subSubCategory) {
      categoryType = 'SubSubCategory';
    }
    const subSubSubCategory = await SubSubSubCategory.findById(categoryId);
    if (subSubSubCategory) {
      categoryType = 'SubSubSubCategory';
    }
    const subSubSubSubCategory = await SubSubSubSubCategory.findById(categoryId);
    if (subSubSubSubCategory) {
      categoryType = 'SubSubSubSubCategory';
    }
    if (!categoryType) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Create a new carousel item and assign the corresponding categoryId
    const newCarousel = new Carousel({
      categoryId,
      categoryType
    });

    // Save the carousel item to the database
    await newCarousel.save();

    return res.status(201).json({ message: 'Carousel item added', data: newCarousel });
  } catch (error) {
    return res.status(500).json({ message: 'An error occurred', error: error.message });
  }
});
  router.post('/secondarycarousel', async (req, res) => {
    try {
      const { categoryId } = req.body;
      const newCarousel = new SecondaryCarousel({ categoryId });
      await newCarousel.save();
      res.status(201).json({ message: 'Carousel item added', data: newCarousel });
    } catch (error) {
      res.status(500).json({ message: 'An error occurred', error: error.message });
    }
  });
  router.post('/secondarycarousel/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const deletedCarousel = await SecondaryCarousel.findByIdAndDelete(id);
  
      if (!deletedCarousel) {
        return res.status(404).json({ message: 'Carousel item not found' });
      }
  
      res.json({ message: 'Carousel item deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  router.post('/thirdcarousel', async (req, res) => {
    try {
      const { categoryId } = req.body;
      const newCarousel = new ThirdCarousel({ categoryId });
      await newCarousel.save();
      res.status(201).json({ message: 'Carousel item added', data: newCarousel });
    } catch (error) {
      res.status(500).json({ message: 'An error occurred', error: error.message });
    }
  });
  router.post('/thirdcarousel/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const deletedCarousel = await ThirdCarousel.findByIdAndDelete(id);
  
      if (!deletedCarousel) {
        return res.status(404).json({ message: 'Carousel item not found' });
      }
  
      res.json({ message: 'Carousel item deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  router.post('/fourthcarousel', async (req, res) => {
    try {
      const { categoryId } = req.body;
      const newCarousel = new FourthCarousel({ categoryId });
      await newCarousel.save();
      res.status(201).json({ message: 'Carousel item added', data: newCarousel });
    } catch (error) {
      res.status(500).json({ message: 'An error occurred', error: error.message });
    }
  });
  router.post('/fourthcarousel/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const deletedCarousel = await FourthCarousel.findByIdAndDelete(id);
  
      if (!deletedCarousel) {
        return res.status(404).json({ message: 'Carousel item not found' });
      }
  
      res.json({ message: 'Carousel item deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  router.post('/ourbestpicks', async (req, res) => {
    try {
      const { categoryId } = req.body;
  
      // Initialize variable to determine the collection type
      let categoryType = null;
  
      // List of collections to check dynamically
      const collections = [
        { model: ParentCategory, type: 'ParentCategory' },
        { model: SubCategory, type: 'SubCategory' },
        { model: SubSubCategory, type: 'SubSubCategory' },
        { model: SubSubSubCategory, type: 'SubSubSubCategory' },
      ];
  
      // Iterate over collections and determine the categoryType
      for (const collection of collections) {
        const category = await collection.model.findById(categoryId);
        if (category) {
          categoryType = collection.type;
          break;
        }
      }
  
      // Handle case where category is not found
      if (!categoryType) {
        return res.status(404).json({ message: 'Category not found' });
      }
  
      // Create a new ourbestpicks entry and assign the categoryId and type
      const newCarousel = new OurBestPicks({
        categoryId,
        categoryType,
      });
  
      // Save the new carousel to the database
      await newCarousel.save();
  
      return res.status(201).json({ message: 'Carousel item added', data: newCarousel });
    } catch (error) {
      return res.status(500).json({ message: 'An error occurred', error: error.message });
    }
  });
  router.post('/ourbestpicks/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const deletedCarousel = await OurBestPicks.findByIdAndDelete(id);
  
      if (!deletedCarousel) {
        return res.status(404).json({ message: 'Carousel item not found' });
      }
  
      res.json({ message: 'Carousel item deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  router.post('/toohottobemissed', async (req, res) => {
    try {
      const { categoryId } = req.body;
  
      // Initialize variable to determine the collection type
      let categoryType = null;
  
      // List of collections to check dynamically
      const collections = [
        { model: ParentCategory, type: 'ParentCategory' },
        { model: SubCategory, type: 'SubCategory' },
        { model: SubSubCategory, type: 'SubSubCategory' },
        { model: SubSubSubCategory, type: 'SubSubSubCategory' },
      ];
  
      // Iterate over collections and determine the categoryType
      for (const collection of collections) {
        const category = await collection.model.findById(categoryId);
        if (category) {
          categoryType = collection.type;
          break;
        }
      }
  
      // Handle case where category is not found
      if (!categoryType) {
        return res.status(404).json({ message: 'Category not found' });
      }
  
      // Create a new TooHotToBeMissed entry and assign the categoryId and type
      const newCarousel = new TooHotToBeMissed({
        categoryId,
        categoryType,
      });
  
      // Save the new carousel to the database
      await newCarousel.save();
  
      return res.status(201).json({ message: 'Carousel item added', data: newCarousel });
    } catch (error) {
      return res.status(500).json({ message: 'An error occurred', error: error.message });
    }
  });
  
  router.post('/toohottobemissed/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const deletedCarousel = await TooHotToBeMissed.findByIdAndDelete(id);
  
      if (!deletedCarousel) {
        return res.status(404).json({ message: 'Carousel item not found' });
      }
  
      res.json({ message: 'Carousel item deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  router.post('/gezenooriginals', async (req, res) => {
    try {
      const { categoryId } = req.body;
  
      // Initialize variable to determine the collection type
      let categoryType = null;
  
      // List of collections to check dynamically
      const collections = [
        { model: ParentCategory, type: 'ParentCategory' },
        { model: SubCategory, type: 'SubCategory' },
        { model: SubSubCategory, type: 'SubSubCategory' },
        { model: SubSubSubCategory, type: 'SubSubSubCategory' },
      ];
  
      // Iterate over collections and determine the categoryType
      for (const collection of collections) {
        const category = await collection.model.findById(categoryId);
        if (category) {
          categoryType = collection.type;
          break;
        }
      }
  
      // Handle case where category is not found
      if (!categoryType) {
        return res.status(404).json({ message: 'Category not found' });
      }
  
      // Create a new GezenoOriginals entry and assign the categoryId and type
      const newCarousel = new GezenoOriginals({
        categoryId,
        categoryType,
      });
  
      // Save the new carousel to the database
      await newCarousel.save();
  
      return res.status(201).json({ message: 'Carousel item added', data: newCarousel });
    } catch (error) {
      return res.status(500).json({ message: 'An error occurred', error: error.message });
    }
  });
  router.post('/gezenooriginals/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const deletedCarousel = await GezenoOriginals.findByIdAndDelete(id);
  
      if (!deletedCarousel) {
        return res.status(404).json({ message: 'Carousels item not found' });
      }
  
      res.json({ message: 'Carousel item deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }); 
  router.post('/widgets', async (req, res) => {
    try {
      const { categoryId } = req.body;
  
      // Initialize variable to determine the collection type
      let categoryType = null;
  
      // List of collections to check dynamically
      const collections = [
        { model: ParentCategory, type: 'ParentCategory' },
        { model: SubCategory, type: 'SubCategory' },
        { model: SubSubCategory, type: 'SubSubCategory' },
        { model: SubSubSubCategory, type: 'SubSubSubCategory' },
      ];
  
      // Iterate over collections and determine the categoryType
      for (const collection of collections) {
        const category = await collection.model.findById(categoryId);
        if (category) {
          categoryType = collection.type;
          break;
        }
      }
  
      // Handle case where category is not found
      if (!categoryType) {
        return res.status(404).json({ message: 'Category not found' });
      }
  
      // Create a new Widgets entry and assign the categoryId and type
      const newCarousel = new Widgets({
        categoryId,
        categoryType,
      });
  
      // Save the new widgets item to the database
      await newCarousel.save();
  
      return res.status(201).json({ message: 'Widgets item added', data: newCarousel });
    } catch (error) {
      return res.status(500).json({ message: 'An error occurred', error: error.message });
    }
  });
  router.post('/widgets/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const deletedCarousel = await Widgets.findByIdAndDelete(id);
  
      if (!deletedCarousel) {
        return res.status(404).json({ message: 'widgets item not found' });
      }
  
      res.json({ message: 'widgets item deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Add banner
  router.post('/banner', async (req, res) => {
    try {
      const { url,redirectUrl } = req.body;

      const newBanner=new Banner({ url,redirectUrl });
      await newBanner.save();
      res.status(201).json({ message: 'Banner added', data: newBanner });
    } catch (error) {
      res.status(500).json({ message: 'An error occurred', error: error.message });
    }
  });
  router.post('/banner/:id', async (req, res) => {
    try {
      const { id } = req.params; // Get the banner ID from the URL
      const { url, redirectUrl } = req.body; // Get the updated fields from the request body
  
      // Find the banner by ID and update it with new values
      const updatedBanner = await Banner.findByIdAndUpdate(
        id,
        { url, redirectUrl }, // Fields to update
        { new: true } // Return the updated document
      );
  
      if (!updatedBanner) {
        return res.status(404).json({ message: 'Banner not found' });
      }
  
      res.status(200).json({ message: 'Banner updated successfully', data: updatedBanner });
    } catch (error) {
      res.status(500).json({ message: 'An error occurred', error: error.message });
    }
  });
  
  // Add custom section
  router.post('/customSections', async (req, res) => {
    try {
      const { categoryId } = req.body;
  
      // Initialize variable to determine the collection type
      let categoryType = null;
  
      // List of collections to check dynamically
      const collections = [
        { model: ParentCategory, type: 'ParentCategory' },
        { model: SubCategory, type: 'SubCategory' },
        { model: SubSubCategory, type: 'SubSubCategory' },
        { model: SubSubSubCategory, type: 'SubSubSubCategory' },

      ];
  
      // Iterate over collections and determine the categoryType
      for (const collection of collections) {
        const category = await collection.model.findById(categoryId);
        if (category) {
          categoryType = collection.type;
          break;
        }
      }
  
      // Handle case where category is not found
      if (!categoryType) {
        return res.status(404).json({ message: 'Category not found' });
      }
  
      // Create a new custom section and assign the categoryId and type
      const newSection = new CustomSection({
        categoryId,
        categoryType,
      });
  
      // Save the section to the database
      await newSection.save();
  
      return res.status(201).json({ message: 'Custom section added', data: newSection });
    } catch (error) {
      return res.status(500).json({ message: 'An error occurred', error: error.message });
    }
  });
  
router.post('/carousel/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const deletedCarousel = await Carousel.findByIdAndDelete(id);
  
      if (!deletedCarousel) {
        return res.status(404).json({ message: 'Carousel item not found' });
      }
  
      res.json({ message: 'Carousel item deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
router.post('/deletebanner/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const deletedBanner = await Banner.findByIdAndDelete(id);
  
      if (!deletedBanner) {
        return res.status(404).json({ message: 'Banner not found' });
      }
  
      res.json({ message: 'Banner deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
router.post('/custom-section/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const deletedCustomSection = await CustomSection.findByIdAndDelete(id);
  
      if (!deletedCustomSection) {
        return res.status(404).json({ message: 'Custom section not found' });
      }
  
      res.json({ message: 'Custom section deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }); 
  const models = {
    ParentCategory,
    SubCategory,
    SubSubCategory,
    SubSubSubCategory
  };

  router.get('/getcarousel', async (req, res) => {
    try {
      // Fetch carousel items
      const carouselItems = await Carousel.find();
  
      // If no items found
      if (!carouselItems.length) {
        return res.status(404).json({ message: 'No carousel items found' });
      }
  
      // Populate categoryId based on categoryType
      const populatedItems = await Promise.all(
        carouselItems.map(async (item) => {
          const Model = models[item.categoryType]; // Get the model dynamically
          if (!Model) {
            return {
              ...item._doc,
              categoryData: null, // If categoryType is invalid
            };
          }
  
          // Populate category data
          const categoryData = await Model.findById(item.categoryId);
          return {
            ...item._doc,
            categoryData,
          };
        })
      );
  
      res.status(200).json({ message: 'Carousel items retrieved', data: populatedItems });
    } catch (error) {
      res.status(500).json({ message: 'Error retrieving carousel items', error: error.message });
    }
  });
  router.post('/carousel', async (req, res) => {
    const { categoryId } = req.body;
  
    if (!categoryId) {
      return res.status(400).json({ message: "categoryId is required" });
    }
  
    try {
      let categoryType = null;
  
      // Identify the schema for the given categoryId
      for (const [modelName, model] of Object.entries(models)) {
        const exists = await model.exists({ _id: categoryId });
        if (exists) {
          categoryType = modelName;
          break;
        }
      }
  
      // If no matching schema is found
      if (!categoryType) {
        return res.status(404).json({ message: "Invalid categoryId. No matching category type found." });
      }
  
      // Create and save the carousel item
      const newCarouselItem = new Carousel({ categoryId, categoryType });
      await newCarouselItem.save();
  
      res.status(201).json({ message: 'Carousel item added', data: newCarouselItem });
    } catch (error) {
      res.status(500).json({ message: 'An error occurred', error: error.message });
    }
  });
  // router.get('/onlycarousel', async (req, res) => {
  //   try {
  //     // Find all carousel items
  //     const items=await Carousel.find().populate({
  //       path:'categoryId',
  //       populate:{
  //         path:'subCategories'
  //       }
  //     })
  //     res.json((
  //       items
  //     ))
  //   } catch (error) {
  //     console.error('Error fetching carousel items:', error);
  //     res.status(500).json({ message: 'Error fetching carousel items', error: error.message });
  //   }
  // });
  
  // Helper function to return the population path based on category type
  function getPopulatePath(categoryType) {
    switch (categoryType) {
      case 'ParentCategory':
        return 'subCategories.subSubCategories.subSubSubCategories';
      case 'SubCategory':
        return 'subSubCategories.subSubSubCategories';
      case 'SubSubCategory':
        return 'subSubSubCategories';
      default:
        throw new Error('Invalid category type');
    }
  }
  
  router.get('/home/config', async (req, res) => {
    try {
      const populateCategory = async (categoryId, categoryType) => {
        if (!categoryId) return null;
        const Model = models[categoryType];
        if (!Model) return null;
        const category = await Model.findById(categoryId);
        if (!category) return null;
  
        const populatedCategory = { ...category.toObject() };
  
        const subcategoryField = 
          categoryType === 'ParentCategory' ? 'subCategories' :
          categoryType === 'SubCategory' ? 'subSubCategories' :
          categoryType === 'SubSubCategory' ? 'subSubSubCategories' :
          null;
  
        // Filter out null values and populate
        if (subcategoryField && category[subcategoryField]) {
          populatedCategory[subcategoryField] = (await Promise.all(
            category[subcategoryField]
              .filter(subCatId => subCatId !== null)
              .map(async (subCategoryId) => {
                const nextLevelType = 
                  subcategoryField === 'subCategories' ? 'SubCategory' :
                  subcategoryField === 'subSubCategories' ? 'SubSubCategory' :
                  'SubSubSubCategory';
                return await models[nextLevelType].findById(subCategoryId);
              })
          )).filter(subCat => subCat !== null);
        }
  
        return populatedCategory;
      };
  
      const populateCategoryData = async (item) => {
        if (!item.categoryId) {
          return { ...item._doc, categoryData: null }; // Ensure the item is returned even if no category
        }
  
        const categoryData = await populateCategory(item.categoryId, item.categoryType);
        return {
          ...item._doc,
          categoryData: categoryData || null,
        };
      };
  
      // Fetch and populate various sections
      const sections = [
        { key: 'carousel', model: Carousel },
        { key: 'customSections', model: CustomSection },
        { key: 'secondaryCarousel', model: SecondaryCarousel },
        { key: 'thirdCarousel', model: ThirdCarousel },
        { key: 'fourthCarousel', model: FourthCarousel },
        { key: 'ourBestPicks', model: OurBestPicks },
        { key: 'tooHotToBeMissed', model: TooHotToBeMissed },
        { key: 'gezenoOriginals', model: GezenoOriginals },
        { key: 'widgets', model: Widgets },
      ];
  
      const populatedSections = {};
      for (const section of sections) {
        const items = await section.model.find();
        const populatedItems = await Promise.all(
          items.map(populateCategoryData)
        );
        populatedSections[section.key] = populatedItems; // Allow empty arrays without filtering
      }
  
      // Fetch and populate headers with full category details
      const headers = await Header.find();
      const populatedHeaders = (await Promise.all(
        headers.map(async (header) => {
          if (!header.categoryId) return null;
          const populatedCategory = await populateCategory(header.categoryId, 'ParentCategory');
          return populatedCategory ? {
            ...header.toObject(),
            categoryId: populatedCategory
          } : null;
        })
      )).filter(header => header !== null);
  
      // Fetch banners
      const banners = await Banner.find();
  
      // Respond with the full data
      res.status(200).json({
        message: 'Home configuration fetched successfully',
        data: {
          ...populatedSections,
          banners,
          headers: populatedHeaders
        },
      });
    } catch (error) {
      res.status(500).json({ 
        message: 'An error occurred', 
        error: error.message 
      });
    }
  });
  router.post('/header', async (req, res) => {
    try {
      const { categoryId } = req.body;
      const newHeader = new Header({ categoryId });
  
      await newHeader.save();
      res.status(201).json({ message: 'Header created successfully', data: newHeader });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  router.post('/header/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const deletedHeader = await Header.findByIdAndDelete(id);
  
      if (!deletedHeader) {
        return res.status(404).json({ message: 'Header not found' });
      }
  
      res.json({ message: 'Header deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  router.get('/submenu', async (req, res) => {
    try {
      // Fetch submenu items
      const submenuItems = await SubMenu.find();
  
      // If no items found
      if (!submenuItems.length) {
        return res.status(404).json({ message: 'No submenu items found' });
      }
  
      // Define models mapping
      const models = {
        ParentCategory: ParentCategory, // Replace with actual Mongoose model
        SubCategory: SubCategory,
        SubSubCategory: SubSubCategory,
        SubSubSubCategory: SubSubSubCategory,       // Replace with actual Mongoose model
        // Add other models as needed
      };
  
      // Populate categoryId based on categoryType
      const populatedItems = await Promise.all(
        submenuItems.map(async (item) => {
          // Get the model dynamically
          const Model = models[item.categoryType];
          if (!Model) {
            return {
              ...item._doc,
              categoryData: null, // Handle invalid categoryType
            };
          }
  
          // Populate category data
          const categoryData = await Model.findById(item.categoryId).lean();
          return {
            ...item._doc,
            categoryData: categoryData || null, // Ensure categoryData is null if not found
          };
        })
      );
  
      res.status(200).json({ message: 'Submenu items retrieved', data: populatedItems });
    } catch (error) {
      res.status(500).json({ message: 'Error retrieving submenu items', error: error.message });
    }
  });
  router.post('/submenu', async (req, res) => {
    const { categoryId } = req.body;
  
    // Validate required fields    
    if (!categoryId) {
      return res.status(400).json({ message: "categoryId are required" });
    }
  
    try {
      let categoryType = null;
  
      // Identify the schema for the given categoryId
      for (const [modelName, model] of Object.entries(models)) {
        const exists = await model.exists({ _id: categoryId });
        //console.log("model eists",exists)
        if (exists) {
          categoryType = modelName;
          break;
        }
      }
  
      // If no matching schema is found
      if (!categoryType) {
        return res.status(404).json({ message: "Invalid categoryId. No matching menu type found." });
      }
  
      // Create and save the submenu item
      const newSubMenuItem = new SubMenu({ categoryId, categoryType });
      await newSubMenuItem.save();
  
      res.status(201).json({ message: 'SubMenu item added', data: newSubMenuItem });
    } catch (error) {
      res.status(500).json({ message: 'An error occurred', error: error.message });
    }
  });
  router.post('/editsubmenu/:id', async (req, res) => {
    const { id } = req.params; // ID of the SubMenu to be updated
    const { categoryId } = req.body; // New categoryId from the request body
  
    // Validate required fields
    if (!categoryId) {
      return res.status(400).json({ message: "categoryId is required." });
    }
  
    try {
      // Fetch the existing SubMenu item
      const subMenu = await SubMenu.findById(id);
  
      if (!subMenu) {
        return res.status(404).json({ message: "SubMenu item not found." });
      }
  
      // Identify the new categoryType for the given categoryId
      let categoryType = null;
      for (const [modelName, model] of Object.entries(models)) {
        const exists = await model.exists({ _id: categoryId });
        if (exists) {
          categoryType = modelName;
          break;
        }
      }
  
      // If no matching schema is found for the new categoryId
      if (!categoryType) {
        return res.status(404).json({ message: "Invalid categoryId. No matching menu type found." });
      }
  
      // Update the SubMenu item
      subMenu.categoryId = categoryId;
      subMenu.categoryType = categoryType;
  
      // Save the updated SubMenu item
      await subMenu.save();
  
      res.status(200).json({
        message: "SubMenu item updated successfully.",
        data: subMenu,
      });
    } catch (error) {
      res.status(500).json({ message: "An error occurred.", error: error.message });
    }
  });
  router.post('/submenu/:id', async (req, res) => {
    const { id } = req.params; // ID of the SubMenu to delete
  
    try {
      const subMenu = await SubMenu.findByIdAndDelete(id);
  
      if (!subMenu) {
        return res.status(404).json({ message: "SubMenu item not found." });
      }
  
      res.status(200).json({ message: "SubMenu item deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "An error occurred", error: error.message });
    }
  });
  router.get('/submenu', async (req, res) => {
    try {
      // Fetch submenu items
      const submenuItems = await MobileCategoryHeader.find();
  
      // If no items found
      if (!submenuItems.length) {
        return res.status(404).json({ message: 'No submenu items found' });
      }
  
      // Define models mapping
      const models = {
        ParentCategory: ParentCategory, // Replace with actual Mongoose model
        SubCategory: SubCategory,
        SubSubCategory: SubSubCategory,
        SubSubSubCategory: SubSubSubCategory,       // Replace with actual Mongoose model
        // Add other models as needed
      };
      // Populate categoryId based on categoryType
      const populatedItems = await Promise.all(
        submenuItems.map(async (item) => {
          // Get the model dynamically
          const Model = models[item.categoryType];
          if (!Model) {
            return {
              ...item._doc,
              categoryData: null, // Handle invalid categoryType
            };
          }
  
          // Populate category data
          const categoryData = await Model.findById(item.categoryId).lean();
          return {
            ...item._doc,
            categoryData: categoryData || null, // Ensure categoryData is null if not found
          };
        })
      );
  
      res.status(200).json({ message: 'Submenu items retrieved', data: populatedItems });
    } catch (error) {
      res.status(500).json({ message: 'Error retrieving submenu items', error: error.message });
    }
  });
  router.post('/mobileCategoryHeader', async (req, res) => {
    const { categoryId } = req.body;
  
    // Validate required fields    
    if (!categoryId) {
      return res.status(400).json({ message: "categoryId are required" });
    }
  
    try {
      let categoryType = null;
  
      // Identify the schema for the given categoryId
      for (const [modelName, model] of Object.entries(models)) {
        const exists = await model.exists({ _id: categoryId });
        //console.log("model eists",exists)
        if (exists) {
          categoryType = modelName;
          break;
        }
      }
  
      // If no matching schema is found
      if (!categoryType) {
        return res.status(404).json({ message: "Invalid categoryId. No matching menu type found." });
      }
  
      // Create and save the submenu item
      const newSubMenuItem = new MobileCategoryHeader({ categoryId, categoryType });
      await newSubMenuItem.save();
  
      res.status(201).json({ message: 'MobileCategoryHeader item added', data: newSubMenuItem });
    } catch (error) {
      res.status(500).json({ message: 'An error occurred', error: error.message });
    }
  });
  router.post('/editMobileCategoryHeader/:id', async (req, res) => {
    const { id } = req.params; // ID of the MobileCategoryHeader to be updated
    const { categoryId } = req.body; // New categoryId from the request body
  
    // Validate required fields
    if (!categoryId) {
      return res.status(400).json({ message: "categoryId is required." });
    }
  
    try {
      // Fetch the existing MobileCategoryHeader item
      const subMenu = await MobileCategoryHeader.findById(id);
  
      if (!subMenu) {
        return res.status(404).json({ message: "MobileCategoryHeader item not found." });
      }
  
      // Identify the new categoryType for the given categoryId
      let categoryType = null;
      for (const [modelName, model] of Object.entries(models)) {
        const exists = await model.exists({ _id: categoryId });
        if (exists) {
          categoryType = modelName;
          break;
        }
      }
  
      // If no matching schema is found for the new categoryId
      if (!categoryType) {
        return res.status(404).json({ message: "Invalid categoryId. No matching menu type found." });
      }
  
      // Update the MobileCategoryHeader item
      subMenu.categoryId = categoryId;
      subMenu.categoryType = categoryType;
  
      // Save the updated MobileCategoryHeader item
      await subMenu.save();
  
      res.status(200).json({
        message: "MobileCategoryHeader item updated successfully.",
        data: subMenu,
      });
    } catch (error) {
      res.status(500).json({ message: "An error occurred.", error: error.message });
    }
  });
  router.post('/mobileCategoryHeader/:id', async (req, res) => {
    const { id } = req.params; // ID of the MobileCategoryHeader to delete
  
    try {
      const subMenu = await MobileCategoryHeader.findByIdAndDelete(id);
  
      if (!subMenu) {
        return res.status(404).json({ message: "MobileCategoryHeader item not found." });
      }
  
      res.status(200).json({ message: "MobileCategoryHeader item deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "An error occurred", error: error.message });
    }
  });
  
  
  module.exports = router;