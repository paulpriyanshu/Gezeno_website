const express = require('express');
const router = express.Router();
// const Offer = require('../models/Offer'); // Adjust the path to your Offer model
const { Carousel,Banner,Offer,CustomSection,Header, SecondaryCarousel,SubMenu,SubCategory,SubSubCategory,SubSubSubCategory,SubSubSubSubCategory, ThirdCarousel, FourthCarousel, OurBestPicks, TooHotToBeMissed, GezenoOriginals, Widgets,ParentCategory, Product } = require('../models/product'); 

// Helper function to parse date in dd/mm/yy format
const parseDate = (dateStr) => {
    const [day, month, year] = dateStr.split('/');
    
    // Ensure all parts are valid
    if (!day || !month || !year) {
      throw new Error(`Invalid date format: ${dateStr}`);
    }
  
    // Adjust for two-digit year (e.g., "24" to "2024")
    const fullYear = year.length === 2 ? `20${year}` : year;
  
    // Create a valid date object
    const parsedDate = new Date(`${fullYear}-${month}-${day}`);
  
    // Check if the resulting date is valid
    if (isNaN(parsedDate)) {
      throw new Error(`Invalid Date: ${dateStr}`);
    }
  
    return parsedDate;
  };
const updateProductDiscounts = async (offer) => {
    const { discountType, discountValue, applicableTo, products, categories, subCategories, subSubCategories } = offer;
  
    // Check discount type is percentage
    if (discountType === "percentage") {
      if (applicableTo === "products") {
        // Update specific products
        await Product.updateMany(
          { _id: { $in: products } },
          [
            {
              $set: {
                discountedPrice: {
                  $round: [
                    { $subtract: ["$price", { $multiply: ["$price", discountValue / 100] }] },
                    2,
                  ],
                },
              },
            },
          ]
        );
      } else if (applicableTo === "categories") {
        // Update products in specific categories
        const filter = {
          $or: [
            { category: { $in: categories } },
            { subCategory: { $in: subCategories || [] } },
            { subSubCategory: { $in: subSubCategories || [] } },
          ],
        };
  
        await Product.updateMany(
          filter,
          [
            {
              $set: {
                discountedPrice: {
                  $round: [
                    { $subtract: ["$price", { $multiply: ["$price", discountValue / 100] }] },
                    2,
                  ],
                },
              },
            },
          ]
        );
      }
    }
  };
// Create a new offer
router.get('/offers',async(req,res)=>{
    const offers=await Offer.find()
    res.status(200).json({ success: true, message: 'Offer updated successfully', offers });

})
router.post('/offers/apply', async (req, res) => {
    try {
      const {
        name,
        description,
        discountType,
        discountValue,
        applicableTo,
        products,
        categories,
        subCategories,
        subSubCategories,
        startDate,
        endDate,
        banner,  // New field for banner URL
      } = req.body;
  
      const parsedStartDate = parseDate(startDate);
      const parsedEndDate = parseDate(endDate);
  
      const newOffer = new Offer({
        name,
        description,
        discountType,
        discountValue,
        applicableTo,
        products,
        categories,
        subCategories,
        subSubCategories,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        banner,  // Save the banner URL
      });
  
      // Save the offer to the database
      const savedOffer = await newOffer.save();
  
      // Update products based on the offer
      await updateProductDiscounts(savedOffer);
  
      res.status(201).json({ success: true, message: 'Offer applied successfully', offer: savedOffer });
    } catch (err) {
      res.status(400).json({ success: false, message: 'Error applying offer', error: err.message });
    }
  });

// Update an offer by ID
router.put('/:id', async (req, res) => {
    try {
      const {
        name,
        description,
        discountType,
        discountValue,
        startDate, // Expecting dd/mm/yy
        endDate, // Expecting dd/mm/yy
        applicableTo,
        products,
        categories,
        minPurchaseAmount,
        banner,  // New field for banner URL
      } = req.body;
  
      // Parse dates
      const parsedStartDate = parseDate(startDate);
      const parsedEndDate = parseDate(endDate);
  
      const updatedOffer = {
        name,
        description,
        discountType,
        discountValue,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        applicableTo,
        products,
        categories,
        minPurchaseAmount,
        banner,  // Save the banner URL
      };
  
      const offer = await Offer.findByIdAndUpdate(req.params.id, updatedOffer, { new: true });
  
      if (!offer) {
        return res.status(404).json({ success: false, message: 'Offer not found' });
      }
  
      res.status(200).json({ success: true, message: 'Offer updated successfully', offer });
    } catch (err) {
      res.status(400).json({ success: false, message: 'Error updating the offer', error: err.message });
    }
  });
module.exports=router