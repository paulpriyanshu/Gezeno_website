const express = require('express')
const users = require('../models/users')
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


router.post('/login-with-phone', async (req, res) => {

    const { phone } = req.body;

    try {
        let user = await users.findOne({ phone });

        if (user) {
            const mailid = user.email
            const otp = crypto.randomBytes(3).toString('hex');
            //console.log(otp);
            user.otp.code = otpCode.toString();
            user.otp.createdAt = new Date();
            user.otp.attempts = 0;

            const transporter = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: process.env.EMAIL_USERNAME,
                    pass: process.env.EMAIL_PASSWORD,
                },
            });

            const mailOptions = {
                from: process.env.EMAIL_USERNAME,
                to: mailid,
                subject: 'Your OTP Code',
                text: `Your OTP code is: ${otp}`,
            };

            transporter.sendMail(mailOptions);

            return res.json({ message: 'OTP sent. Please verify your OTP.', userId: user._id });

        }

        const createuser = new users({ phone })
        await createuser.save()
        // //console.log(createuser.id)
        return res.redirect(`/phone-number?userId=${createuser.id}`);

        // user = new users({
        //     phone, email, fullName
        // });
        // await user.save();
        // const otp = crypto.randomBytes(3).toString('hex');
        // //console.log(otp);
        // await client.setEx(user._id.toString(), 300, otp);

        // const transporter = nodemailer.createTransport({
        //     service: 'Gmail',
        //     auth: {
        //         user: process.env.EMAIL_USERNAME,
        //         pass: process.env.EMAIL_PASSWORD,
        //     },
        // });

        // const mailOptions = {
        //     from: process.env.EMAIL_USERNAME,
        //     to: user.email,
        //     subject: 'Your OTP Code',
        //     text: `Your OTP code is: ${otp}`,
        // };

        // await transporter.sendMail(mailOptions);

        // res.json({ message: 'OTP sent. Please verify your OTP.', userId: user._id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/verify-otp', async (req, res) => {
    const { email, otp } = req.body;
    //console.log("entered the api")
    //console.log(req.body);

    try {
        const user = await users.findOne({ email });
        //console.log(user)
        if (!user) {
            return res.json({ success: false, message: 'User not found' });
        }

        const oneMinute = 60 * 1000;
        const otpCreationTime = user.otp.createdAt;

        // if (!otpCreationTime || new Date() - otpCreationTime > oneMinute) {
        //     return res.json({ success: false, message: 'OTP has expired' });
        // }

        if (user.otp.attempts >= 5) {
            return res.json({ success: false, message: 'Max OTP attempts exceeded' });
        }

        if (user.otp.code !== otp) {
            user.otp.attempts += 1; // Increment attempts on failure
            await user.save();
            return res.json({ success: false, message: 'Invalid OTP' });
        }

        // Reset OTP to avoid reuse
        user.otp = {}; 
        await user.save();

        // Generate JWT token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        //console.log(token)
        // Send token and success message to frontend
        res.header('Authorization', `Bearer ${token}`).json({ success: true, message: 'Logged in', token });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});


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

// router.post('/phone-number', async (req, res) => {
//     const userId = req.query.userId
//     //console.log(userId)
//     const { phone, email, fullName ,gender} = req.body;

//     try {
//         let user = await users.findById(userId);
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
    //console.log("this is phone", phone);
    //console.log("this is email", email);
    try {
        let user = await users.findOne({ email });
        if (!user) {
            // Create a new user object if no user is found
            user = await users.create({
                email,
                phone,
                fullName,
                gender
            });
        } else {
            return res.json({
                msg: "You are already registered"
            });
        }

        let user_otp = await users.findOne({ email });
        const mailid = email;
        const otp = crypto.randomBytes(3).toString('hex');

        //console.log(otp);
        const updatedUser = await users.findOneAndUpdate(
            { email: email }, // Filter by the user's _id or any other unique identifier
            {
              $set: {
                'otp.code': otp,
                'otp.createdAt': Date.now(),
                'otp.attempts': 0,
              }
            },
            { new: true } // Return the updated document
          );

        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_USERNAME,
            to: mailid,
            subject: 'Your OTP Code',
            text: `Your OTP code is: ${otp}`,
        };

        transporter.sendMail(mailOptions);

        return res.json({ message: 'OTP sent. Please verify your OTP.' });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
});

// router.post('/forgotPassword', async (req, res) => {
//     try {
//       const user = await users.findOne({ email: req.body.email });
//       if (!user) {
//         return res.status(404).json({ status: 'fail', message: 'There is no user with that email address.' });
//       }

//       const resetToken = crypto.randomBytes(32).toString('hex');
//       user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
//       user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
//       await users.save({ validateBeforeSave: false });

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

//       const user = await users.findOne({
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


router.post('/update-Profile', auth, async (req, res) => {
    const { username, email, phone, gender } = req.body;
    try {
        const user = await users.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update fields if provided
        if (username) user.username = username;
        if (email) user.email = email;
        if (phone) user.phone = phone;
        if (gender) user.gender = gender;

        await user.save();

        res.status(200).json({ message: 'Profile updated successfully', user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete user account
router.post('/delete-Account', auth, async (req, res) => {
    try {
        const user = await users.findByIdAndDelete(req.user.id);

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
        const user = await users.findById(req.user.id)

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
//       const user = await users.findById(req.user.id);

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


router.post('/getallusers', async (req, res) => {
    try {
        const allUsers = await users.find()
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
        let User = await users.findById(userId);
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
        const user = await users.findById(userId).select('address');
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
       
        const user = await users.findById(userId).select('addresses');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const address = users.address.find(addr => addr._id.toString() === addressId);

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
        const user = await users.findById(userId);
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