const express = require('express')
const users = require('../models/users')
const order = require('../models/order')
const Product = require('../models/product')
const nodemailer = require('nodemailer');   
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const dotenv = require('dotenv');
const auth = require('../middleware/auth')


const router = express.Router();

router.post('/createorder', async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const {
            shippingInfo,
            orderItems,
            paymentInfo,
            itemsPrice,
            taxPrice,
            shippingPrice,
            totalPrice,
            userId
        } = req.body;

        if (!shippingInfo || !orderItems || !userId || !itemsPrice || !taxPrice || !shippingPrice || !totalPrice) {
            return res.status(400).json({ message: 'All fields are mandatory' });
        }

        if ([itemsPrice, taxPrice, shippingPrice, totalPrice].some(price => price < 0)) {
            return res.status(400).json({ message: 'Prices must be positive numbers' });
        }

        await Promise.all(orderItems.map(async (item) => {
            const product = await Product.findById(item.product).session(session);
            if (!product) {
                throw new Error(`Product with ID ${item.product} not found`);
            }
            if (product.stock < item.quantity) {
                throw new Error(`Insufficient stock for product ${product.name}`);
            }
        }));

        const newOrder = new order({
            shippingInfo,
            user: userId,
            orderItems,
            paymentInfo,
            itemsPrice,
            taxPrice,
            shippingPrice,  
            totalPrice,
        });

        const savedOrder = await newOrder.save({ session });

        // Reduce stock for each ordered product
        await Promise.all(orderItems.map(async (item) => {
            await Product.findByIdAndUpdate(item.product, {
                $inc: { stock: -item.quantity }
            }, { session });
        }));

        await session.commitTransaction();
        session.endSession();

        return res.status(201).json({ message: 'Order created successfully', order: savedOrder });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error('Error creating order:', error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    } finally {
        session.endSession(); 
    }
});

router.post('/updateorder/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { orderStatus } = req.body;

        const Order = await order.findById(id);
        if (!Order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        Order.orderStatus = orderStatus;

        if (orderStatus === 'Delivered') {
            Order.deliveredAt = Date.now();
        }

        await Order.save();

        return res.status(200).json({ message: 'Order updated successfully', order });
    } catch (error) {
        console.error('Error updating order:', error);
        return res.status(500).json({ message: 'Server error' });
    }
});

router.post('/cancelorder', async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { orderId, userId } = req.body;

        if (!orderId || !userId) {
            return res.status(400).json({ message: 'Order ID and User ID are required' });
        }

        const Order = await order.findOne({ _id: orderId, user: userId }).session(session);
        if (!Order) {
            throw new Error('Order not found');
        }

        if (order.orderStatus === 'Delivered') {
            throw new Error('Cannot cancel a delivered order');
        }
        if (order.orderStatus === 'Canceled') {
            throw new Error('Order is already canceled');
        }

        order.orderStatus = 'Canceled';
        await order.save({ session });

        // Restock products
        for (const item of order.orderItems) {
            const product = await Product.findById(item.product).session(session);
            if (product) {
                product.stock += item.quantity;
                await product.save({ session });
            }
        }

        await session.commitTransaction();
        session.endSession();

        return res.status(200).json({ message: 'Order canceled successfully' });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error('Error canceling order:', error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
});


module.exports = router;