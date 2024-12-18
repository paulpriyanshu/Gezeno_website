const express = require('express')
const cart = require('../models/cart')
const wishlist = require('../models/wishlist')
const { body, validationResult } = require('express-validator');
const dotenv = require('dotenv');

const auth = require('../middleware/auth')

const router = express.Router()

router.post('/add-to-cart', async (req, res) => {
    try {
        const { userid, productid, qty } = req.body;

        
        if (!userid || !productid || !qty) {
            return res.status(400).json({ msg: "All fields are mandatory" });
        }

        let dataExist = await cart.findOne({ userid, productid });
        if (dataExist) {
            
            dataExist.qty += qty;
            await dataExist.save(); 
            return res.status(200).json({ msg: "Product quantity updated" });
        } else {
            
            const cartItem = new cart({ userid, productid, qty });
            await cartItem.save(); 
        }

        await wishlist.findOneAndDelete({ userid, productid });

        return res.status(200).json({ msg: "Product added to cart and removed from wishlist" });
    } catch (error) {
        return res.status(500).send({ error: error.message });
    }
});

router.post('/get-cart-items',async(req,res)=>{
    try{
         const {userid} = req.body
         if(!userid){
            res.status(400).json({msg:"userid is mandotary"})
         }
         const data = await cart.find({userid})
         if(!data){
            res.status(400).json({msg:"no item found"})
         }
         const items = await cart.find({ userid })
            .populate({
                path: 'productid',
                populate: { path: 'variants' }
            });
        let totalItems = 0;
        let totalPrice = 0;
            
           
        items.forEach(item => {
              totalItems += item.qty; 
              totalPrice += item.productid.price * item.qty; 
            });
        const result = [items,totalItems,totalPrice]    
                
        res.status(200).send(result)
    }catch(error){
             res.status(500).send(error)
    }
})

router.post('/remove-from-cart', async (req, res) => {
    try {
        const { userid, productid } = req.body;

        if (!userid || !productid) {
            return res.status(400).json({ msg: "User ID and Product ID are required" });
        }

        const removedItem = await cart.findOneAndDelete({ userid, productid });

        if (!removedItem) {
            return res.status(404).json({ msg: "Product not found in cart" });
        }

        return res.status(200).json({ msg: "Product removed from cart" });
    } catch (error) {
        return res.status(500).send({ error: error.message });
    }
});


router.post('/add-to-wishlist', async (req, res) => {
    try {
        const { userid, productid } = req.body;

        if (!userid || !productid) {
            return res.status(400).json({ msg: "All fields are mandatory" });
        }
        let dataExist = await wishlist.findOne({ userid, productid });
        if (dataExist) {
            return res.status(200).json({ msg: "Product already exist"});
        } else {
            
            const wishlistItem = new wishlist({ userid, productid });
            await wishlistItem.save(); 
            return res.status(200).json({ msg: "Product added to cart" });
        }
    } catch (error) {
        return res.status(500).send({ error: error.message });
    }
});

router.post('/get-wishlist-items',async(req,res)=>{
    try{
         const {userid} = req.body
         if(!userid){
            res.status(400).json({msg:"userid is mandotary"})
         }
         const data = await wishlist.find({userid})
         if(!data){
            res.status(400).json({msg:"no item found"})
         }
         const items = await wishlist.find({ userid })
            .populate({
                path: 'productid',
                populate: { path: 'variants' }
            });
        
        res.status(200).send(items)
    }catch(error){
             res.status(500).send(error)
    }
})

router.post('/remove-from-wishlist', async (req, res) => {
    try {
        const { userid, productid } = req.body;

        if (!userid || !productid) {
            return res.status(400).json({ msg: "User ID and Product ID are required" });
        }

        const removedItem = await wishlist.findOneAndDelete({ userid, productid });

        if (!removedItem) {
            return res.status(404).json({ msg: "Product not found in wishlist" });
        }

        return res.status(200).json({ msg: "Product removed from wishlist" });
    } catch (error) {
        return res.status(500).send({ error: error.message });
    }
});

module.exports = router