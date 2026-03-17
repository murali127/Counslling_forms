const mongoose = require("mongoose");

const ProfileFieldConfigSchema = new mongoose.Schema(
  {
    fieldName: { type: String, required: true, unique: true }, // e.g., 'name', 'email', 'regdNo'
    enabled: { type: Boolean, default: true }, // Whether this field should be counted for completion
    required: { type: Boolean, default: false }, // Whether this field is mandatory
    fieldLabel: { type: String }, // Display name for the field
    description: { type: String }, // Field description
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department", default: null }, // null = institution-wide, specific ID = department-specific
  },
  { timestamps: true }
);

ProfileFieldConfigSchema.index({ fieldName: 1, department: 1 }, { unique: true });
ProfileFieldConfigSchema.index({ enabled: 1 });
ProfileFieldConfigSchema.index({ department: 1 });

module.exports = mongoose.model("ProfileFieldConfig", ProfileFieldConfigSchema);
