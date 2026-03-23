const mongoose = require("mongoose");

// Lead Schema
const leadSchema = new mongoose.Schema({
  text:        { type: String, required: true },
  link:        { type: String, default: "" },
  score:       { type: Number, default: 0 },
  message:     { type: String, default: "" },
  source:      { type: String, default: "manual" },
  description: { type: String, default: "" },
  salary:      { type: String, default: "" },
  email:       { type: String, default: "" },
  status:      { type: String, default: "new" },
  favorite:   { type: Boolean, default: false },
  assigned_to: { type: String, default: "" },
  postedAt:    { type: String, default: "" },
  expiresAt:   { type: String, default: "" },
  created_at:  { type: Date, default: Date.now },
  updated_at:  { type: Date, default: Date.now },
});

// User Schema for authentication
const userSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  created_at: { type: Date, default: Date.now },
});

// Indexes for fast queries
leadSchema.index({ score: -1 });
leadSchema.index({ source: 1 });
leadSchema.index({ status: 1 });
leadSchema.index({ favorite: 1 });
leadSchema.index({ link: 1 }, { unique: true, sparse: true });
leadSchema.index({ created_at: 1 });

// Connect to MongoDB
async function connectDB() {
  const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/leadsystem";
  try {
    await mongoose.connect(mongoUri);
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  }
}

// Auto-delete leads older than 12 hours (except favorites)
async function cleanupOldLeads() {
  try {
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
    const result = await Lead.deleteMany({
      favorite: false,
      created_at: { $lt: twelveHoursAgo }
    });
    if (result.deletedCount > 0) {
      console.log(`🗑 Auto-deleted ${result.deletedCount} old non-favorite leads`);
    }
  } catch (err) {
    console.error("❌ Cleanup error:", err.message);
  }
}

// Start cleanup interval (run every hour)
let cleanupInterval = null;
function startCleanupInterval() {
  // Run immediately on startup
  cleanupOldLeads();
  // Then run every hour
  cleanupInterval = setInterval(cleanupOldLeads, 60 * 60 * 1000);
}

function stopCleanupInterval() {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
  }
}

const Lead = mongoose.model("Lead", leadSchema);
const User = mongoose.model("User", userSchema);

module.exports = { 
  connectDB, 
  Lead, 
  User, 
  startCleanupInterval,
  stopCleanupInterval 
};
