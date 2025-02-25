const mongoose = require("mongoose");

const orderSchema = mongoose.Schema({
    shippingInfo: {
        street: { type: String, required: true },
        city: { type: String, required: true },
        pincode: { type: String, required: true },
        country: { type: String, required: true },
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User",
    },
    orderItems: [
        {
            name: { type: String, required: true },
            quantity: { type: Number, required: true },
            originalPrice: { type: Number, required: true }, // Original price before discounts
            discountedPrice: { type: Number, required: true }, // Final price after discount
            product: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Product" },
            size: { type: String },
        },
    ],
    couponsApplied: [
        {
            code: { type: String, required: true }, // Coupon code
            discountAmount: { type: Number, required: true }, // Amount deducted using the coupon
        },
    ],
    paymentInfo: {
        id: { type: String },
        status: { type: String },
    },
    paidAt: { type: Date },
    itemsPrice: { type: Number, required: true, default: 0.0 }, // Sum of all discounted item prices
    taxPrice: { type: Number, required: true, default: 0.0 },
    shippingPrice: { type: Number, required: true, default: 0.0 },
    totalPrice: { type: Number, required: true, default: 0.0 }, // Sum of all costs after applying coupons
    orderStatus: { type: String, required: true, default: "Processing" },
    deliveredAt: { type: Date },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Order", orderSchema);