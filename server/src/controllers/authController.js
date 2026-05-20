import User from "../models/User.js";
import bcrypt from "bcryptjs";
import generateToken from "../utils/generateToken.js";
import sendEmail from "../utils/sendEmail.js";

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

// REGISTER USER
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      // If they already verified, block. If not verified, re-send OTP.
      if (userExists.isEmailVerified) {
        return res.status(400).json({ message: "User already exists" });
      }

      const otp = generateOtp();
      const otpSalt = await bcrypt.genSalt(10);
      userExists.emailOtpHash = await bcrypt.hash(otp, otpSalt);
      userExists.emailOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
      await userExists.save();

      await sendEmail({
        to: userExists.email,
        subject: "SyncSpace Email Verification OTP",
        text: `Your SyncSpace verification OTP is: ${otp}\n\nThis OTP will expire in 10 minutes.`,
      });

      return res.status(200).json({ message: "OTP sent to email", email: userExists.email });
    }

    // hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const otp = generateOtp();
    const otpSalt = await bcrypt.genSalt(10);
    const emailOtpHash = await bcrypt.hash(otp, otpSalt);
    const emailOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    // create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      isEmailVerified: false,
      emailOtpHash,
      emailOtpExpires
    });

    await sendEmail({
      to: user.email,
      subject: "SyncSpace Email Verification OTP",
      text: `Your SyncSpace verification OTP is: ${otp}\n\nThis OTP will expire in 10 minutes.`,
    });

    res.status(201).json({ message: "OTP sent to email", email: user.email });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

export const verifyEmailOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.isEmailVerified) {
      return res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id)
      });
    }

    if (!user.emailOtpHash || !user.emailOtpExpires) {
      return res.status(400).json({ message: "OTP not found. Please register again." });
    }

    if (user.emailOtpExpires.getTime() < Date.now()) {
      return res.status(400).json({ message: "OTP expired. Please register again to get a new OTP." });
    }

    const ok = await bcrypt.compare(String(otp), user.emailOtpHash);
    if (!ok) return res.status(400).json({ message: "Invalid OTP" });

    user.isEmailVerified = true;
    user.emailOtpHash = undefined;
    user.emailOtpExpires = undefined;
    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const resendEmailOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.isEmailVerified) return res.status(400).json({ message: "Email is already verified" });

    const otp = generateOtp();
    const otpSalt = await bcrypt.genSalt(10);
    user.emailOtpHash = await bcrypt.hash(otp, otpSalt);
    user.emailOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendEmail({
      to: user.email,
      subject: "SyncSpace Email Verification OTP",
      text: `Your SyncSpace verification OTP is: ${otp}\n\nThis OTP will expire in 10 minutes.`,
    });

    res.json({ message: "OTP resent to email", email: user.email });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//login user

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({ message: "Please verify your email with OTP before logging in" });
    }

    // compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id)
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//get current user

export const getCurrentUser = async (req, res) => {
  try {
    res.json(req.user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//forgot password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User with this email does not exist" });
    }

    // Generate 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash the OTP
    const salt = await bcrypt.genSalt(10);
    const hashedOtp = await bcrypt.hash(otp, salt);

    // Save hashed OTP & expiration (10 minutes)
    user.resetOtpHash = hashedOtp;
    user.resetOtpExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    // Send email with OTP
    const message = `You requested a password reset. Your OTP code is: ${otp}. It will expire in 10 minutes.`;
    await sendEmail({
      to: user.email,
      subject: "SyncSpace Password Reset OTP",
      text: message
    });

    res.json({ message: "OTP sent to your email" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//reset password
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User with this email does not exist" });
    }

    if (!user.resetOtpHash || !user.resetOtpExpires || user.resetOtpExpires < Date.now()) {
      return res.status(400).json({ message: "OTP has expired or is invalid. Please request a new one." });
    }

    // verify OTP
    const isMatch = await bcrypt.compare(otp, user.resetOtpHash);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password, clear reset OTP fields
    user.password = hashedPassword;
    user.resetOtpHash = undefined;
    user.resetOtpExpires = undefined;

    // Ensure email is verified if they successfully complete forgot password
    user.isEmailVerified = true;

    await user.save();

    res.json({ message: "Password reset successfully" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};