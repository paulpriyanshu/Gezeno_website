const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const users = new mongoose.Schema({
    email: {
        type: String,
        sparse: true,
        unique: true,
        validate: [validator.isEmail, "Please enter valid email address"],
    },
    fullName: {
        type: String,

    },
    phone: {
        type: String,
        sparse: true,
        unique: true,
        maxLength: [200, "Your phone number cannot exceed 200 characters"],
    },
    address: [{ type: mongoose.Schema.Types.ObjectId, ref: 'address' }],
    role: {
        type: String,
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
        },
        attempts: {
            type: Number,
            default: 0,
        },
    },
    gender: {
        type: String
    }
});

module.exports = mongoose.model('users', users)