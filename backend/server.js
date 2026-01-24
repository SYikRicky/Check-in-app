const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/checkin';

app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());

const attendeeSchema = new mongoose.Schema(
  {
    barcode: { type: String, required: true, unique: true, trim: true },
    name: { type: String, default: '' },
    notes: { type: String, default: '' },
    lastCheckIn: { type: Date, default: Date.now },
    checkInCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

const Attendee = mongoose.model('Attendee', attendeeSchema);

app.get('/health', (_req, res) => res.json({ ok: true }));

app.post('/api/check-ins', async (req, res) => {
  const { barcode, name, notes } = req.body || {};
  if (!barcode) {
    return res.status(400).json({ message: 'Barcode is required.' });
  }

  const trimmed = barcode.trim();
  const now = new Date();

  try {
    const attendee = await Attendee.findOneAndUpdate(
      { barcode: trimmed },
      {
        $setOnInsert: { name: name || '', notes: notes || '' },
        $set: { lastCheckIn: now },
        $inc: { checkInCount: 1 }
      },
      { new: true, upsert: true }
    );

    return res.json({ attendee });
  } catch (err) {
    console.error('Check-in failed', err);
    return res.status(500).json({ message: 'Failed to check in. Please retry.' });
  }
});

app.get('/api/check-ins', async (_req, res) => {
  try {
    const entries = await Attendee.find().sort({ lastCheckIn: -1 }).limit(20);
    return res.json(entries);
  } catch (err) {
    console.error('Load check-ins failed', err);
    return res.status(500).json({ message: 'Failed to load check-ins.' });
  }
});

const start = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    app.listen(PORT, () => {
      console.log(`Attendance API ready on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Unable to connect to MongoDB', err);
    process.exit(1);
  }
};

start();
