const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Middleware for token verification
const verifyToken = require('../middleware/verifyToken');

router.post('/register', async (req, res) => {
    const { name, email, password, confirmPassword } = req.body;

    // Check if password matches confirmPassword
    if (password !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match' });
    }

    try {
        // Check if email is already registered
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: 'Email is already registered' });
        }

        if (!name || !email ||!password|| !confirmPassword) {
            return res.status(400).json({
                errorMessage: "Bad Request",
            });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user object and save to database
        const newUser = new User({ name, email, password: hashedPassword, confirmPassword: hashedPassword });
        await newUser.save();


        // Generate token
        const token = jwt.sign({ email: newUser.email }, process.env.JWT_SECRET);

        res.json({
            message: "User registered successfully",
            token: token,
            name: name,
            password: hashedPassword,
            success:true,
        });
        // res.status(201).json({ message: 'User registered successfully', token });
    } catch (error) {
        res.status(500).json({ message: 'Failed to register user', error: error.message });
    }
});



//login route
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Find user by email
        const user = await User.findOne({ email });

        // Check if user exists
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        if (!email || !password) {
            return res.status(400).json({
                errorMessage: "Bad Request! Invalid credentials",
            });
        }

        // Compare hashed password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Invalid password' });
        }

        const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET);

        res.json({
            message: "User login successfully",
            token: token,
            name: user.name,
            success:true,
        });
        // res.json({ message: 'Login successful', token });
    } catch (error) {
        res.status(500).json({ message: 'Failed to login', error: error.message });
    }
});

// Secure route 
router.get('/profile', verifyToken, async (req, res) => {
    // This route is protected and only accessible with a valid token
    res.json({ message: 'Profile accessed successfully', user: req.user });
});

module.exports = router;

//update Password
router.put('/passwordUpdation', verifyToken, async (req, res) => {
    const { name, oldPassword, newPassword } = req.body;

    try {
        // Find user by name
        const user = await User.findOne({ name });

        // Check if user exists
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        // Verify old password
        const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
        if (!isOldPasswordValid) {
            return res.status(400).json({ message: 'Invalid old password' });
        }

        // Hash the new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        // Update user's password
        user.password = hashedNewPassword;
        await user.save();

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update password', error: error.message });
    }
});
