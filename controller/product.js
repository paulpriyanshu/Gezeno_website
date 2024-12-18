const express = require('express')
const users = require('../models/users')
const {  Brand,
    Category,
    SubCategory,
    SubSubCategory,
    Product,
    ProductVariant,} = require('../models/product')
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth')
const mongoose = require("mongoose");

const router = express.Router()


router.post('/createbrands', async (req, res) => {
    try {
        const { name } = req.body;
        if(!name){
            return res.status(400).json({ message: 'Enter name' });
        }
        const brandExists = await users.findOne({name});
        if(brandExists){
            return res.status(400).json({ message: 'Brand already exists' });
        }
        const brand = new Brand({ name });
        await brand.save();
        res.status(201).json({ success: true, data: brand });
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

router.get('/brands/:name', async (req, res) => {
    try {
        const brand = await Brand.findById(req.params.name);
        if (!brand) {
            return res.status(404).json({ success: false, message: 'Brand not found' });
        }
        res.status(200).json({ success: true, data: brand });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

router.put('/updatebrands/:name', async (req, res) => {
    try {
        const { name, isActive } = req.body;
        const brand = await Brand.findByIdAndUpdate(
            req.params.name,
            { name, isActive, updatedAt: Date.now() },
            { new: true, runValidators: true }
        );
        if (!brand) {
            return res.status(404).json({ success: false, message: 'Brand not found' });
        }
        res.status(200).json({ success: true, data: brand });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});
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
router.delete('/deletebrands/:name', async (req, res) => {
    try {
        const brand = await Brand.findByIdAndDelete(req.params.name);
        if (!brand) {
            return res.status(404).json({ success: false, message: 'Brand not found' });
        }
        res.status(200).json({ success: true, message: 'Brand deleted successfully' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

router.post('/getwomencategory/:category',async(req,res)=>{
    try {
        const data = await Product.find().populate({
            path:'category',
            match:{name:req.params.category}
        });
        if (!data) {
            return res.status(404).json({ success: false, message: 'data not found' });
        }
        res.status(200).json({ success: true, data: data });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
})

router.post('/createcategory',async(req,res)=>{
    try{
        const {name} = req.body
        if(!name) return res.status(400).json({ message: 'Enter name' });
        const data = new Category({name})
        await data.save()
        res.status(200).send(data)
    }catch(error){
        res.status(500).json({success: false, message: error.message })
    }
})

router.post('/createcategory/:catid/createsubcategory', async (req, res) => {
    try {
        const { catid } = req.params;

        // Validate the catid
        if (!mongoose.Types.ObjectId.isValid(catid)) {
            return res.status(400).json({ success: false, message: 'Invalid category ID' });
        }

        const category = await Category.findById(catid);
        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }
        
        const subCategory = new SubCategory({
            name: req.body.name,
        });

        await subCategory.save();

        // Push the subCategory ID to the category's subCategories array
        category.subCategories.push(subCategory._id);
        await category.save();

        res.status(201).json({
            success: true,
            subCategory
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.post('/createsubcategory/:subcatid/createsubsubcategory', async (req, res) => {
    try {
        const { subcatid } = req.params;

        // Validate the catid
        if (!mongoose.Types.ObjectId.isValid(subcatid)) {
            return res.status(400).json({ success: false, message: 'Invalid category ID' });
        }

        const category = await SubCategory.findById(subcatid);
        if (!category) {
            return res.status(404).json({ success: false, message: 'SubCategory not found' });
        }
        
        const subsubCategory = new SubSubCategory({
            name: req.body.name,
        });

        await subsubCategory.save();

        // Push the subCategory ID to the category's subCategories array
        SubCategory.push(subsubCategory._id);
        await SubCategory.save();

        res.status(201).json({
            success: true,
            subsubCategory
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
//craete product variant
router.post('/craete-product-variant',async(req,res)=>{
    try{
        const {productId, variantType, variantName, variantPrice} = req.body
    if (!productId || !variantType || !variantName || !variantPrice) {
        return res.status(400).json({ message: 'productId, variant type, variant name, and variant price are required' });

    }
    const existingProduct = await Product.findById(productId);
    if (!existingProduct) {
        return res.status(404).json({ message: 'Product not found' });
    }
    const newVariant = new ProductVariant({
        productId,
        variantType,
        variantName,
        variantPrice
    });
    const savedVariant = await newVariant.save();
   
    if (!Array.isArray(existingProduct.variants)) {
        existingProduct.variants = [];
    }
    existingProduct.variants.push(savedVariant._id)
    await existingProduct.save();
    return res.status(201).json({ message: 'Product variant created successfully', variant: savedVariant });
    }
    catch(error){
        console.error('Error creating product variant:', error);
        return res.status(500).json({ message: 'Server error' });
    }
})  

//get product by variant
router.post('/getproducts-by-variant', async (req, res) => {
    try {
        const { variantType, variantName } = req.query;

        if (!variantType || !variantName) {
            return res.status(400).json({ message: 'variantType and variantName are required' });
        }

        const variants = await ProductVariant.find({variantType,
            variantName,}).populate('productId');

        if (variants.length === 0) {
            return res.status(404).json({ message: 'No products found for this variant' });
        }

        const products = variants.map(variant => variant.productId);

        return res.status(200).json({ products });
    } catch (error) {
        console.error('Error fetching products by variant:', error);
        return res.status(500).json({ message: 'Server error' });
    }
});

// Create product
router.post('/createproduct', async (req, res) => {
    try {
        const { name, price, description, images, category, subCategory, subSubCategory, brand, seller, stock, userId } = req.body;

        if (!name || !price || !description || !category || !subCategory || !brand ||!subSubCategory|| !seller || !stock || !userId) {
            return res.status(400).json({ message: 'All fields are mandatory' });
        }
        let brandid
        let categoryid
        let subcategoryid
        let subsubcategoryid
        const brandexist = await Brand.findOne({"name":brand})
        if(!brandexist){
          const createbrand = new Brand({"name":brand})
          await createbrand.save()
          brandid = createbrand._id
        }else{
            brandid = brandexist._id
        }

        const subsubcategoryexist = await SubSubCategory.findOne({"name":subSubCategory})
        if(!subsubcategoryexist){
          const createsubsubcategory = new SubSubCategory({"name":subSubCategory})
          await createsubsubcategory.save()
          subsubcategoryid = createsubsubcategory._id
        }else{
            subsubcategoryid = subsubcategoryexist._id
        }

        const subcategoryexist = await SubCategory.findOne({ name: subCategory });
        if (!subcategoryexist) {
            const createsubcategory = new SubCategory({ name: subCategory, subSubCategories: [subsubcategoryid] });
            await createsubcategory.save();
            subcategoryid = createsubcategory._id;
        } else {
            subcategoryid = subcategoryexist._id;
            // Push subsubcategory into subcategory's subsubcategories array if it doesn't exist
            if (!subcategoryexist.subSubCategories.includes(subsubcategoryid)) {
                subcategoryexist.subSubCategories.push(subsubcategoryid);
                await subcategoryexist.save();
            }
        }

        const categoryexist = await Category.findOne({ name: category });
        if (!categoryexist) {
            const createcategory = new Category({ name: category, subCategories: [subcategoryid] });
            await createcategory.save();
            categoryid = createcategory._id;
        } else {
            categoryid = categoryexist._id;
            // Push subcategory into category's subcategories array if it doesn't exist
            if (!categoryexist.subCategories.includes(subcategoryid)) {
                categoryexist.subCategories.push(subcategoryid);
                await categoryexist.save();
            }
        }
       
        
        const existingProduct = await Product.findOne({
            name,
            category: categoryid,
            subCategory: subcategoryid,
            subSubCategory: subsubcategoryid,
            brand: brandid,
            seller
        });
         
        if (existingProduct) {
            return res.status(400).json({ message: 'Product already exists' });
        }
        console.log( brandid, categoryid,subcategoryid, subsubcategoryid)
        const newProduct = new Product({
            name,
            price,
            description,
            images,
            brand:brandid,
            category:categoryid,
            subCategory:subcategoryid,
            subSubCategory:subsubcategoryid,
            seller,
            stock,
            user: userId 
        });

        const savedProduct = await newProduct.save();

        return res.status(201).json({ message: 'Product created successfully', product: savedProduct });
    } catch (error) {
        console.error('Error creating product:', error);
        return res.status(500).json({ message: 'Server error' });
    }
});

//get allproduct
router.get('/getproducts',async(req,res)=>{
    try{
      const data = await Product.find().populate({path:'category',populate:{path:'subCategories',populate:{path:'subSubCategories'}}}).populate('brand')
   res.send(data)
    }catch(error){
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

// search product 
router.post('/products/search', async (req, res) => {
    try {
        const { query } = req.query;
        let brandId, categoryId, subCategoryId, subSubCategoryId;

        if (query) { 
            const brand = await Brand.findOne({ name: { $regex: query, $options: 'i' } });
            if (brand) {
                brandId = brand._id;
            }

            // Search for the category by name and get its ObjectId
            const category = await Category.findOne({ name: { $regex: query, $options: 'i' } });
            if (category) {
                categoryId = category._id;
            }

            // Search for the subcategory by name and get its ObjectId
            const subCategory = await SubCategory.findOne({ name: { $regex: query, $options: 'i' } });
            if (subCategory) {
                subCategoryId = subCategory._id;
            }

            // Search for the subsubcategory by name and get its ObjectId
            const subSubCategory = await SubSubCategory.findOne({ name: { $regex: query, $options: 'i' } });
            if (subSubCategory) {
                subSubCategoryId = subSubCategory._id;
            }
        }

        // Search products based on name, description, brand, category, subcategory, or subsubcategory
        const products = await Product.find({
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } },
                ...(brandId ? [{ brand: brandId }] : []),
                ...(categoryId ? [{ category: categoryId }] : []),
                ...(subCategoryId ? [{ subCategory: subCategoryId }] : []),
                ...(subSubCategoryId ? [{ subSubCategory: subSubCategoryId }] : [])
            ]
        }).populate('category subCategory subSubCategory brand variants');

        return res.status(200).json(products);
    } catch (error) {
        console.error('Error searching products:', error);
        return res.status(500).json({ message: 'Server error' });
    }
});


//get single product
router.post('/products/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate('variants');
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        return res.status(200).json(product);
    } catch (error) {
        console.error('Error fetching product:', error);
        return res.status(500).json({ message: 'Server error' });
    }
});


//update product 
router.post('/updateproduct/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, price, description, images, category, subCategory, subSubCategory, brand, seller, stock } = req.body;

        if (!name || !price || !description || !category || !subCategory || !brand || !subSubCategory || !seller || !stock) {
            return res.status(400).json({ message: 'All fields are mandatory' });
        }

        let brandid;
        let categoryid;
        let subcategoryid;
        let subsubcategoryid;

        const brandexist = await Brand.findOne({ name: brand });
        if (!brandexist) {
            const createbrand = new Brand({ name: brand });
            await createbrand.save();
            brandid = createbrand._id;
        } else {
            brandid = brandexist._id;
        }

        const subsubcategoryexist = await SubSubCategory.findOne({ name: subSubCategory });
        if (!subsubcategoryexist) {
            const createsubsubcategory = new SubSubCategory({ name: subSubCategory });
            await createsubsubcategory.save();
            subsubcategoryid = createsubsubcategory._id;
        } else {
            subsubcategoryid = subsubcategoryexist._id;
        }

        const subcategoryexist = await SubCategory.findOne({ name: subCategory });
        if (!subcategoryexist) {
            const createsubcategory = new SubCategory({ name: subCategory, subSubCategories: [subsubcategoryid] });
            await createsubcategory.save();
            subcategoryid = createsubcategory._id;
        } else {
            subcategoryid = subcategoryexist._id;
            if (!subcategoryexist.subSubCategories.includes(subsubcategoryid)) {
                subcategoryexist.subSubCategories.push(subsubcategoryid);
                await subcategoryexist.save();
            }
        }

        const categoryexist = await Category.findOne({ name: category });
        if (!categoryexist) {
            const createcategory = new Category({ name: category, subCategories: [subcategoryid] });
            await createcategory.save();
            categoryid = createcategory._id;
        } else {
            categoryid = categoryexist._id;
            if (!categoryexist.subCategories.includes(subcategoryid)) {
                categoryexist.subCategories.push(subcategoryid);
                await categoryexist.save();
            }
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            id,
            {
                name,
                price,
                description,
                images,
                brand: brandid,
                category: categoryid,
                subCategory: subcategoryid,
                subSubCategory: subsubcategoryid,
                seller,
                stock,
            },
            { new: true, runValidators: true }
        );

        if (!updatedProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }

        return res.status(200).json({ message: 'Product updated successfully', product: updatedProduct });
    } catch (error) {
        console.error('Error updating product:', error);
        return res.status(500).json({ message: 'Server error' });
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