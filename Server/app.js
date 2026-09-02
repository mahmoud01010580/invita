const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require("path");
const Invitation = require('./models');
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "../Client")));

console.log("MONGO_URI exists:", !!process.env.MONGO_URI);

mongoose
  .connect(process.env.MONGO_URI, {
    dbName: "invita",
  })
  .then(() => {
    console.log("Database connected successfully");
  })
  .catch((e) => {
    console.error("MongoDB connection error:", e);
  });

// تحويل رابط Google Maps إلى Embed URL
function convertToEmbedUrl(url) {
  if (!url) return '';
  if (url.includes('/maps/embed') || url.includes('output=embed')) return url;

  const match = url.match(/q=([^&]+)/) || url.match(/place\/([^\/]+)/);
  if (match && match[1]) {
    return `https://maps.google.com/maps?q=${match[1]}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  }
  return `https://maps.google.com/maps?q=${encodeURIComponent(url)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
}

// ======================== HTML Routes ======================== //

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../Client/Invite.html"));
});
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "../Client/dashboard.html"));
});
app.get("/wishes", (req, res) => {
  res.sendFile(path.join(__dirname, "../Client/wishes.html"));
});

// ======================== API Routes ======================== //

// 1. جلب قائمة الدعوات للوحة الأدمن (بما فيها الألوان كاملاً)
app.get('/api/invitations', async (req, res) => {
  try {
    const list = await Invitation.find()
      .select('slug theme groomName brideName dateISO venueName groomPhoto bridePhoto ourStoryTitle ourStoryText wishes');
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. جلب دعوة محددة للزوار (تُرجع جميع البيانات وبشكل كلي موضوع الألوان)
app.get('/api/invitations/:slug', async (req, res) => {
  try {
    const inv = await Invitation.findOne({ slug: req.params.slug }).lean();
    if (!inv) return res.status(404).json({ error: "Invitation not found" });

    inv.wishes = (inv.wishes || []).filter(w => w.status === 'approved');
    res.json(inv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. جلب كافة بيانات الدعوة للأدمن
app.get('/api/invitations/:slug/admin', async (req, res) => {
  try {
    const inv = await Invitation.findOne({ slug: req.params.slug });
    if (!inv) return res.status(404).json({ error: "Invitation not found" });
    res.json(inv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. إنشاء / تحديث دعوة (يدعم تعديل الألوان Dynamically)
app.post('/api/invitations', async (req, res) => {
  try {
    const data = req.body;
    if (data.venueMapUrl) {
      data.venueMapEmbedUrl = convertToEmbedUrl(data.venueMapUrl);
    }

    // البحث عن الدعوة لتحديثها أو إنشائها لو جديدة
    let inv = await Invitation.findOne({ slug: data.slug });
    if (inv) {
      Object.assign(inv, data);
      await inv.save();
      return res.status(200).json(inv);
    }

    const newInv = new Invitation(data);
    await newInv.save();
    res.status(201).json(newInv);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 5. مسح دعوة نهائياً
app.delete('/api/invitations/:slug', async (req, res) => {
  try {
    const deletedInv = await Invitation.findOneAndDelete({ slug: req.params.slug });
    if (!deletedInv) return res.status(404).json({ error: "Invitation not found" });
    res.json({ message: "Invitation deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. إضافة تهنئة جديدة
app.post('/api/invitations/:slug/wishes', async (req, res) => {
  try {
    const { name, msg, attending } = req.body;
    const inv = await Invitation.findOne({ slug: req.params.slug });
    if (!inv) return res.status(404).json({ error: "Invitation not found" });

    inv.wishes.unshift({ name, msg, attending, status: 'pending' });
    await inv.save();
    res.status(201).json({ message: "Sent successfully and pending approval" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 7. تحديث حالة التهنئة (قبول / رفض)
app.patch('/api/invitations/:slug/wishes/:wishId', async (req, res) => {
  try {
    const { status } = req.body;
    const inv = await Invitation.findOne({ slug: req.params.slug });
    if (!inv) return res.status(404).json({ error: "Invitation not found" });

    const wish = inv.wishes.id(req.params.wishId);
    if (!wish) return res.status(404).json({ error: "Wish not found" });

    wish.status = status;
    await inv.save();
    res.json(inv.wishes);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
