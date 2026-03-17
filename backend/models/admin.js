const mongoose = require("mongoose"); 
const AdminSchema = new mongoose.Schema({
  employee_name: { type: String, required: true },
  employee_id: { type: String, required: true },
  email: { type: String, required: true },
  department: { type: String }
});

// Create unique compound index on email and department to prevent duplicates
AdminSchema.index({ email: 1, department: 1 }, { unique: true, sparse: true });
// Create unique index on employee_id and department
AdminSchema.index({ employee_id: 1, department: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("Admin", AdminSchema);