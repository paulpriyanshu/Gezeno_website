const express = require('express')
const {User, ContactDetails,Cart} = require('../models/users')
// const address = require('../models/address')
const nodemailer = require('nodemailer');
const passport = require('passport')
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const dotenv = require('dotenv');
const auth = require('../middleware/auth');
const address = require('../models/address');
const {Admin} = require('../models/users');
const { default: axios } = require('axios');



dotenv.config();

const router = express.Router()


// router.post(
//     '/register',
//     [
//       body('username')
//         .notEmpty().withMessage('Username is required')
//         .isLength({ min: 3 }).withMessage('Username must be at least 3 characters long'),
//       body('email')
//         .isEmail().withMessage('Email is invalid')
//         .normalizeEmail(),
//       body('password')
//         .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
//     ],
//     async (req, res) => {
//       const errors = validationResult(req);
//       if (!errors.isEmpty()) {
//         return res.status(400).json({ errors: errors.array() });
//       }

//       const { username, email, password } = req.body;

//       try {

//         const userExists = await users.findOne({email});
//         //console.log(userExists)
//         if (userExists) {
//           return res.status(400).json({ message: 'Email already exists' });
//         }

//         const salt = await bcrypt.genSalt(10);
//         const hashedPassword = await bcrypt.hash(password, salt);

//         const user = await users.create({ username, email, password: hashedPassword });

//         res.status(201).json({ message: 'User created', user });
//       } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Server error' });
//       }
//     }
//   );


// Login with email and send OTP
router.post('/login-with-email', async (req, res) => {
    const { email } = req.body;

    try {
        let user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate a 6-character OTP
        const otp = (parseInt(crypto.randomBytes(3).toString('hex'), 16) % 1000000).toString().padStart(6, '0');// Hex generates 6 chars (e.g., "a3f4b2")
        
        // Store OTP and creation time
        user.otp = {
            code: otp,
            createdAt: new Date(),
            attempts: 0,
        };

        await user.save(); // Save OTP details

        // Configure nodemailer
        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_USERNAME,
            to: email,
            subject: 'Gezeno Login OTP',
            text: `Registration OTP Verification\n\nDear User,\n\nPlease use the following OTP to verify your email address:\n\n${otp}\n\nThis OTP is valid for the next 2 minutes.\n\nIf you did not request this OTP, please ignore this email.\n\nThank you,\nGezeno\nPhone: +91-95xxxxxxx6\nEmail: kcisteam1@gmail.com\nwww.gezeno.in`
        };

        await transporter.sendMail(mailOptions);

        return res.json({ message: 'OTP sent. Please verify your OTP.', userId: user._id,user });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Verify OTP and log in

router.post('/verify-otp', async (req, res) => {
    const { email, otp } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // OTP expiration check (1 min)
        const oneMinute = 60 * 1000; // 60 seconds
        const otpCreationTime = user.otp.createdAt ? new Date(user.otp.createdAt) : null;

        if (!otpCreationTime || new Date() - otpCreationTime > oneMinute) {
            return res.status(400).json({ success: false, message: 'OTP has expired' });
        }

        // Max OTP attempts exceeded
        if (user.otp.attempts >= 5) {
            return res.status(400).json({ success: false, message: 'Max OTP attempts exceeded' });
        }

        // Compare OTP using bcrypt
        const isMatch = await bcrypt.compare(otp, user.otp.code);

        if (isMatch) {
            // Reset OTP on success
            user.otp = {}; 
            await user.save();

            // Generate JWT token
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

            return res.header('Authorization', `Bearer ${token}`).json({ 
                success: true, 
                message: 'Logged in', 
                token 
            });
        } else {
            // Increment failed attempts
            user.otp.attempts += 1;
            await user.save();
            return res.status(400).json({ success: false, message: 'Invalid OTP' });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
 
router.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);
 
router.get('/google/callback',
    passport.authenticate('google', { session: false }),
    (req, res) => {
        //  JWT was passed in req.user.token

        const { user, token } = req.user;
        // //console.log(user,token)
        if (!user.phone) {
            return res.redirect(`/phone-number?userId=${user._id}`);
        }

        res.json({ token });
    }
);

router.post("/createAdmin", async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if the admin already exists
        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            return res.status(400).json({ message: "Admin already exists" });
        }

        // Create new Admin
        const newAdmin = await Admin.create({ email, password });

        res.status(201).json({ success: true, admin: newAdmin });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
});

router.post(
    "/admin/login",
    [
        body("email").isEmail().withMessage("Enter a valid email"),
        body("password").notEmpty().withMessage("Password is required"),
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            const { email, password } = req.body;
            console.log("Admin login attempt:", email);

            // ✅ Step 1: Check if admin exists
            const admin = await Admin.findOne({ email });
            if (!admin) {
                return res.status(404).json({ success: false, message: "Admin not found" });
            }

            // ✅ Step 2: Compare password
            const isMatch = await bcrypt.compare(password, admin.password);
            if (!isMatch) {
                return res.status(401).json({ success: false, message: "Invalid credentials" });
            }

            // ✅ Step 3: Generate JWT Token for Admin
            const adminToken = jwt.sign(
                { id: admin._id, email: admin.email, role: "admin" },
                process.env.JWT_SECRET2,
                { expiresIn: "2h" }
            );

            // ✅ Step 4: Authenticate with ShipRocket
            let shiprocketToken = null;
            try {
                console.log('url',process.env.SHIPROCKET_API,email,password)
                const shiprocketResponse = await axios.post("https://apiv2.shiprocket.in/v1/external/auth/login", {
                    email: email,
                    password: password
                });

                
                shiprocketToken = shiprocketResponse.data.token;
            } catch (error) {
                console.error("ShipRocket API error:", error.response?.data || error.message);
                return res.status(500).json({ 
                    success: false, 
                    message: "Failed to authenticate with ShipRocket",
                    error: error.response?.data || error.message 
                });
            }

            // ✅ Step 5: Return both tokens
            res.status(200).json({
                success: true,
                message: "Admin login successful",
                adminToken: adminToken,
                shiprocketToken: shiprocketToken
            });

        } catch (error) {
            console.error("Server error:", error);
            res.status(500).json({ success: false, message: "Server error", error: error.message });
        }
    }
);

router.post("/get-user", async (req, res) => {
    try {
        const { email } = req.body;

        // Validate email
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        // Find user and fetch only the 'address' field
        const user = await User.findOne({ email })

        if (!user || !user.address) {
            return res.status(404).json({ message: "Address not found" });
        }

        res.status(200).json(user);
    } catch (error) {
        console.error("Error fetching user address:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

module.exports = router;

// router.post('/phone-number', async (req, res) => {
//     const userId = req.query.userId
//     //console.log(userId)
//     const { phone, email, fullName ,gender} = req.body;

//     try {
//         let user = await User.findById(userId);
//         if (!user) {
//             return res.status(404).json({ message: 'User not found' });
//         }

//         if (phone) {
//             user.phone = phone;
//         }

//         if (email) {
//             user.email = email;
//         }

//         if (fullName) {
//             user.fullName = fullName;
//         }
//         if(gender){
//             user.gender = gender;
//         }

//         await user.save();

//         const mailid = user.email
//         const otp = crypto.randomBytes(3).toString('hex');
//         //console.log(otp);
//         user.otp.code = otpCode.toString();
//         user.otp.createdAt = new Date();
//         user.otp.attempts = 0;

//         const transporter = nodemailer.createTransport({
//             service: 'Gmail',
//             auth: {
//                 user: process.env.EMAIL_USERNAME,
//                 pass: process.env.EMAIL_PASSWORD,
//             },
//         });

//         const mailOptions = {
//             from: process.env.EMAIL_USERNAME,
//             to: mailid,
//             subject: 'Your OTP Code',
//             text: `Your OTP code is: ${otp}`,
//         };

//         transporter.sendMail(mailOptions);

//         return res.json({ message: 'OTP sent. Please verify your OTP.', userId: user._id });

//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Server error' });
//     }
// });

router.post('/phone-number', async (req, res) => {
    const { phone, email, fullName, gender } = req.body;
    console.log(fullName)
    try {
        let user = await User.findOne({ email });

        // Create a new user object if no user is found
        if (!user) {
            user = await User.create({
                email,
                phone,
                fullName,
                gender
            });
        }

        // Generate and update OTP regardless of user registration status
        const otp = crypto.randomBytes(3).toString('hex');
        await User.findOneAndUpdate(
            { email: email }, // Filter by the user's email
            {
                $set: {
                    'otp.code': otp,
                    'otp.createdAt': Date.now(),
                    'otp.attempts': 0,
                }
            },
            { new: true } // Return the updated document
        );

        // Send the OTP via email
        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_USERNAME,
            to: email,
            subject: 'Your OTP Code',
            text: `Your OTP code is: ${otp}`,
        };

        await transporter.sendMail(mailOptions);

        return res.json({ message: 'OTP sent. Please verify your OTP.' });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
});

router.post('/contact-details',async(req,res)=>{
    const {name,email,message}=req.body
    if(!name || !email|| !message){
        res.status(404).send({
            message:"all fields are required"
        })
    }
  try {
      const details=await ContactDetails.create({
          name,
          email,
          message
      })
      res.status(200).send(details)
  } catch (error) {
    res.send(404).send("error",error)
  }
})

router.get('/get-contacts',async(req,res)=>{
    try {
        const contacts=await ContactDetails.find()
        res.status(200).json(contacts)
    } catch (error) {
        res.status(404).send("error",error)
    }
    
})


router.post('/update-profile', async (req, res) => {
    const { username, email, phone, gender } = req.body;

    try {
        // Validate required fields
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        // Find user by email
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if the new email is already taken by another user
        if (email !== user.email) {
            const emailExists = await User.findOne({ email });
            if (emailExists) {
                return res.status(400).json({ message: 'Email is already in use' });
            }
        }

        // Update the user with new data
        const updatedUser = await User.findByIdAndUpdate(
            user._id,
            { fullName:username, email, phone, gender },
            { new: true, runValidators: true } // Returns updated user & applies validation
        );

        return res.status(200).json({ message: 'Profile updated successfully', user: updatedUser });
    } catch (error) {
        console.error('Error updating profile:', error);
        return res.status(500).json({ message: 'Server error' });
    }
});


router.post("/get-address", async (req, res) => {
    try {
        const { user_email } = req.body;
        console.log("Received email:", user_email);

        const user = await User.findOne({ email: user_email }).select("address -_id");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ message: "success", address: user.address });
    } catch (error) {
        console.error("Error fetching user address:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

router.post('/edit-address', async (req, res) => {
    const { user_email, street, city, state, pincode, country } = req.body.values;
    console.log("user_email", req.body);
    console.log("city", city);
  
    const address = { street, city, state, pincode, country };
    
    try {
      if (!user_email) {
        return res.status(404).json({ message: 'User email is required' });
      }
  
      const is_user = await User.findOne({ email: user_email });
      if (!is_user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      await User.updateOne(
        { email: user_email },
        { $set: { address: address } }
      );
  
      console.log("Address updated successfully");
      return res.status(200).json({ message: "Address updated successfully" });  // ✅ Send success response
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Error updating address" });  // ✅ Send error response
    }
  });
// Delete user account
router.post('/delete-Account', auth, async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ message: 'Account deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user profile
router.post('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id)

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ message: 'Profile retrieved successfully', user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});


// router.post('/changePassword', auth, async (req, res) => {
//     const { currentPassword, newPassword } = req.body;

//     try {
//       const user = await User.findById(req.user.id);

//       if (!user) {
//         return res.status(404).json({ message: 'User not found' });
//       }

//       const validPass = await bcrypt.compare(currentPassword, user.password);
//       if (!validPass) {
//         return res.status(400).json({ message: 'Invalid current password' });
//       }

//       const salt = await bcrypt.genSalt(10);
//       user.password = await bcrypt.hash(newPassword, salt);

//       await user.save();

//       res.status(200).json({ message: 'Password changed successfully' });
//     } catch (error) {
//       console.error(error);
//       res.status(500).json({ message: 'Server error' });
//     }
//   });


router.get('/getallusers', async (req, res) => {
    try {
        const allUsers = await User.find()
        res.status(200).json(allUsers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});


// router.post('/logout', auth, async (req, res) => {
//     try {

//         const token = req.header('Authorization');

//         if (!token) {
//             return res.status(401).json({ message: 'No token provided' });
//         }

//         const decodedToken = jwt.decode(token);
//         // JWT expiration is in seconds, convert to milliseconds
//         const expiry = decodedToken.exp * 1000;

//         const ttl = expiry - Date.now();
//         // TTL in seconds
//         await client.setEx(token, Math.floor(ttl / 1000), 'blacklisted');

//         await client.disconnect();

//         res.status(200).json({ message: 'Logged out successfully' });
//     } catch (error) {
//         console.error('Logout error:', error);
//         res.status(500).json({ message: 'Server error' });
//     }
// });

router.post('/add-address', auth, async (req, res) => {
    const userId = req.user.id
    const { pincode, city, state, streetAddress, area, landmark, saveAddressAs } = req.body;

    try {
        let User = await User.findById(userId);
        if (!User) {
            return res.status(404).json({ message: 'User not found' });
        }
        const addresses = await address.create({
            userId,
            pincode,
            city,
            state,
            streetAddress,
            area,
            landmark,
            saveAddressAs
        })
        User.address.push(addresses.id)
        User.save()
        
        res.status(201).json({ message: 'Address added successfully', address: addresses });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

router.post('/get-all-addresses', auth, async (req, res) => {
    const userId = req.user.id;

    try {
        const user = await User.findById(userId).select('address');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ addresses:user  });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

router.post('/get-address/:addressId', auth, async (req, res) => {
    const userId = req.user.id;
    const { addressId } = req.params; 

    try {
       
        const user = await User.findById(userId).select('addresses');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const address = User.address.find(addr => addr._id.toString() === addressId);

        if (!address) {
            return res.status(404).json({ message: 'Address not found' });
        }

        res.json({ address });
    } catch (error) {
        console.error('Error fetching address:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

router.post('/update-address', auth, async (req, res) => {
    const userId = req.user.id;
    
    const {addressId, pincode, city, state, streetAddress, area, landmark, saveAddressAs } = req.body;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const addresses = address.findById(addressId)
        if (!addresses) {
            return res.status(404).json({ message: 'Address not found' });
        }

        addresses.pincode = pincode || addresses.pincode;
        addresses.city = city || addresses.city;
        addresses.state = state || addresses.state;
        addresses.streetAddress = streetAddress || addresses.streetAddress;
        addresses.area = area || addresses.area;
        addresses.landmark = landmark || addresses.landmark;
        addresses.saveAddressAs = saveAddressAs || addresses.saveAddressAs;

        await addresses.save();

        res.json({ message: 'Address updated successfully', addresses });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

router.post('/delete-address', auth, async (req, res) => {
    const userId = req.user.id
    const addressId = req.body

    try {
        let addrs = await address.findByIdAndDelete(addressId)
        if (!addrs) {
            return res.status(404).json({ message: 'address not found' });
        }

        res.json({ message: 'Address removed successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});



router.get("/cart/:email", async (req, res) => {
    try {
    const user = await User.findOne( {email:req.params.email} );
    if (!user) {
       return res.status(404).json({ message: "User not found" });
    }

      const cart = await Cart.findOne({ user: user._id }).populate("items.product");
      if (!cart) return res.status(404).json({ message: "Cart not found" });
  
      res.status(200).json(cart);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // 🟢 POST: Add an item to the cart
  router.post("/addToCart", async (req, res) => {
    try {
      const { email, productId, quantity, price, size } = req.body;
  
      console.log("Request body:", req.body);
  
      // Ensure required fields are present
      if (!email || !productId) {
        return res.status(400).json({ message: "Email and Product ID are required" });
      }
  
      // Find user by email
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      console.log("Found user:", user);
  
      // Find or create the cart
      let cart = await Cart.findOne({ user: user._id });
  
      if (!cart) {
        cart = new Cart({ user: user._id, items: [], subtotal: 0, tax: 0, total: 0 });
      }
  
      // Ensure quantity and price are numbers
      const itemQuantity = Number(quantity) || 1;
      const itemPrice = Number(price) || 0;
      const itemSize = size || "default"; // Default to "default" if size is missing
  
      // Check if the product with the same size is already in the cart
      const productIndex = cart.items.findIndex(
        (item) => item.product.toString() === productId && item.size === itemSize
      );
  
      if (productIndex > -1) {
        // If same product & same size exists, increase quantity
        cart.items[productIndex].quantity += itemQuantity;
        cart.items[productIndex].total = cart.items[productIndex].quantity * itemPrice;
      } else {
        // If product ID is same but size is different, add as a new entry
        cart.items.push({
          product: productId,
          quantity: itemQuantity,
          price: itemPrice,
          total: itemQuantity * itemPrice,
          size: itemSize,
        });
      }
  
      // Recalculate totals
      cart.subtotal = cart.items.reduce((acc, item) => acc + item.total, 0);
      cart.tax = cart.tax || 0; // Ensure tax has a default value
      cart.total = cart.subtotal + cart.tax - (cart.couponApplied?.discountAmount || 0);
  
      await cart.save();
  
      res.status(200).json({ message: "Item added to cart", cart });
    } catch (error) {
      console.error("Error in addToCart:", error);
      res.status(500).json({ message: "Internal server error", error: error.message });
    }
  });
  
  // 🔴 DELETE: Remove an item from the cart

  router.post('/emptyCart/:email', async (req, res) => {
    try {
        const { email } = req.params;
        const user=await User.findOne({email})
        if (!user) {
            return res.status(404).json({ message: "User not found" });
          }
        // Delete all cart items for the given email
        await Cart.deleteMany({ user:user._id });


        return res.status(200).json({ message: "Cart is emptied" });
    } catch (error) {
        console.error("Error while emptying the cart:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

  router.post("/:email/:productId", async (req, res) => {
    try {
      const { email, productId } = req.params;
      const { size } = req.body; // Get size from request body
  
      // Find user by email
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      // Find user's cart
      let cart = await Cart.findOne({ user: user._id });
      if (!cart) {
        return res.status(404).json({ message: "Cart not found" });
      }
  
      // Ensure cart items exist before filtering
      if (cart.items && cart.items.length > 0) {
        cart.items = cart.items.filter(
          (item) => item.product.toString() !== productId || item.size !== size
        );
      }
  
      // Recalculate totals
      cart.subtotal = cart.items.reduce((acc, item) => acc + (item.total || 0), 0);
      const discount = cart.couponApplied?.discountAmount || 0;
      cart.total = cart.subtotal + cart.tax - discount;
  
      // Save updated cart
      await cart.save();
  
      res.status(200).json({ message: "Item removed from cart", cart });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  router.post("/updateCart", async (req, res) => {
    // console.log("inside update")
    try {
        const { email, productId, quantity, size, applyCoupon } = req.body;

        // Ensure email and productId are provided
        if (!email || !productId) {
            return res.status(400).json({ message: "Email and Product ID are required" });
        }

        // Find the user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Find the cart
        let cart = await Cart.findOne({ user: user._id });
        if (!cart) {
            return res.status(404).json({ message: "Cart not found" });
        }

        // Find the item in the cart
        const productIndex = cart.items.findIndex(
            (item) => item.product.toString() === productId && item.size === (size || "default")
        );

        if (productIndex === -1) {
            return res.status(404).json({ message: "Product not found in cart" });
        }

        // Update quantity
        if (quantity !== undefined) {
            const newQuantity = Math.max(Number(quantity), 1); // Prevent negative quantity
            cart.items[productIndex].quantity = newQuantity;
            cart.items[productIndex].total = newQuantity * cart.items[productIndex].price;
        }

        // Apply coupon
        if (applyCoupon) {
            const coupon = await Coupon.findOne({ code: applyCoupon });
            if (!coupon) {
                return res.status(400).json({ message: "Invalid coupon code" });
            }
            cart.couponApplied = {
                code: coupon.code,
                discountAmount: coupon.discountAmount,
            };
        }

        // Recalculate totals
        cart.subtotal = cart.items.reduce((acc, item) => acc + item.total, 0);
        cart.tax = cart.tax || 0;
        cart.total = cart.subtotal + cart.tax - (cart.couponApplied?.discountAmount || 0);

        await cart.save();

        res.status(200).json({ message: "Cart updated successfully", cart });
    } catch (error) {
        console.error("Error in updateCart:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
});
router.post("/removeCoupon", async (req, res) => {
    try {
        const { email } = req.body;

        // Ensure email is provided
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        // Find the user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Find the cart
        let cart = await Cart.findOne({ user: user._id });
        if (!cart) {
            return res.status(404).json({ message: "Cart not found" });
        }

        // Check if a coupon is applied
        if (!cart.couponApplied) {
            return res.status(400).json({ message: "No coupon applied to the cart" });
        }

        // Remove coupon
        cart.couponApplied = null;

        // Recalculate totals
        cart.total = cart.subtotal + cart.tax; // Reset total after removing discount

        await cart.save();

        res.status(200).json({ message: "Coupon removed successfully", cart });
    } catch (error) {
        console.error("Error in removeCoupon:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
});

module.exports = router;  