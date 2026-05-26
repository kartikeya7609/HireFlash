import WorkerProfile from '../models/WorkerProfile.js';
import User from '../models/User.js';

// @desc    Get all workers or filter by category/location
// @route   GET /api/workers
// @access  Public
export const getWorkers = async (req, res, next) => {
  try {
    const { category, location, search, minRate, maxRate, profession, page = 1, limit = 6 } = req.query;
    const query = { availability: true };

    if (category) {
      query.category = category;
    }
    if (location) {
      query.location = new RegExp(location, 'i');
    }
    if (profession) {
      query.profession = new RegExp(profession, 'i');
    }

    // Rate boundary range query
    if (minRate || maxRate) {
      query.hourlyRate = {};
      if (minRate) query.hourlyRate.$gte = Number(minRate);
      if (maxRate) query.hourlyRate.$lte = Number(maxRate);
    }

    // Text search matching user names or profile properties
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      
      const matchingUsers = await User.find({ name: searchRegex }).select('_id');
      const userIds = matchingUsers.map(u => u._id);

      query.$or = [
        { profession: searchRegex },
        { description: searchRegex },
        { category: searchRegex },
        { skills: { $in: [searchRegex] } },
        { user: { $in: userIds } }
      ];
    }

    // Pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skipNum = (pageNum - 1) * limitNum;

    const total = await WorkerProfile.countDocuments(query);
    const workers = await WorkerProfile.find(query)
      .populate('user', 'name email phone address')
      .skip(skipNum)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: workers.length,
      pagination: {
        total,
        pages: Math.ceil(total / limitNum),
        page: pageNum,
        limit: limitNum
      },
      data: workers
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single worker profile by ID
// @route   GET /api/workers/:id
// @access  Public
export const getWorker = async (req, res, next) => {
  try {
    const worker = await WorkerProfile.findById(req.params.id).populate('user', 'name email phone address');

    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker profile not found' });
    }

    res.status(200).json({
      success: true,
      data: worker
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current authenticated worker's profile
// @route   GET /api/workers/profile/me
// @access  Private (Worker only)
export const getMyProfile = async (req, res, next) => {
  try {
    const worker = await WorkerProfile.findOne({ user: req.user.id }).populate('user', 'name email phone address');
    
    if (!worker) {
      return res.status(404).json({
        success: false,
        message: 'No worker profile found for this account'
      });
    }

    res.status(200).json({
      success: true,
      data: worker
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new worker profile
// @route   POST /api/workers/profile
// @access  Private (Worker only)
export const createMyProfile = async (req, res, next) => {
  try {
    const { category, profession, skills, hourlyRate, experience, location, description, profileImageUrl } = req.body;

    // Check if worker profile already exists for user
    const existingProfile = await WorkerProfile.findOne({ user: req.user.id });
    if (existingProfile) {
      return res.status(400).json({
        success: false,
        message: 'A worker profile already exists for this account. Use PUT to update instead.'
      });
    }

    // Basic Input Validations
    if (!category || !['Plumbing', 'Electrical', 'Tutoring', 'Cleaning', 'Carpentry'].includes(category)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid service category' });
    }

    if (hourlyRate === undefined || Number(hourlyRate) <= 0) {
      return res.status(400).json({ success: false, message: 'Please provide a valid hourly rate (pricing) greater than 0' });
    }

    if (experience === undefined || Number(experience) < 0) {
      return res.status(400).json({ success: false, message: 'Please provide valid years of experience' });
    }

    if (!location || !location.trim()) {
      return res.status(400).json({ success: false, message: 'Please add operational location' });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({ success: false, message: 'Please add a profile description' });
    }

    // Create profile
    const worker = await WorkerProfile.create({
      user: req.user.id,
      category,
      profession: profession || '',
      skills: Array.isArray(skills) ? skills : (skills ? skills.split(',').map(s => s.trim()) : []),
      hourlyRate: Number(hourlyRate),
      experience: Number(experience),
      location,
      description,
      profileImageUrl: profileImageUrl || ''
    });

    const populatedWorker = await WorkerProfile.findById(worker._id).populate('user', 'name email phone address');

    res.status(201).json({
      success: true,
      message: 'Worker profile created successfully',
      data: populatedWorker
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update current worker's profile
// @route   PUT /api/workers/profile
// @access  Private (Worker only)
export const updateMyProfile = async (req, res, next) => {
  try {
    const { category, profession, skills, hourlyRate, experience, location, description, profileImageUrl, availability } = req.body;

    let worker = await WorkerProfile.findOne({ user: req.user.id });
    if (!worker) {
      return res.status(404).json({
        success: false,
        message: 'No worker profile exists to update. Use POST to create a profile first.'
      });
    }

    // Input Validation if fields are provided
    if (category && !['Plumbing', 'Electrical', 'Tutoring', 'Cleaning', 'Carpentry'].includes(category)) {
      return res.status(400).json({ success: false, message: 'Please select a valid service category' });
    }

    if (hourlyRate !== undefined && Number(hourlyRate) <= 0) {
      return res.status(400).json({ success: false, message: 'Please select a valid hourly rate (pricing) greater than 0' });
    }

    if (experience !== undefined && Number(experience) < 0) {
      return res.status(400).json({ success: false, message: 'Please enter valid years of experience' });
    }

    // Build update object
    const fieldsToUpdate = {};
    if (category) fieldsToUpdate.category = category;
    if (profession !== undefined) fieldsToUpdate.profession = profession;
    if (skills !== undefined) {
      fieldsToUpdate.skills = Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim());
    }
    if (hourlyRate !== undefined) fieldsToUpdate.hourlyRate = Number(hourlyRate);
    if (experience !== undefined) fieldsToUpdate.experience = Number(experience);
    if (location !== undefined) fieldsToUpdate.location = location;
    if (description !== undefined) fieldsToUpdate.description = description;
    if (profileImageUrl !== undefined) fieldsToUpdate.profileImageUrl = profileImageUrl;
    if (availability !== undefined) fieldsToUpdate.availability = !!availability;

    // Perform Update
    worker = await WorkerProfile.findOneAndUpdate(
      { user: req.user.id },
      { $set: fieldsToUpdate },
      { new: true, runValidators: true }
    ).populate('user', 'name email phone address');

    res.status(200).json({
      success: true,
      message: 'Worker profile updated successfully',
      data: worker
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete current worker's profile
// @route   DELETE /api/workers/profile
// @access  Private (Worker only)
export const deleteMyProfile = async (req, res, next) => {
  try {
    const worker = await WorkerProfile.findOne({ user: req.user.id });
    if (!worker) {
      return res.status(404).json({
        success: false,
        message: 'No worker profile found to delete'
      });
    }

    await WorkerProfile.findOneAndDelete({ user: req.user.id });

    res.status(200).json({
      success: true,
      message: 'Worker profile deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
