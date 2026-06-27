import User from '../models/User.js';
import WorkerProfile from '../models/WorkerProfile.js';
import Booking from '../models/Booking.js';
import PageVisit from '../models/PageVisit.js';

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

// @desc    Track a page visit (public endpoint)
// @route   POST /api/admin/track
// @access  Public
export const trackVisit = async (req, res, next) => {
  try {
    const { path, userId, referrer } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || '';

    await PageVisit.create({
      path: path || '/',
      ip,
      userAgent,
      userId: userId || null,
      referrer: referrer || ''
    });

    res.status(201).json({ success: true });
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

    // 6. Website Visit Analytics
    const totalVisits = await PageVisit.countDocuments();
    const uniqueIPs = await PageVisit.distinct('ip');
    const uniqueVisitors = uniqueIPs.length;

    // Visits over last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const visitsByDay = await PageVisit.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Format days for the last 7 days (fill zeros for missing days)
    const dailyVisits = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayKey = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
      const found = visitsByDay.find(
        (v) => `${v._id.year}-${v._id.month}-${v._id.day}` === dayKey
      );
      dailyVisits.push({
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        visits: found ? found.count : 0
      });
    }

    // Top pages by visit count
    const topPages = await PageVisit.aggregate([
      { $group: { _id: '$path', visits: { $sum: 1 } } },
      { $sort: { visits: -1 } },
      { $limit: 5 }
    ]);

    // Visits today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const visitsToday = await PageVisit.countDocuments({ createdAt: { $gte: todayStart } });

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
        categoryDistribution,
        visits: {
          total: totalVisits,
          unique: uniqueVisitors,
          today: visitsToday,
          daily: dailyVisits,
          topPages
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
