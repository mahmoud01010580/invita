const mongoose = require('mongoose');

// Schema الخاص بالتهاني والأمنيات
const wishSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  msg: {
    type: String,
    required: true,
    trim: true
  },
  attending: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Schema الرئيسي للدعوة
const invitationSchema = new mongoose.Schema({
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  // هيكل الألوان الديناميكي لتستقبله وتخزنه المونجو بدون أي قيم متضاربة
  theme: {
    type: mongoose.Schema.Types.Mixed, // يسمح باستقبال اسم الثيم كـ String أو 
    default: "navy"
  },
  groomName: {
    type: String,
    required: true,
    trim: true
  },
  brideName: {
    type: String,
    required: true,
    trim: true
  },
  groomPhoto: {
    type: String,
    default: ''
  },
  bridePhoto: {
    type: String,
    default: ''
  },
  ourStoryTitle: {
    type: String,
    default: 'بداية حكايتنا'
  },
  ourStoryText: {
    type: String,
    default: ''
  },
  dateISO: {
    type: Date,
    required: true
  },
  venueName: {
    type: String,
    required: true
  },
  venueMapUrl: {
    type: String,
    required: true
  },
  venueMapEmbedUrl: {
    type: String,
    default: ''
  },
  wishes: [wishSchema]
}, {
  timestamps: true
});

module.exports = mongoose.model('Invitation', invitationSchema);
