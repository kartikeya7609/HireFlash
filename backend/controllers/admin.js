import User from '../models/User.js';
import WorkerProfile from '../models/WorkerProfile.js';
import Booking from '../models/Booking.js';

// @desc    Get all users in the system
// @route   GET /api/admin/users
// @access  Private (Admin only)
export const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle ban state for a user
// @route   PUT /api/admin/users/:id/ban
// @access  Private (Admin only)
export const toggleUserBan = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ success: false, message: 'Cannot ban administrative profiles' });
    }

    user.isBanned = !user.isBanned;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ban state toggled to ${user.isBanned}`,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle verification status for a worker profile
// @route   PUT /api/admin/workers/:id/verify
// @access  Private (Admin only)
export const toggleWorkerVerify = async (req, res, next) => {
  try {
    const profile = await WorkerProfile.findById(req.params.id).populate('user', 'name email');
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Worker profile not found' });
    }

    profile.isVerified = !profile.isVerified;
    await profile.save();

    res.status(200).json({
      success: true,
      message: `Worker verification status toggled to ${profile.isVerified}`,
      data: profile
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all bookings in the system
// @route   GET /api/admin/bookings
// @access  Private (Admin only)
export const getBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find()
      .populate('customerId', 'name email phone')
      .populate('workerId', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get comprehensive marketplace dashboard analytics
// @route   GET /api/admin/stats
// @access  Private (Admin only)
export const getStats = async (req, res, next) => {
  try {
    // 1. Users statistics
    const totalUsers = await User.countDocuments();
    const customerCount = await User.countDocuments({ role: 'customer' });
    const workerCount = await User.countDocuments({ role: 'worker' });
    const adminCount = await User.countDocuments({ role: 'admin' });
    const bannedCount = await User.countDocuments({ isBanned: true });

    // 2. Worker profiles statistics
    const totalProfiles = await WorkerProfile.countDocuments();
    const verifiedProfiles = await WorkerProfile.countDocuments({ isVerified: true });

    // 3. Bookings statistics
    const totalBookings = await Booking.countDocuments();
    const pendingBookings = await Booking.countDocuments({ status: 'pending' });
    const acceptedBookings = await Booking.countDocuments({ status: 'accepted' });
    const completedBookings = await Booking.countDocuments({ status: 'completed' });
    const cancelledBookings = await Booking.countDocuments({ status: 'rejected' });

    // 4. Financial Calculations (Gross Transaction Value)
    const bookingsList = await Booking.find();
    let grossValue = 0;
    bookingsList.forEach((b) => {
      if (b.status === 'completed' || b.status === 'accepted') {
        grossValue += (b.hourlyRate || 30) * 3; // Baseline average 3-hour job allocation
      }
    });

    // 5. Category Distribution
    const categories = ['Plumbing', 'Electrical', 'Tutoring', 'Cleaning', 'Carpentry'];
    const categoryDistribution = await Promise.all(
      categories.map(async (cat) => {
        const workers = await WorkerProfile.countDocuments({ category: cat });
        const bookings = await Booking.countDocuments({ serviceType: cat });
        return { category: cat, workers, bookings };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          customers: customerCount,
          workers: workerCount,
          admins: adminCount,
          banned: bannedCount
        },
        profiles: {
          total: totalProfiles,
          verified: verifiedProfiles
        },
        bookings: {
          total: totalBookings,
          pending: pendingBookings,
          accepted: acceptedBookings,
          completed: completedBookings,
          cancelled: cancelledBookings
        },
        financials: {
          grossVolume: grossValue
        },
        categoryDistribution
      }
    });
  } catch (error) {
    next(error);
  }
};
