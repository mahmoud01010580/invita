const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Invitation = require('./models/Invitation');
require("dotenv").config()
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

mongoose
  .connect(process.env.MONGO_URI, {
    dbName: "mahmoud",
  })
  .then(async () => {
    console.log("database connect sucsess");
    await User.syncIndexes();
    console.log("Indexes synced");
  })
  .catch((e) => {
    console.log(e);
  });
function convertToEmbedUrl(url) {
  if (!url) return '';
  if (url.includes('/maps/embed') || url.includes('output=embed')) return url;
  
  const match = url.match(/q=([^&]+)/) || url.match(/place\/([^\/]+)/);
  if (match && match[1]) {
    return `https://maps.google.com/maps?q=${match[1]}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  }
  return `https://maps.google.com/maps?q=${encodeURIComponent(url)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
}

/* ---------- API Routes ---------- */

app.get('/api/invitations', async (req, res) => {
  try {
    const list = await Invitation.find().select('slug groomName brideName dateISO venueName groomPhoto bridePhoto ourStoryTitle ourStoryText wishes');
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/invitations/:slug', async (req, res) => {
  try {
    const inv = await Invitation.findOne({ slug: req.params.slug }).lean();
    if (!inv) return res.status(404).json({ error: "Invitation not found" });
    
    inv.wishes = inv.wishes.filter(w => w.status === 'approved');
    res.json(inv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/invitations/:slug/admin', async (req, res) => {
  try {
    const inv = await Invitation.findOne({ slug: req.params.slug });
    if (!inv) return res.status(404).json({ error: "Invitation not found" });
    res.json(inv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/invitations', async (req, res) => {
  try {
    const data = req.body;
    data.venueMapEmbedUrl = convertToEmbedUrl(data.venueMapUrl);
    
    const newInv = new Invitation(data);
    await newInv.save();
    res.status(201).json(newInv);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

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

module.exports = app;
