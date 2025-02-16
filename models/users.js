const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        trim: true,
        sparse: true,
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, "Please enter a valid email address"],
    },
    fullName: {
        type: String,
        trim: true,
    },
    phone: {
        type: String,
        trim: true,
        sparse: true,
        unique: true,
        validate: [validator.isMobilePhone, "Please enter a valid phone number"],
        maxLength: [15, "Phone number cannot exceed 15 characters"],  // Adjust length based on country
    },
    address: {
        street: { type: String, trim: true,required:false},
        city: { type: String, trim: true ,required:false},
        state: { type: String, trim: true ,required:false},
        country: { type: String, trim: true ,required:false},
        pincode: { type: String, trim: true ,required:false},
    },
    role: {
        type: String,
        enum: ["user", "admin", "editor"], // Define allowed roles
        default: "user",
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    otp: {
        code: {
            type: String,
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
        expiresIn: {
            type: Number, // Expiry time in seconds
            default: 300, // OTP valid for 5 minutes
        },
        attempts: {
            type: Number,
            default: 0,
        },
    },
    gender: {
        type: String,
        trim: true,
        enum: ["Male","male","female", "Female", "Other"], // Ensure valid values
    },
});

// Hash OTP before saving (if storing)
userSchema.pre("save", async function (next) {
    if (this.otp.code) {
        const salt = await bcrypt.genSalt(10);
        this.otp.code = await bcrypt.hash(this.otp.code, salt);
    }
    next();
});

module.exports = mongoose.model("User", userSchema);