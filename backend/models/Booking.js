import mongoose from 'mongoose';

const BookingSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    serviceType: {
      type: String,
      required: [true, 'Please specify the service type (category)']
    },
    bookingDate: {
      type: Date,
      required: [true, 'Please specify the booking target date']
    },
    timeSlot: {
      type: String,
      default: '10:00'
    },
    hourlyRate: {
      type: Number,
      required: true
    },
    notes: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'],
      default: 'pending'
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('Booking', BookingSchema);
