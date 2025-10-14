const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const router = express.Router();

// In-memory user storage (for demo purposes)
let users = [];

// Initialize demo admin user
const initializeDemoAdmin = async () => {
    try {
        // Check if demo admin already exists
        const existingAdmin = users.find(user => user.email === 'admin@swiftbuy.com');
        if (!existingAdmin) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            const demoAdmin = {
                _id: '1',
                username: 'admin',
                email: 'admin@swiftbuy.com',
                password: hashedPassword,
                role: 'admin',
                isActive: true,
                lastLogin: null,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            users.push(demoAdmin);
            console.log('✅ Demo admin user created in memory');
            console.log('📧 Email: admin@swiftbuy.com');
            console.log('🔑 Password: admin123');
        } else {
            console.log('✅ Demo admin user already exists in memory');
        }
    } catch (error) {
        console.error('❌ Failed to create demo admin:', error.message);
    }
};

// Initialize demo admin on server start
initializeDemoAdmin();

// Check if any admin user exists
router.get('/check-setup', async (req, res) => {
    try {
        const adminCount = users.filter(user => user.role === 'admin').length;
        res.json({ needsSetup: adminCount === 0 });
    } catch (error) {
        console.error('Setup check error:', error);
        res.json({ needsSetup: true });
    }
});

// Register admin user (first time setup)
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        console.log('Registration attempt:', { username, email });

        // Validate input
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // Check if user already exists
        const existingUser = users.find(user => 
            user.email === email || user.username === username
        );

        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = {
            _id: (users.length + 1).toString(),
            username,
            email,
            password: hashedPassword,
            role: 'admin',
            isActive: true,
            lastLogin: null,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        users.push(newUser);

        // Generate JWT token
        const token = jwt.sign(
            { userId: newUser._id, username: newUser.username, role: newUser.role },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        console.log('✅ Admin user created successfully:', newUser.email);

        res.status(201).json({
            message: 'Admin user created successfully',
            token,
            user: {
                id: newUser._id,
                username: newUser.username,
                email: newUser.email,
                role: newUser.role
            }
        });

    } catch (error) {
        console.error('❌ Registration error:', error);
        res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log('Login attempt:', { email });

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find user by email
        const user = users.find(u => u.email === email.toLowerCase());
        if (!user) {
            console.log('❌ User not found:', email);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(401).json({ error: 'Account is deactivated' });
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            console.log('❌ Invalid password for:', email);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Update last login
        user.lastLogin = new Date();
        user.updatedAt = new Date();

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, username: user.username, role: user.role },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        console.log('✅ Login successful:', user.email);

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                lastLogin: user.lastLogin
            }
        });

    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
});

// Verify token
router.post('/verify', async (req, res) => {
    try {
        const { token } = req.body;
        
        if (!token) {
            return res.status(401).json({ valid: false, error: 'Token required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const user = users.find(u => u._id === decoded.userId);
        
        if (!user) {
            return res.status(401).json({ valid: false, error: 'User not found' });
        }

        if (!user.isActive) {
            return res.status(401).json({ valid: false, error: 'Account deactivated' });
        }

        res.json({ 
            valid: true, 
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Token verification error:', error);
        res.status(401).json({ valid: false, error: 'Invalid token' });
    }
});

// Create demo admin user (for testing)
router.post('/create-demo-admin', async (req, res) => {
    try {
        // Check if demo admin already exists
        const existingAdmin = users.find(user => user.email === 'admin@swiftbuy.com');
        if (existingAdmin) {
            return res.status(400).json({ error: 'Demo admin already exists' });
        }

        // Create demo admin user
        const hashedPassword = await bcrypt.hash('admin123', 10);
        const demoAdmin = {
            _id: '1',
            username: 'admin',
            email: 'admin@swiftbuy.com',
            password: hashedPassword,
            role: 'admin',
            isActive: true,
            lastLogin: null,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        users.push(demoAdmin);

        console.log('✅ Demo admin user created successfully');

        res.json({
            message: 'Demo admin user created successfully',
            credentials: {
                email: 'admin@swiftbuy.com',
                password: 'admin123'
            }
        });

    } catch (error) {
        console.error('Demo admin creation error:', error);
        res.status(500).json({ error: 'Failed to create demo admin: ' + error.message });
    }
});

// Get all users (for debugging)
router.get('/debug-users', (req, res) => {
    res.json({
        totalUsers: users.length,
        users: users.map(u => ({
            id: u._id,
            username: u.username,
            email: u.email,
            role: u.role,
            isActive: u.isActive
        }))
    });
});

module.exports = router;