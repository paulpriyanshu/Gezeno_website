const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

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


const userCart = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true
        },
        quantity: {
          type: Number,
          required: true,
          min: 1, 
          default: 1
        },
        price: {
          type: Number,
          required: true
        },
        total: {
          type: Number,
          required: true
        },
        size:{
            type:String,
            required:false
        }

      }
    ],
    couponApplied: {
      code: {
        type: String,
        default: null
      },
      discountAmount: {
        type: Number,
        default: 0
      }
    },
    subtotal: {
      type: Number,
      required: true,
      default: 0
    },
    tax: {
      type: Number,
      required: true,
      default: 0
    },
    total: {
      type: Number,
      required: true,
      default: 0
    },
    status: {
      type: String,
      enum: ["active", "pending", "ordered", "abandoned"],
      default: "active"
    },
    paymentMethod: {
      type: String,
      enum: ["card", "paypal", "cod", "wallet"],
      default: "cod"
    },
    shippingAddress: {
      fullName: String,
      address: String,
      city: String,
      state: String,
      postalCode: String,
      country: String
    },
    billingAddress: {
      fullName: String,
      address: String,
      city: String,
      state: String,
      postalCode: String,
      country: String
    },
    sessionExpiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 1000 * 60 * 60 * 24) // Expires in 24 hrs
    }
  },
  { timestamps: true }
);


const Cart=mongoose.model('Cart',userCart)

const contactDetails=new mongoose.Schema({
    name:{
        type:String,
        require:true
    },
    email:{
        type:String,
        required:true,

    },
    message:{
        type:String,
        required:true,
    }

})


// Hash OTP before saving (if storing)
userSchema.pre("save", async function (next) {
    if (this.otp.code) {
        const salt = await bcrypt.genSalt(10);
        this.otp.code = await bcrypt.hash(this.otp.code, salt);
    }
    next();
});

const adminSchema = new mongoose.Schema({
    email: {
        type: String,
        trim: true,
        unique: true,
        required: [true, "Email is required"],
        lowercase: true,
        validate: [validator.isEmail, "Please enter a valid email address"],
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        minlength: [6, "Password must be at least 6 characters long"],
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Hash password before saving
adminSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
    next();
});

const Admin= mongoose.model("Admin", adminSchema);


const User=mongoose.model("User", userSchema);

const ContactDetails=mongoose.model("ContactDetails",contactDetails)

module.exports={
    User,
    Admin,
    ContactDetails,
    Cart
}