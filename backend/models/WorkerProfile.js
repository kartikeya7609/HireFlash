import mongoose from 'mongoose';

const WorkerProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    category: {
      type: String,
      required: [true, 'Please select a service category'],
      enum: ['Plumbing', 'Electrical', 'Tutoring', 'Cleaning', 'Carpentry']
    },
    profession: {
      type: String,
      default: ''
    },
    skills: {
      type: [String],
      default: []
    },
    hourlyRate: {
      type: Number,
      required: [true, 'Please add an hourly rate (pricing)']
    },
    description: {
      type: String,
      required: [true, 'Please add a profile description']
    },
    experience: {
      type: Number,
      required: [true, 'Please add years of experience']
    },
    rating: {
      type: Number,
      default: 5.0
    },
    location: {
      type: String,
      required: [true, 'Please add operational location']
    },
    profileImageUrl: {
      type: String,
      default: ''
    },
    availability: {
      type: Boolean,
      default: true
    },
    isVerified: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('WorkerProfile', WorkerProfileSchema);
