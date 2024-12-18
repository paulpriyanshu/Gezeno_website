const express = require('express')
const users = require('../models/users')
const {Brand,
    Category,
    SubCategory,
    SubSubCategory,
    Product,
    ProductVariant,} = require('../models/product')
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const dotenv = require('dotenv');
const auth = require('../middleware/auth')


const router = express.Router()

router.post('/getallbrands',async(req,res)=>{
    try{
        const data = await Brand.find({})
        res.status(200).send(data)
    }catch(error){
        res.status(400).json({message:error})
    }
})
   

router.post('/getactivebrands',async(req,res)=>{
    try{
       const data = await Brand.find({isActive:true})
       res.status(200).send(data)
    }catch(error){
        res.status(400).json({message:error})
    }
})


router.post('/getinactivebrand',async(req,res)=>{
    try{
        const data = await Brand.find({isActive:false})
        res.status(200).send(data)

    }catch(error){
        res.status(400).json({message:error})
    }
})


router.post('/getallcategory',async(req,res)=>{
    try{
        const data = await Category.find({}).populate('subCategories')
        res.status(200).send(data)
    }catch(error){
        res.status(400).json({message:error})
    }
})


router.post('/getactivecategory',async(req,res)=>{
    try{
         const data = await Category.find({isActive:true}).populate('subCategories')
         res.status(200).send(data)
    }catch(error){
        res.status(400).json({mesaage:error})
    }
})


router.post('/getinactivecategories',async(req,res)=>{
   try{
       const data = await Category.find({isActive:false}).populate('subCategories')
       res.status(200).send(data)``
   }catch(error){
    res.status(400).json({message:error})
   }
})


router.post('/getallsubcategory',async(req,res)=>{
    try{
       const data = await SubCategory.find({}).populate('subSubCategories')
       res.status(200).send(data)
    }catch(error){
        res.status(400).json({message:error})
    }
})


router.post('/getactivesubcategory',async(req,res)=>{
    try{
       const data = await SubCategory.find({isActive:true}).populate('subSubCategories')
       res.status(200).send(data)
    }catch(error){
        res.status(400).json({message:error})
    }
})


router.post('/getinactivesubcategory',async(req,res)=>{
    try{
       const data = await SubCategory.find({isActive:false}).populate('subSubCategories')
       res.status(200).send(data)
    }catch(error){
        res.status(400).json({message:error})
    }
})


router.post('/getallvariant',async(req,res)=>{
    try{
        const data = await ProductVariant.find({})
        res.status(200).send(data)
    }catch(error){
        res.status(400).json({message:error})
    }
})


router.post('/getactivevariant',async(req,res)=>{
    try{
      const data = await ProductVariant.find({isActive:true})
      res.status(200).send(data)
    }catch(error){
        res.status(400).json({message:error})
    }
})


router.post('/getinactivevariant',async(req,res)=>{
    try{
      const data = await ProductVariant.find({isActive:false})
      res.status(200).send(data)
    }catch(error){
        res.status(400).json({message:error})
    }
})

module.exports = router;