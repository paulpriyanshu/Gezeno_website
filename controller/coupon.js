router.post('/coupons/apply', async (req, res) => {
    const { userId, couponCode, orderValue, categoryIds, productIds } = req.body;

    try {
        const coupon = await Coupon.findOne({ code: couponCode });

        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: 'Coupon not found'
            });
        }

        // Check if coupon is active and within date range
        if (!coupon.isActive || coupon.startDate > new Date() || coupon.endDate < new Date()) {
            return res.status(400).json({
                success: false,
                message: 'Coupon is not valid'
            });
        }

        // Check minimum order value
        if (orderValue < coupon.minOrderValue) {
            return res.status(400).json({
                success: false,
                message: `Minimum order value required is ${coupon.minOrderValue}`
            });
        }

        // Check usage limits
        if (coupon.maxUses > 0 && coupon.currentUses >= coupon.maxUses) {
            return res.status(400).json({
                success: false,
                message: 'Coupon usage limit reached'
            });
        }

        // Check user-specific restriction
        if (coupon.userSpecific) {
            const user = await User.findById(userId).populate('coupons');
            if (!user || !user.coupons.some(c => c._id.equals(coupon._id))) {
                return res.status(400).json({
                    success: false,
                    message: 'Coupon is not valid for this user'
                });
            }
        }

        // Check category and product applicability
        if (coupon.applicableCategories.length > 0) {
            const applicableCategory = categoryIds.some(categoryId => coupon.applicableCategories.includes(categoryId));
            if (!applicableCategory) {
                return res.status(400).json({
                    success: false,
                    message: 'Coupon is not applicable for selected categories'
                });
            }
        }

        if (coupon.applicableProducts.length > 0) {
            const applicableProduct = productIds.some(productId => coupon.applicableProducts.includes(productId));
            if (!applicableProduct) {
                return res.status(400).json({
                    success: false,
                    message: 'Coupon is not applicable for selected products'
                });
            }
        }

        // Calculate discount
        let discountAmount = 0;
        if (coupon.discountType === 'percentage') {
            discountAmount = (coupon.discountValue / 100) * orderValue;
        } else if (coupon.discountType === 'fixed') {
            discountAmount = coupon.discountValue;
        }

        // Ensure discount does not exceed order value
        discountAmount = Math.min(discountAmount, orderValue);

        // Increment current uses of the coupon
        coupon.currentUses += 1;
        await coupon.save();

        res.status(200).json({
            success: true,
            message: 'Coupon applied successfully',
            discountAmount
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
