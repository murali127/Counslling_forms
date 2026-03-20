const mongoose = require('mongoose');

const SystemSettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: 'global'
    },
    studentProfileWindow: {
      enabled: { type: Boolean, default: false },
      startAt: { type: Date, default: null },
      endAt: { type: Date, default: null },
      updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('SystemSettings', SystemSettingsSchema);
