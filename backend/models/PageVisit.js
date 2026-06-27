import mongoose from 'mongoose';

const PageVisitSchema = new mongoose.Schema(
  {
    path: {
      type: String,
      required: true
    },
    ip: {
      type: String,
      default: 'unknown'
    },
    userAgent: {
      type: String,
      default: ''
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    referrer: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('PageVisit', PageVisitSchema);
