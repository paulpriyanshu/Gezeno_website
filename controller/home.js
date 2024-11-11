const express = require('express');
const router = express.Router();
const { Carousel,Banner,CustomSection,Header, SecondaryCarousel, ThirdCarousel, FourthCarousel, OurBestPicks, TooHotToBeMissed, GezenoOriginals, Widgets } = require('../models/product'); // Ensure to import your models

router.post('/carousel', async (req, res) => {
    try {
      const { categoryId } = req.body;
      const newCarousel = new Carousel({ categoryId });
      await newCarousel.save();
      res.status(201).json({ message: 'Carousel item added', data: newCarousel });
    } catch (error) {
      res.status(500).json({ message: 'An error occurred', error: error.message });
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
      const newCarousel = new OurBestPicks({ categoryId });
      await newCarousel.save();
      res.status(201).json({ message: 'Carousel item added', data: newCarousel });
    } catch (error) {
      res.status(500).json({ message: 'An error occurred', error: error.message });
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
      const newCarousel = new TooHotToBeMissed({ categoryId });
      await newCarousel.save();
      res.status(201).json({ message: 'Carousel item added', data: newCarousel });
    } catch (error) {
      res.status(500).json({ message: 'An error occurred', error: error.message });
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
      const newCarousel = new GezenoOriginals({ categoryId });
      await newCarousel.save();
      res.status(201).json({ message: 'Carousel item added', data: newCarousel });
    } catch (error) {
      res.status(500).json({ message: 'An error occurred', error: error.message });
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
      const newCarousel = new Widgets({ categoryId });
      await newCarousel.save();
      res.status(201).json({ message: 'widgets item added', data: newCarousel });
    } catch (error) {
      res.status(500).json({ message: 'An error occurred', error: error.message });
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
      const { url } = req.body;
      const newBanner = new Banner({ url });
      await newBanner.save();
      res.status(201).json({ message: 'Banner added', data: newBanner });
    } catch (error) {
      res.status(500).json({ message: 'An error occurred', error: error.message });
    }
  });
  
  // Add custom section
  router.post('/custom-section', async (req, res) => {
    try {
      const { sectionName, categoryId } = req.body;
      const newSection = new CustomSection({ sectionName, categoryId });
      await newSection.save();
      res.status(201).json({ message: 'Custom section added', data: newSection });
    } catch (error) {
      res.status(500).json({ message: 'An error occurred', error: error.message });
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
router.post('/banner/:id', async (req, res) => {
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
  router.get('/home/config', async (req, res) => {
    try {
      // Fetch all carousel items
      const carouselItems = await Carousel.find().populate('categoryId');
      
      // Fetch all banners
      const banners = await Banner.find();
      
      // Fetch all custom sections
      const customSections = await CustomSection.find()
      .populate({
        path: 'categoryId',
        populate: {
          path: 'subCategories'
        }
      });
      const secondarycarousel = await SecondaryCarousel.find()
      .populate({
        path: 'categoryId',
        populate: {
          path: 'subCategories'
        }
      });
      const thirdcarousel = await ThirdCarousel.find()
      .populate({
        path: 'categoryId',
        populate: {
          path: 'subCategories'
        }
      });
      const fourthcarousel = await FourthCarousel.find()
      .populate({
        path: 'categoryId',
        populate: {
          path: 'subCategories'
        }
      });
      const ourbestpicks = await OurBestPicks.find().populate('categoryId')
      .populate({
        path: 'categoryId',
        populate: {
          path: 'subCategories'
        }
      });;
      const toohottobemissed = await TooHotToBeMissed.find().populate('categoryId')
      .populate({
        path: 'categoryId',
        populate: {
          path: 'subCategories'
        }
      });;
      const gezenooriginals = await GezenoOriginals.find().populate('categoryId')
      .populate({
        path: 'categoryId',
        populate: {
          path: 'subCategories'
        }
      });;
      const widgets=await Widgets.find().populate('categoryId')
      .populate({
        path: 'categoryId',
        populate: {
          path: 'subCategories'
        }
      });
      // Fetch all headers
      const headers = await Header.find().populate({
        path: 'categoryId',
        populate: {
          path: 'subCategories'
        }
      });
      
      res.status(200).json({
        message: 'Home configuration fetched successfully',
        data: {
          carousel: carouselItems,
          banners: banners,
          customSections: customSections,
          headers: headers,
          secondarycarousel:secondarycarousel,
          thirdcarousel:thirdcarousel,
          fourthcarousel:fourthcarousel,
          ourbestpicks:ourbestpicks, 
          toohottobemissed:toohottobemissed,
          gezenooriginals:gezenooriginals,
          widgets:widgets
        }
      });
    } catch (error) {
      res.status(500).json({ message: 'An error occurred', error: error.message });
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
  
  module.exports = router;