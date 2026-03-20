const ProfileFieldConfig = require("../models/ProfileFieldConfig");

/**
 * Get all enabled profile fields
 * @param {String} departmentId - Optional department ID for department-specific config
 * @returns {Promise<Array>} Array of enabled field names
 */
async function getEnabledProfileFields(departmentId = null) {
  try {
    const query = { enabled: true };
    if (departmentId) {
      query.$or = [
        { department: null },
        { department: departmentId }
      ];
    } else {
      query.department = null;
    }

    const fields = await ProfileFieldConfig.find(query).select('fieldName');
    return fields.map(f => f.fieldName);
  } catch (err) {
    console.error("Error fetching enabled profile fields:", err);
    // Fallback to default fields if error
    return getDefaultProfileFields();
  }
}

/**
 * Get default profile fields (used as fallback and for initialization)
 * @returns {Array} Array of default field names
 */
function getDefaultProfileFields() {
  return [
    'name', 'regdNo', 'department', 'mobileNumber', 'email',
    'admissionType', 'caste', 'rank', 'dob', 'bloodGroup',
    'tenthMarksPercentage', 'interDiplomaMarksPercentage',
    'parentName', 'parentAddress', 'parentOccupation', 'parentContactNumber'
  ];
}

/**
 * Calculate profile completion based on enabled fields
 * @param {Object} profile - Profile document from database
 * @param {Array} enabledFields - Array of enabled field names
 * @returns {Number} Completion percentage (0-100)
 */
function calculateProfileCompletion(profile, enabledFields) {
  if (!profile || enabledFields.length === 0) {
    return 0;
  }

  const isFilled = (value) => {
    if (value === undefined || value === null) return false;
    if (typeof value === 'boolean') return value;
    if (Array.isArray(value)) return value.length > 0;
    return String(value).trim() !== '';
  };

  const fieldMappings = {
    'name': () => profile.name,
    'regdNo': () => profile.regdNo,
    'department': () => profile.department,
    'mobileNumber': () => profile.mobileNumber,
    'email': () => profile.email,
    'admissionType': () => profile.admissionType,
    'caste': () => profile.caste,
    'rank': () => profile.rank,
    'dob': () => profile.dob,
    'bloodGroup': () => profile.bloodGroup,
    'tenthMarksPercentage': () => profile.tenthMarks?.percentage,
    'interDiplomaMarksPercentage': () => profile.interDiplomaMarks?.percentage,
    'parentName': () => profile.parentDetails?.name,
    'parentAddress': () => profile.parentDetails?.address,
    'parentOccupation': () => profile.parentDetails?.occupation,
    'parentContactNumber': () => profile.parentDetails?.contactNumber,
    'localGuardianName': () => profile.localGuardian?.name,
    'localGuardianAddress': () => profile.localGuardian?.address,
    'localGuardianContactNumber': () => profile.localGuardian?.contactNumber,
    'hobbies': () => profile.hobbies,
    'participation': () => profile.participation && [
      ...(profile.participation.gamesAndActivities || []),
      ...(profile.participation.literary || []),
      ...(profile.participation.technical || [])
    ],
    'profilePicture': () => profile.profilePicture
  };

  const supportedEnabledFields = enabledFields.filter((field) => !!fieldMappings[field]);
  if (supportedEnabledFields.length === 0) {
    return 0;
  }

  let completed = 0;
  for (const field of supportedEnabledFields) {
    const getValue = fieldMappings[field];
    const value = getValue();
    if (isFilled(value)) {
      completed++;
    }
  }

  return Math.round((completed / supportedEnabledFields.length) * 100);
}

/**
 * Initialize default field configurations
 * @returns {Promise<void>}
 */
async function initializeDefaultFieldConfigs() {
  try {
    const existingCount = await ProfileFieldConfig.countDocuments({ department: null });
    if (existingCount > 0) {
      console.log("Field configurations already initialized");
      return;
    }

    const defaultFields = [
      { fieldName: 'name', fieldLabel: 'Name', description: 'Student name as per SSC Marks Memo' },
      { fieldName: 'regdNo', fieldLabel: 'Registration Number', description: 'Registration Number (Primary key)' },
      { fieldName: 'department', fieldLabel: 'Department', description: 'Department assigned to student' },
      { fieldName: 'mobileNumber', fieldLabel: 'Mobile Number', description: 'Student mobile number' },
      { fieldName: 'email', fieldLabel: 'Email', description: 'Student email address' },
      { fieldName: 'admissionType', fieldLabel: 'Admission Type', description: 'Convener, Management, or Category-B' },
      { fieldName: 'caste', fieldLabel: 'Caste', description: 'Student caste information' },
      { fieldName: 'rank', fieldLabel: 'Entrance Rank', description: 'EAMCET / ECET Rank' },
      { fieldName: 'dob', fieldLabel: 'Date of Birth', description: 'Date of Birth (dd/mmm/yyyy)' },
      { fieldName: 'bloodGroup', fieldLabel: 'Blood Group', description: 'Blood group information' },
      { fieldName: 'tenthMarksPercentage', fieldLabel: '10th Marks Percentage', description: '10th class marks percentage' },
      { fieldName: 'interDiplomaMarksPercentage', fieldLabel: 'Inter/Diploma Marks Percentage', description: 'Inter or Diploma marks percentage' },
      { fieldName: 'parentName', fieldLabel: 'Parent Name', description: 'Parent name as per SSC Memo' },
      { fieldName: 'parentAddress', fieldLabel: 'Parent Address', description: 'Home address' },
      { fieldName: 'parentOccupation', fieldLabel: 'Parent Occupation', description: 'Parent occupation' },
      { fieldName: 'parentContactNumber', fieldLabel: 'Parent Contact Number', description: 'Parent contact number' },
      { fieldName: 'localGuardianName', fieldLabel: 'Local Guardian Name', description: 'Local guardian name (if any)', enabled: false },
      { fieldName: 'localGuardianAddress', fieldLabel: 'Local Guardian Address', description: 'Local guardian address', enabled: false },
      { fieldName: 'localGuardianContactNumber', fieldLabel: 'Local Guardian Contact Number', description: 'Local guardian contact number', enabled: false },
      { fieldName: 'hobbies', fieldLabel: 'Hobbies', description: 'Student hobbies', enabled: false },
      { fieldName: 'participation', fieldLabel: 'Participation in Activities', description: 'Games, NCC/NSS, Literary, Technical activities', enabled: false },
      { fieldName: 'profilePicture', fieldLabel: 'Profile Picture', description: 'Student profile picture', enabled: false }
    ];

    await ProfileFieldConfig.insertMany(
      defaultFields.map(f => ({ ...f, department: null, enabled: f.enabled !== false }))
    );
    console.log("Default field configurations initialized successfully");
  } catch (err) {
    console.error("Error initializing field configurations:", err);
  }
}

module.exports = {
  getEnabledProfileFields,
  getDefaultProfileFields,
  calculateProfileCompletion,
  initializeDefaultFieldConfigs
};
