import User from '../models/User.js';
import WorkerProfile from '../models/WorkerProfile.js';
import sendEmail from '../utils/sendEmail.js';

// Helper to get token from model, create cookie and send response
const sendTokenResponse = async (user, statusCode, res, message = 'Success') => {
  // Create token
  const token = user.getSignedJwtToken();

  const cookieExpireDays = parseInt(process.env.JWT_COOKIE_EXPIRE || '30', 10);
  const cookieOptions = {
    expires: new Date(Date.now() + cookieExpireDays * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  };

  // Build clean user object to return without returning password
  const responseUser = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    address: user.address
  };

  // Asynchronously query and attach workerProfile if user is a worker
  if (user.role === 'worker') {
    const workerProfile = await WorkerProfile.findOne({ user: user._id });
    if (workerProfile) {
      responseUser.workerProfile = workerProfile;
    }
  }

  res
    .status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({
      success: true,
      message,
      token,
      user: responseUser
    });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
  try {
    const { name, email, password, role, phone, address, workerDetails } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    // Create user (pre-save hook in User.js will hash password)
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'customer',
      phone: phone || '',
      address: address || ''
    });

    // If the registered user is a worker, create worker profile
    if (user.role === 'worker' && workerDetails) {
      await WorkerProfile.create({
        user: user._id,
        category: workerDetails.category || 'Plumbing',
        hourlyRate: workerDetails.hourlyRate || 25,
        description: workerDetails.description || 'Professional provider ready to help.',
        experience: workerDetails.experience || 1,
        location: workerDetails.location || 'New York'
      });
    }

    await sendTokenResponse(user, 201, res, 'User registered successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    // Check for user (must explicitly select password since it has select: false)
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    await sendTokenResponse(user, 200, res, 'Logged in successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Send OTP to email (Register automatically if new user)
// @route   POST /api/auth/send-otp
// @access  Public
export const sendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide an email' });
    }

    // Check if user already exists
    let user = await User.findOne({ email });
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      // Auto-register new user via OTP
      const autoPassword = Math.random().toString(36).slice(-8) + 'Ab1!';
      user = await User.create({
        name: email.split('@')[0],
        email,
        password: autoPassword,
        role: 'customer'
      });
    }

    // Generate a secure 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    // Dispatch beautifully styled HTML email to the user via SMTP / Ethereal fallback
    const emailSubject = `Your FasHire Verification Code: ${otp}`;
    const emailHtmlBody = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px 20px; border: 1px solid #e2e8f0; border-radius: 16px; bg: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        <div style="text-align: center; border-bottom: 2px solid #f59e0b; padding-bottom: 20px; margin-bottom: 25px;">
          <h1 style="color: #0f172a; margin: 0; font-size: 26px; font-weight: 900; tracking-tight;">FasHire</h1>
          <p style="color: #64748b; margin: 5px 0 0; font-size: 14px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">On-Demand Specialist Network</p>
        </div>
        <div style="padding: 10px 5px; text-align: center;">
          <p style="color: #0f172a; font-size: 18px; font-weight: 700; margin: 0 0 10px;">Security Verification Code</p>
          <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 25px;">Please enter the following 6-digit verification code to securely access or create your FasHire account. This session security token is active for 5 minutes.</p>
          
          <div style="display: inline-block; padding: 16px 36px; background-color: #fffbeb; border: 2px solid #fef3c7; border-radius: 16px; margin-bottom: 25px;">
            <span style="font-size: 36px; font-weight: 950; letter-spacing: 8px; color: #d97706; font-family: 'Courier New', Courier, monospace;">${otp}</span>
          </div>
          
          <p style="color: #ef4444; font-size: 12px; font-weight: 600; margin: 0 0 5px;">⚠️ Never share your OTP verification code with anyone.</p>
          <p style="color: #64748b; font-size: 11px; margin: 0 0 30px;">If you didn't request this action, you can safely ignore this automated message.</p>
        </div>
        <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; font-size: 12px; color: #94a3b8;">
          <p style="margin: 0; font-weight: 600;">FasHire Ecosystem Security &bull; End-to-End Encrypted Access Node</p>
          <p style="margin: 4px 0 0;">Dedicated support line: support@fashire.com</p>
        </div>
      </div>
    `;

    try {
      await sendEmail({
        email,
        subject: emailSubject,
        html: emailHtmlBody,
        otp,
        name: user.name
      });
    } catch (emailError) {
    }

    res.status(200).json({
      success: true,
      message: 'Verification code sent to your email',
      isNewUser
      // ⚠️ Never expose the OTP in the API response — email is the only delivery channel
    });
  } catch (error) {
    next(error);
  }
};


// @desc    Verify OTP and log user in
// @route   POST /api/auth/verify-otp
// @access  Public
export const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Please provide email and OTP' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Validate OTP and expiration
    if (!user.otp || user.otp !== otp || new Date() > user.otpExpires) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    // Clear OTP fields upon successful verification
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    await sendTokenResponse(user, 200, res, 'Logged in successfully via OTP');
  } catch (error) {
    next(error);
  }
};

// @desc    Log user out / clear cookie
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res, next) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    let workerProfile = null;
    if (user.role === 'worker') {
      workerProfile = await WorkerProfile.findOne({ user: user._id });
    }

    const responseUser = user.toObject();
    if (workerProfile) {
      responseUser.workerProfile = workerProfile;
    }

    res.status(200).json({
      success: true,
      user: responseUser
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Stream Chat token for current user
// @route   GET /api/auth/stream-token
// @access  Private
import { StreamChat } from 'stream-chat';
export const getStreamToken = async (req, res, next) => {
  try {
    const apiKey = process.env.STREAM_API_KEY || 'ux27vzwshx4n';
    const apiSecret = process.env.STREAM_API_SECRET || 'e79ehm2k6xem6swv8c5epk638k4kexsc4742wh2s8hgr763sw4vgy7g3x5r2d4u9';

    const serverClient = StreamChat.getInstance(apiKey, apiSecret);
    const userId = req.user.id.toString();
    const token = serverClient.createToken(userId);

    // Fetch user details for upserting
    let avatarUrl = '';
    if (req.user.role === 'worker') {
      const wp = await WorkerProfile.findOne({ user: req.user.id });
      if (wp) avatarUrl = wp.profileImageUrl;
    }

    // Register user details on Stream Chat server so names and avatars sync in real-time
    await serverClient.upsertUser({
      id: userId,
      name: req.user.name,
      role: 'user',
      image: avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(req.user.name)}`
    });

    res.status(200).json({
      success: true,
      token,
      apiKey,
      userId
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Synchronize user authenticated via Firebase
// @route   POST /api/auth/firebase-sync
// @access  Public
export const firebaseSync = async (req, res, next) => {
  try {
    const { email, name, role, phone, address, firebaseUid, workerDetails } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide email from Firebase' });
    }

    let user = await User.findOne({ email });

    if (!user) {
      // Auto-register brand new user signing up via Google/Firebase
      const autoPassword = Math.random().toString(36).slice(-8) + 'Ab1!';
      user = await User.create({
        name: name || email.split('@')[0],
        email,
        password: autoPassword,
        role: role || 'customer',
        phone: phone || '',
        address: address || ''
      });

      // If registered user is a worker, create worker profile
      if (user.role === 'worker' && workerDetails) {
        await WorkerProfile.create({
          user: user._id,
          category: workerDetails.category || 'Plumbing',
          hourlyRate: workerDetails.hourlyRate || 25,
          description: workerDetails.description || 'Professional provider ready to help.',
          experience: workerDetails.experience || 1,
          location: workerDetails.location || 'New York'
        });
      }
    } else {
    }

    await sendTokenResponse(user, 200, res, 'Logged in successfully via Firebase Authentication');
  } catch (error) {
    next(error);
  }
};

// @desc    Update current user profile (e.g., phone and address)
// @route   PUT /api/auth/update-profile
// @access  Private
export const updateProfile = async (req, res, next) => {
  try {
    const { phone, address } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (phone) user.phone = phone;
    if (address) user.address = address;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    next(error);
  }
};
