const express = require('express')
const {User} = require('../models/users')
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

// router.post('/forgotPassword', async (req, res) => {
//     try {
//       const user = await User.findOne({ email: req.body.email });
//       if (!user) {
//         return res.status(404).json({ status: 'fail', message: 'There is no user with that email address.' });
//       }

//       const resetToken = crypto.randomBytes(32).toString('hex');
//       user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
//       user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
//       await User.save({ validateBeforeSave: false });

//       const resetURL = `${req.protocol}://${req.get('host')}/api/resetPassword/${resetToken}`;
//       const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}\nIf you didn't forget your password, please ignore this email!`;

//       try {
//         await sendEmail({
//           email: user.email,
//           subject: 'Your password reset token (valid for 10 min)',
//           message,
//         });

//         res.status(200).json({ status: 'success', message: 'Token sent to email!' });
//       } catch (err) {
//         user.resetPasswordToken = undefined;
//         user.resetPasswordExpire = undefined;
//         await user.save({ validateBeforeSave: false });

//         return res.status(500).json({ status: 'fail', message: 'There was an error sending the email. Try again later!' });
//       }
//     } catch (err) {
//       res.status(500).json({ status: 'error', message: err.message });
//     }
//   });

// router.post('/resetPassword/:token', async (req, res) => {
//     try {
//       const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

//       const user = await User.findOne({
//         resetPasswordToken: hashedToken,
//         resetPasswordExpires: { $gt: Date.now() },
//       });

//       if (!user) {
//         return res.status(400).json({ status: 'fail', message: 'Token is invalid or has expired' });
//       }

//       user.password = req.body.password;
//       user.resetPasswordToken = undefined;
//       user.resetPasswordExpire = undefined;
//       await user.save();
//       const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
//       res.header('Authorization', token).json({ message: 'Logged in', token });

//     } catch (err) {
//       res.status(500).json({ status: 'error', message: err.message });
//     }
//   });


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


module.exports = router;  