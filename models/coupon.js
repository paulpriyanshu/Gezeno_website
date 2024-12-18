const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true, 
        trim: true
    },
    discountType: {
        type: String,
        required: true,
        enum: ['percentage', 'fixed'],
    },
    discountValue: {
        type: Number,
        required: true
    },
    minOrderValue: {
        type: Number,
        default: 0 
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    maxUses: {
        type: Number,
        default: null 
    },
    currentUses: {
        type: Number,
        default: 0
    },
    userSpecific: {
        type: Boolean,
        default: false 
    },
    applicableCategories: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    }],
    applicableProducts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product' 
    }],
    isActive: {
        type: Boolean,
        default: true 
    },
    createdAt: {
        type: Date,
        default: Date.now 
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

couponSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

const Coupon = mongoose.model('Coupon', couponSchema);

module.exports = Coupon;
