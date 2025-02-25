const express=require('express')
const Coupon = require('../models/coupon')
const {User,Cart}=require('../models/users')



const router=express.Router()
router.post('/createCoupon',async (req, res) => {
    try {
        const coupon = new Coupon(req.body);
        await coupon.save();
        res.status(201).json({ success: true, message: 'Coupon created successfully', data: coupon });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Get all coupons
router.get('/getAllCoupons',async (req, res) => {
    try {
        const coupons = await Coupon.find();
        res.status(200).json({ success: true, data: coupons });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});




router.post('/apply', async (req, res) => {
    console.log("Applying coupon...");
    const { email, couponCode, orderValue, categoryIds, productIds } = req.body;
    console.log("coupon",req.body)
    
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const coupon = await Coupon.findOne({ code: couponCode });
        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: 'Coupon not found'
            });
        }

        // Validate Coupon
        const currentDate = new Date();
        if (!coupon.isActive || coupon.startDate > currentDate || coupon.endDate < currentDate) {
            return res.status(400).json({
                success: false,
                message: 'Coupon is not valid'
            });
        }

        if (orderValue < coupon.minOrderValue) {
            return res.status(400).json({
                success: false,
                message: `Minimum order value required is ${coupon.minOrderValue}`
            });
        }

        if (coupon.maxUses > 0 && coupon.currentUses >= coupon.maxUses) {
            return res.status(400).json({
                success: false,
                message: 'Coupon usage limit reached'
            });
        }

        if (coupon.userSpecific) {
            const userDetails = await User.findById(user._id).populate('coupons');
            if (!userDetails || !userDetails.coupons.some(c => c._id.equals(coupon._id))) {
                return res.status(400).json({
                    success: false,
                    message: 'Coupon is not valid for this user'
                });
            }
        }

        if (Array.isArray(categoryIds) && coupon.applicableCategories?.length > 0) {
            const applicableCategory = categoryIds.some(categoryId =>
                coupon.applicableCategories.some(applicableId => applicableId.toString() === categoryId)
            );
            if (!applicableCategory) {
                return res.status(400).json({
                    success: false,
                    message: 'Coupon is not applicable for selected categories'
                });
            }
        }

        if (Array.isArray(productIds) && coupon.applicableProducts?.length > 0) {
            const applicableProduct = productIds.some(productId => coupon.applicableProducts.includes(productId));
            if (!applicableProduct) {
                return res.status(400).json({
                    success: false,
                    message: 'Coupon is not applicable for selected products'
                });
            }
        }

        // Calculate Discount
        let discountAmount = 0;
        if (coupon.discountType === 'percentage') {
            discountAmount = (coupon.discountValue / 100) * orderValue;
        } else if (coupon.discountType === 'fixed') {
            discountAmount = coupon.discountValue;
        }

        // Ensure discount does not exceed order value
        discountAmount = Math.min(discountAmount, orderValue);

        // Update Coupon Usage Count
        await Coupon.findOneAndUpdate(
            { code: couponCode },
            { $inc: { currentUses: 1 } },
            { new: true }
        );

        // Find and Update User Cart
        let userCart = await Cart.findOne({ user: user._id });
        if (!userCart) {
            return res.status(404).json({
                success: false,
                message: "User cart not found"
            });
        }

        // Update Cart Fields
        userCart.couponApplied = {
            code: couponCode,
            discountAmount: discountAmount
        };
        userCart.total = Math.max(userCart.subtotal - discountAmount, 0); // Ensure total is not negative

        await userCart.save();

        res.status(200).json({
            success: true,
            message: 'Coupon applied successfully',
            discountAmount,
            updatedCart: userCart
        });
    } catch (error) {
        console.error('Error applying coupon:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
});


router.get('/getCoupon/:id', async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.id);
        if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
        res.status(200).json({ success: true, data: coupon });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/updateCoupon/:id', async (req, res) => {
    try {
        const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
        res.status(200).json({ success: true, message: 'Coupon updated successfully', data: coupon });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Delete a coupon
router.post('/deleteCoupon/:id', async (req, res) => {
    try {
        const coupon = await Coupon.findByIdAndDelete(req.params.id);
        if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
        res.status(200).json({ success: true, message: 'Coupon deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});




module.exports=router