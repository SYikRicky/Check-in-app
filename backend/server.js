const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/student';
const MONGO_DB = process.env.MONGO_DB || 'student';

// Permissive CORS for development; tighten for production as needed.
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type']
  })
);
app.options('*', cors());
app.use(express.json());

const candidateSchema = new mongoose.Schema(
  {
    timestamp: { type: Date },
    candidateName: { type: String, trim: true },
    fee: { type: Number, default: 0 },
    gender: { type: String, trim: true },
    identity: { type: String, trim: true },
    school: { type: String, trim: true },
    timeslot: { type: String, trim: true },
    phoneNumber: { type: String, trim: true },
    barcode: { type: String, unique: true, trim: true },
    lastCheckIn: { type: Date },
    checkInCount: { type: Number, default: 0 },
    checkIns: [
      {
        paperId: { type: String, trim: true },
        title: { type: String, trim: true },
        at: { type: Date }
      }
    ]
  },
  { timestamps: true, strict: false } // allow existing Atlas docs with mixed field names
);

// Explicitly bind to Atlas collection "Mock Info" within DB "student".
const Candidate = mongoose.model('Candidate', candidateSchema, 'Mock Info');

app.get('/health', (_req, res) => res.json({ ok: true }));

app.post('/api/check-ins', async (req, res) => {
  const { barcode, paperId, paperTitle } = req.body || {};
  if (!barcode) {
    return res.status(400).json({ message: 'Barcode is required.' });
  }

  const trimmed = barcode.trim();
  const now = new Date();

  try {
    const query = {
      $or: [
        { barcode: trimmed },
        { Barcode: trimmed },
        { phoneNumber: trimmed },
        { '電話號碼 Phone Number': trimmed }
      ]
    };
    const candidate = await Candidate.findOne(query);

    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found for this barcode.' });
    }

    candidate.candidateName =
      candidate.candidateName || candidate['考生姓名 Name of Candidate'] || candidate.name || '';
    candidate.phoneNumber =
      candidate.phoneNumber || candidate['電話號碼 Phone Number'] || candidate.Barcode || candidate.barcode || '';
    candidate.barcode = candidate.barcode || candidate.Barcode || candidate['電話號碼 Phone Number'] || '';

    candidate.lastCheckIn = now;
    candidate.checkInCount = (candidate.checkInCount || 0) + 1;
    candidate.checkIns = candidate.checkIns || [];

    if (paperId) {
      const existing = candidate.checkIns.find((c) => c.paperId === paperId);
      if (existing) {
        existing.at = now;
        existing.title = existing.title || paperTitle || '';
      } else {
        candidate.checkIns.push({ paperId, title: paperTitle || '', at: now });
      }
    }

    await candidate.save();
    return res.json({ attendee: candidate });
  } catch (err) {
    console.error('Check-in failed', err);
    return res.status(500).json({ message: 'Failed to check in. Please retry.' });
  }
});

app.get('/api/check-ins', async (_req, res) => {
  try {
    const entries = await Candidate.find().sort({ lastCheckIn: -1 }).limit(200);
    return res.json(
      entries.map((c) => ({
        _id: c._id,
        barcode: c.barcode || c.Barcode || c['電話號碼 Phone Number'] || c.phoneNumber,
        name: c.candidateName || c['考生姓名 Name of Candidate'] || '',
        phoneNumber: c.phoneNumber || c['電話號碼 Phone Number'] || c.barcode || c.Barcode,
        timeslot: c.timeslot || c['考試日期 Timeslot'] || '',
        lastCheckIn: c.lastCheckIn,
        checkInCount: c.checkInCount,
        checkedPapers: (c.checkIns || []).reduce((acc, entry) => {
          if (entry.paperId) acc[entry.paperId] = entry.at;
          return acc;
        }, {})
      }))
    );
  } catch (err) {
    console.error('Load check-ins failed', err);
    return res.status(500).json({ message: 'Failed to load check-ins.' });
  }
});

const start = async () => {
  try {
    await mongoose.connect(MONGO_URI, { dbName: MONGO_DB });
    app.listen(PORT, () => {
      console.log(`Attendance API ready on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Unable to connect to MongoDB', err);
    process.exit(1);
  }
};

start();
