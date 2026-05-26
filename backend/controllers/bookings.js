import Booking from '../models/Booking.js';
import User from '../models/User.js';
import WorkerProfile from '../models/WorkerProfile.js';

// @desc    Create a new booking request
// @route   POST /api/bookings
// @access  Private (Customer only)
export const createBooking = async (req, res, next) => {
  try {
    const { workerId, serviceType, bookingDate, timeSlot, hourlyRate, notes } = req.body;

    // Check if worker exists and is actually a worker
    const workerUser = await User.findById(workerId);
    if (!workerUser || workerUser.role !== 'worker') {
      return res.status(400).json({
        success: false,
        message: 'Invalid worker ID. Profile target must belong to a registered worker.'
      });
    }

    if (!serviceType) {
      return res.status(400).json({ success: false, message: 'Please specify the service type category' });
    }

    if (!bookingDate) {
      return res.status(400).json({ success: false, message: 'Please specify the booking date' });
    }

    if (!hourlyRate || Number(hourlyRate) <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid hourly pricing rate' });
    }

    const booking = await Booking.create({
      customerId: req.user.id,
      workerId,
      serviceType,
      bookingDate: new Date(bookingDate),
      timeSlot: timeSlot || '10:00',
      hourlyRate: Number(hourlyRate),
      notes: notes || ''
    });

    const populatedBooking = await Booking.findById(booking._id)
      .populate('customerId', 'name email phone')
      .populate('workerId', 'name email phone');

    res.status(201).json({
      success: true,
      message: 'Booking request sent successfully',
      data: populatedBooking
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all user-related bookings (Customer or Worker perspective)
// @route   GET /api/bookings
// @access  Private
export const getBookings = async (req, res, next) => {
  try {
    let query = {};

    if (req.user.role === 'customer') {
      query.customerId = req.user.id;
    } else if (req.user.role === 'worker') {
      query.workerId = req.user.id;
    } else {
      // Admin role (returns all)
      query = {};
    }

    const bookings = await Booking.find(query)
      .populate('customerId', 'name email phone address')
      .populate('workerId', 'name email phone address')
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

// @desc    Accept a pending booking request
// @route   PUT /api/bookings/:id/accept
// @access  Private (Worker only)
export const acceptBooking = async (req, res, next) => {
  try {
    let booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Verify worker ownership
    if (booking.workerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to accept this booking request'
      });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot accept booking. Booking is already ${booking.status}`
      });
    }

    booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: 'accepted' },
      { new: true }
    ).populate('customerId', 'name email phone').populate('workerId', 'name email phone');

    res.status(200).json({
      success: true,
      message: 'Booking request accepted successfully',
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject a pending booking request
// @route   PUT /api/bookings/:id/reject
// @access  Private (Worker only)
export const rejectBooking = async (req, res, next) => {
  try {
    let booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Verify worker ownership
    if (booking.workerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to reject this booking request'
      });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot reject booking. Booking is already ${booking.status}`
      });
    }

    booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected' },
      { new: true }
    ).populate('customerId', 'name email phone').populate('workerId', 'name email phone');

    res.status(200).json({
      success: true,
      message: 'Booking request rejected successfully',
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark booking as completed
// @route   PUT /api/bookings/:id/complete
// @access  Private (Worker only)
export const completeBooking = async (req, res, next) => {
  try {
    let booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Verify worker ownership
    if (booking.workerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to modify this booking'
      });
    }

    booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: 'completed' },
      { new: true }
    ).populate('customerId', 'name email phone').populate('workerId', 'name email phone');

    res.status(200).json({
      success: true,
      message: 'Booking completed successfully',
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel a booking request
// @route   PUT /api/bookings/:id/cancel
// @access  Private (Customer only)
export const cancelBooking = async (req, res, next) => {
  try {
    let booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Verify customer ownership
    if (booking.customerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to cancel this booking'
      });
    }

    booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled' },
      { new: true }
    ).populate('customerId', 'name email phone').populate('workerId', 'name email phone');

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: booking
    });
  } catch (error) {
    next(error);
  }
};
