const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  month: { type: String, required: false },
  percentage: { type: Number, default: 0 } // Attendance stored as percentage
});

const semesterSchema = new mongoose.Schema({
  semester: { type: String, required: false },
  attendance: [attendanceSchema]
});

const profileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true }, // Foreign key
    regdNo: { type: String, required: false, unique: true, sparse: true }, // Registration Number (Primary key)
    uniqueId: { type: String, required: false, unique: true, sparse: true }, // Unique ID generated from email
    department: { type: String, required: false }, // Department (renamed from section)
    mobileNumber: { type: String, required: false }, // Mobile Number
    name: { type: String, required: false }, // Name as per SSC Marks Memo
    email: { type: String, required: false, unique: true, sparse: true }, // Email
    admissionType: { type: String, enum: ["Convener", "Management","Category-B"], required: false }, // Convener or Management admission
    caste: { type: String, required: false }, // Caste
    rank: { type: String, required: false }, // EAMCET / ECET Rank
    dob: { type: String, required: false }, // Date of Birth (dd/mmm/yyyy)
    bloodGroup: { type: String, required: false }, // Blood Group
    tenthMarks: {
      obtained: { type: Number, required: false },
      max: { type: Number, required: false },
      percentage: { type: Number, required: false }
    }, // 10th Marks (marks/max marks & percentage)
    interDiplomaMarks: {
      obtained: { type: Number, required: false },
      max: { type: Number, required: false },
      percentage: { type: Number, required: false }
    }, // Inter/Diploma Marks (marks/max marks & percentage)
    parentDetails: {
      name: { type: String, required: false }, // Parent name as per SSC Memo
      address: { type: String, required: false }, // Home address
      occupation: { type: String, required: false }, // Occupation
      contactNumber: { type: String, required: false }, // Parent contact number
      email: { type: String } // Parent email (optional)
    },
    localGuardian: {
      name: { type: String }, // Local guardian name (if any)
      address: { type: String }, // Local guardian address
      contactNumber: { type: String } // Local guardian contact number
    },
    hobbies: { type: [String] }, // Hobbies
    participation: {
      gamesAndActivities: { type: [String] }, // Participation in Games, NCC/NSS
      literary: { type: [String] }, // Literary Activities
      technical: { type: [String] } // Technical Activities
    },
    profilePicture: { type: String, default: null }, // Profile Picture (default: null)
    isDeleted: { type: Boolean, default: false },
    attendance: [
      {
        semester: { type: String, required: false },
        months: {
          type: Map,
          of: {
            percentage: { type: Number, default: 0 } // Attendance stored as percentage
          }
        }
      }
    ]
  },
  { timestamps: true }
);

profileSchema.index({ department: 1 });
profileSchema.index({ createdAt: 1 });
profileSchema.index({ isDeleted: 1 });

// Middleware to restrict attendance modification to admin users
profileSchema.pre("save", function (next) {
  if (this.isModified("attendance") && !this.adminOverride) {
    const err = new Error("Only admins can modify attendance.");
    return next(err);
  }
  next();
});

const Profile = mongoose.model("Profile", profileSchema);

module.exports = Profile;