// const express = require('express')
// const { Product, Brand,
//     Category,
//     SubCategory,
//     SubSubCategory, } = require('../models/product')
// const {RecentSearch,MostSearch} = require('../models/search')
// const nodemailer = require('nodemailer');
// const passport = require('passport')
// const bcrypt = require('bcryptjs');
// const crypto = require('crypto');
// const jwt = require('jsonwebtoken');
// const { body, validationResult } = require('express-validator');
// const dotenv = require('dotenv');
// const auth = require('../middleware/auth')
// const { Client } = require('@elastic/elasticsearch');
// const router = express.Router()
// const mongoose = require("mongoose");
// const users = require('../models/users');


// const client = new Client({
//     node: 'http://localhost:9200',
//     requestTimeout: 120000, // Set the timeout to 60 seconds (60000 milliseconds)
//     sniffOnStart: true
// });

// // const createIndex = async () => {
// //     try {
// //         await client.indices.create({
// //             index: 'products',
// //             body: {
// //                 mappings: {
// //                     properties: {
// //                         name: { type: 'text' },
// //                         description: { type: 'text' },
// //                         price: { type: 'double' },
// //                         category: { type: 'keyword' },
// //                         subCategory: { type: 'keyword' },
// //                         subSubCategory: { type: 'keyword' },
// //                         brand: { type: 'keyword' },
// //                         suggest: { 
// //                             type: 'completion', 
// //                             analyzer: 'simple', 
// //                             search_analyzer: 'simple' 
// //                         }
// //                     }
// //                 }
// //             }
// //         });

// //         //console.log('Index created successfully!');
// //     } catch (error) {
// //         console.error('Error creating index:', error);
// //     }
// // };

// // // Call the function to create the index
// // createIndex();

// // const createNewIndex = async () => {
// //     try {
// //         await client.indices.create({
// //             index: 'products_v2',
// //             body: {
// //                 mappings: {
// //                     properties: {
// //                         name: { type: 'text' },
// //                         description: { type: 'text' },
// //                         price: { type: 'double' },
// //                         category: { type: 'keyword' },
// //                         subCategory: { type: 'keyword' },
// //                         subSubCategory: { type: 'keyword' },
// //                         brand: { type: 'keyword' },
// //                         suggest: {
// //                             type: 'completion',
// //                             analyzer: 'simple',
// //                             search_analyzer: 'simple'
// //                         }
// //                     }
// //                 }
// //             }
// //         });

// //         //console.log('New index created successfully!');
// //     } catch (error) {
// //         console.error('Error creating new index:', error);
// //     }
// // };

// // createNewIndex();

// // const reindexData = async () => {
// //     try {
// //         await client.reindex({
// //             body: {
// //                 source: {
// //                     index: 'products'
// //                 },
// //                 dest: {
// //                     index: 'products_v2'
// //                 }
// //             }
// //         });

// //         //console.log('Data reindexed successfully!');
// //     } catch (error) {
// //         console.error('Error reindexing data:', error);
// //     }
// // };

// // reindexData();




// //create product index
// // async function indexProducts() {
// //     try {


// //         const products = await Product.find().populate('brand').populate('category').populate('subCategory').populate('subSubCategory').populate('brand');
// //         //console.log(products)
// //         for (const product of products) {
// //             // //console.log(product.category.name)
            
// //             await client.index({
// //                 index: 'products_v2',
// //                 id: product._id.toString(),
// //                 body: {
// //                     name: product.name,
// //                     description: product.description,
// //                     price: product.price,
// //                     category: product.category.name,
// //                     subCategory: product.subCategory.name,
// //                     subSubCategory: product.subSubCategory.name,
// //                     brand:product.brand.name,
// //                     suggest: {
// //                         input: [product.name, product.category.name, product.subCategory.name, product.subSubCategory.name,product.brand.name], // Fields used for suggestions
// //                         weight: 1,
// //                     },
// //                 },
// //             });
// //         }
        
// //         //console.log('Products indexed successfully with suggest field!');
// //     } catch (error) {
// //         console.error('Error indexing products:', error);
// //     }
// // }

// // indexProducts();


// router.post('/search/suggestion', async (req, res) => {
//     try {
//         const query = req.query.q;
//         if (!query ) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Search query is required.',
//             });
//         }
//         //console.log(typeof query)


//         const  body  = await client.search({
//             index: 'products_v2',
//             body: {
//                 suggest: {
//                     productSuggest: {
//                         prefix: query,
//                         completion: {
//                             field: 'suggest',
//                             fuzzy: {
//                                 fuzziness: 2,
//                             },
//                             size: 5,
//                         },
//                     },
//                 },
//             },
//         });
//         //console.log(body.suggest.productSuggest[0].options);
//         const suggestions = body.suggest?.productSuggest?.[0]?.options?.map(option => option.text) || [];;

//         res.status(200).json({
//             success: true,
//             suggestions,
//         });
//     } catch (error) {
//         console.error('Error fetching suggestions:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Server Error',
//         });
//     }
// });

// // router.post('/search', async (req, res) => {
// //     try {
// //         const { query } = req.query;
// //         let brandId, categoryId, subCategoryId, subSubCategoryId;

// //         if (query) {
// //             const brand = await Brand.findOne({ name: { $regex: query, $options: 'i' } });
// //             if (brand) {
// //                 brandId = brand._id;
// //             }

// //             // Search for the category by name and get its ObjectId
// //             const category = await Category.findOne({ name: { $regex: query, $options: 'i' } });
// //             if (category) {
// //                 categoryId = category._id;
// //             }

// //             // Search for the subcategory by name and get its ObjectId
// //             const subCategory = await SubCategory.findOne({ name: { $regex: query, $options: 'i' } });
// //             if (subCategory) {
// //                 subCategoryId = subCategory._id;
// //             }

// //             // Search for the subsubcategory by name and get its ObjectId
// //             const subSubCategory = await SubSubCategory.findOne({ name: { $regex: query, $options: 'i' } });
// //             if (subSubCategory) {
// //                 subSubCategoryId = subSubCategory._id;
// //             }
// //         }

// //         // Search products based on name, description, brand, category, subcategory, or subsubcategory
// //         const products = await Product.find({
// //             $or: [
// //                 { name: { $regex: query, $options: 'i' } },
// //                 { description: { $regex: query, $options: 'i' } },
// //                 ...(brandId ? [{ brand: brandId }] : []),
// //                 ...(categoryId ? [{ category: categoryId }] : []),
// //                 ...(subCategoryId ? [{ subCategory: subCategoryId }] : []),
// //                 ...(subSubCategoryId ? [{ subSubCategory: subSubCategoryId }] : [])
// //             ]
// //         }).populate('category subCategory subSubCategory brand variants');

// //         return res.status(200).json(products);
// //     } catch (error) {
// //         console.error('Error searching products:', error);
// //         return res.status(500).json({ message: 'Server error' });
// //     }
// // });


// router.post('/search', async (req, res) => {
//     const userid = req.body.userid
//     const query = req.query.q; 
//     const category = req.query.category; 
//     const minPrice = req.query.minPrice; 
//     const maxPrice = req.query.maxPrice; 
//     const brand = req.query.brand; 
//     const subcategory = req.query.subcategory;
//     const subsubcategory = req.query.subsubcategory;
    
//     const user = await users.findOne({userid})
    
//     let filter = [];

//     if (category) {
//         filter.push({
//             term: { category: category }
//         });
//     }

    
//     if (minPrice || maxPrice) {
//         let priceRange = {};
//         if (minPrice) priceRange.gte = minPrice; 
//         if (maxPrice) priceRange.lte = maxPrice; 
//         filter.push({
//             range: { price: priceRange }
//         });
//     }

//     if (brand) {
//         filter.push({
//             term: { brand: brand }
//         });
//     }

//     if (subcategory) {
//         filter.push({
//             term: { subCategory: subcategory }
//         });
//     }

//     if (subsubcategory) {
//         filter.push({
//             term: { subSubCategory: subsubcategory }
//         });
//     }


//     try {
//         const  body  = await client.search({
//             index: 'products_v2',
//             body: {
//                 query: {
//                     bool: {
//                         must: [
//                             {
//                                 match: {
//                                     name: query,
//                                 },
//                             },
//                         ],
//                         filter: filter, 
//                     },
//                 },
//             },
//         });
         
//         //console.log(body.hits.hits)
//         const products = []
//         for (let hit of body.hits.hits) {
//             const product = hit._source;
//             const productId = hit._id; 
//             const products_data = await Product.findById(productId).populate('brand').populate('category').populate('variants')
//             products.push(products_data)
//             //console.log(productId, 'productid');
//             //console.log(userid,"userid")
//             await MostSearch.findOneAndUpdate(
//                 { productId: productId }, 
//                 { $inc: { searchCount: 1 }, $set: { createdAt: new Date() } },
//                 { upsert: true, new: true }
//             );

//             await RecentSearch.findOneAndUpdate(
//                 { productId: productId, userId: userid },
//                 { $set: { createdAt: new Date() }},
//                 { upsert: true, new: true }
//             );
           
//         }
        
        
//         res.status(200).json({
//             success: true,
//             products,
//         });
//     } catch (error) {
//         console.error('Error fetching products:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Server Error',
//         });
//     }
// });


// router.post('/recent-searches',auth, async (req, res) => {
//     try {
//         const userId = req.user.id; 

//         const recentSearches = await RecentSearch.find({ userId })
//             .sort({ createdAt: -1 }) 
//             .limit(10); 
        
//         res.status(200).json({
//             success: true,
//             recentSearches,
//         });
//     } catch (error) {
//         console.error('Error fetching recent searches:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Server Error',
//         });
//     }
// });


// router.post('/top-most-searched',async (req, res) => {
//     try {
//         const topMostSearched = await MostSearch.find()
//             .sort({ searchCount: -1 }) 
//             .limit(5) 
//             .populate('productId');

//         res.status(200).json({
//             success: true,
//             data: topMostSearched
//         });
//     } catch (error) {
//         console.error('Error fetching top most searched items:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Server Error'
//         });
//     }
// });

// router.post('/delete-all-recent-searches',auth, async (req, res) => {
//     const { userId } = req.user.id;

//     try {
//         const result = await RecentSearch.deleteMany({ userId: userId }); 
//         if (result.deletedCount === 0) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'No recent searches found for this user.',
//             });
//         }

//         res.status(200).json({
//             success: true,
//             message: `All recent searches for user ${userId} have been deleted successfully.`,
//         });
//     } catch (error) {
//         console.error('Error deleting recent searches for user:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Server Error',
//         });
//     }
// });

// // Route to delete a specific search by its id
// router.post('/recent-searches/:productId', auth, async (req, res) => {
//     const { productId } = req.params;
//     const userId = req.user.id; 

//     try {
//         const deletedSearch = await RecentSearch.findOneAndDelete({ userId: userId, productId: productId });

//         if (!deletedSearch) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Search not found for the given product and user.',
//             });
//         }

//         res.status(200).json({
//             success: true,
//             message: 'Search has been deleted successfully.',
//         });
//     } catch (error) {
//         console.error('Error deleting search by ID:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Server Error',
//         });
//     }
// });



// module.exports = router;