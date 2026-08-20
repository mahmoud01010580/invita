const mongoose = require('mongoose');

const wishSchema = new mongoose.Schema({
  name: { type: String, required: true },
  msg: { type: String, required: true },
  attending: { type: Boolean, default: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

const invitationSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true },
  groomName: { type: String, required: true },
  brideName: { type: String, required: true },
  dateISO: { type: Date, required: true },
  venueName: { type: String, required: true },
  venueMapUrl: { type: String, required: true },
  venueMapEmbedUrl: { type: String, default: "" },
  groomPhoto: { type: String, default: "" },
  bridePhoto: { type: String, default: "" },
  ourStoryTitle: { type: String, default: "بداية حكايتنا" }, 
  ourStoryText: { type: String, default: "" },         
  wishes: [wishSchema]
}, { timestamps: true });

module.exports = mongoose.model('Invitation', invitationSchema);