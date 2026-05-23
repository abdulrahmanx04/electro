const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { validationResult } = require('express-validator');

const User = require('../models/User');

const JWT_SECRET =
  process.env.JWT_SECRET || 'supersecret_electrohub_token_key_98765';

// ───────────────── REGISTER ─────────────────
const register = async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array()
    });
  }

  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({
      email: email.toLowerCase()
    });

    if (existing) {
      return res.status(400).json({
        error: 'Email already registered'
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: passwordHash,
      isAdmin: false
    });

    const token = jwt.sign(
      {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin
      },
      JWT_SECRET,
      {
        expiresIn: '24h'
      }
    );

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin
      }
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: 'Internal server error'
    });
  }
};

// ───────────────── LOGIN ─────────────────
const login = async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array()
    });
  }

  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      email: email.toLowerCase()
    });

    if (!user) {
      return res.status(400).json({
        error: 'Invalid email or password'
      });
    }

    const valid = await bcrypt.compare(
      password,
      user.password
    );

    if (!valid) {
      return res.status(400).json({
        error: 'Invalid email or password'
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin
      },
      JWT_SECRET,
      {
        expiresIn: '24h'
      }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin
      }
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: 'Internal server error'
    });
  }
};

// ───────────────── PROFILE ─────────────────
const getProfile = async (req, res) => {
  try {

    const user = await User.findById(req.user.id)
      .select('-password');

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin
    });

  } catch (err) {

    res.status(500).json({
      error: 'Internal server error'
    });
  }
};

// ───────────────── FORGOT PASSWORD ─────────────────
const forgotPassword = async (req, res) => {

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array()
    });
  }

  try {

    const { email } = req.body;

    const user = await User.findOne({
      email: email.toLowerCase()
    });

    if (!user) {
      return res.json({
        message:
          'If that email exists, a reset link has been sent.'
      });
    }

    // RESET TOKEN
    const resetToken = jwt.sign(
      {
        id: user._id,
        email: user.email
      },
      JWT_SECRET,
      {
        expiresIn: '1h'
      }
    );

    const resetLink =
      `http://localhost:5000/api/auth/reset-password/${resetToken}`;

    // EMAIL
    if (
      process.env.EMAIL_USER &&
      process.env.EMAIL_PASS
    ) {

      const transporter =
        nodemailer.createTransport({
          host: process.env.EMAIL_HOST,
          port: Number(process.env.EMAIL_PORT),
          secure: false,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          }
        });

      await transporter.sendMail({
        from:
          `"ElectroHub Support" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject:
          'ElectroHub Password Reset',
        html: `
          <h2>Password Reset</h2>

          <p>Hello ${user.name}</p>

          <p>Click below:</p>

          <a href="${resetLink}">
            Reset Password
          </a>
        `
      });
    }

    res.json({
      message:
        'If password for your email exists, a reset link has been sent.'
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: 'Internal server error'
    });
  }
};

// ───────────────── RESET PASSWORD ─────────────────
const resetPassword = async (req, res) => {

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array()
    });
  }

  try {

    const { token, newPassword } = req.body;

    // VERIFY TOKEN
    const decoded = jwt.verify(
      token,
      JWT_SECRET
    );

    // GET USER
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // CHECK IF TOKEN IS OLDER
    if (
      user.passwordChangedAt &&
      decoded.iat * 1000 <
      user.passwordChangedAt.getTime()
    ) {
      return res.status(400).json({
        error:
          'Token already used'
      });
    }

    // HASH PASSWORD
    const passwordHash =
      await bcrypt.hash(newPassword, 10);

    // UPDATE PASSWORD
    await User.findByIdAndUpdate(
      decoded.id,
      {
        password: passwordHash,
        passwordChangedAt: new Date()
      }
    );

    res.json({
      message:
        'Password reset successful'
    });

  } catch (err) {

    console.error(err);

    res.status(400).json({
      error:
        'Invalid or expired token'
    });
  }
};
const changePassword = async (req, res) => {
  try {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Missing password fields'
      });
    }

    const user = await User.findById(req.user.id);

    if (!user || !user.password) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    const isMatch = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isMatch) {
      return res.status(400).json({
        error: 'Current password is incorrect'
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        error: 'New password cannot be same as current password'
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    user.password = passwordHash;
    user.passwordChangedAt = new Date();

    await user.save();

    res.json({
      message: 'Password changed successfully'
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: 'Internal server error'
    });
  }
};
module.exports = {
  register,
  login,
  getProfile,
  forgotPassword,
  resetPassword,
  changePassword
};