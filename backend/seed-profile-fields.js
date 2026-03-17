// This script initializes default profile field configurations
// Run with: node seed-profile-fields.js

const dotenv = require('dotenv');
dotenv.config();

const connectDB = require('./config/db');
const { initializeDefaultFieldConfigs } = require('./utils/profileFieldUtils');

const initializeFields = async () => {
  try {
    console.log('Connecting to database...');
    await connectDB();
    
    console.log('Initializing default profile field configurations...');
    await initializeDefaultFieldConfigs();
    
    console.log('✓ Profile field configurations initialized successfully');
    console.log('\nDefault enabled fields for profile completion:');
    console.log('- name');
    console.log('- regdNo');
    console.log('- section');
    console.log('- mobileNumber');
    console.log('- email');
    console.log('- admissionType');
    console.log('- caste');
    console.log('- rank');
    console.log('- dob');
    console.log('- bloodGroup');
    console.log('- tenthMarksPercentage');
    console.log('- interDiplomaMarksPercentage');
    console.log('- parentName');
    console.log('- parentAddress');
    console.log('- parentOccupation');
    console.log('- parentContactNumber');
    console.log('\nDisabled fields (can be enabled via API):');
    console.log('- localGuardianName');
    console.log('- localGuardianAddress');
    console.log('- localGuardianContactNumber');
    console.log('- hobbies');
    console.log('- participation');
    console.log('- profilePicture');
    
    process.exit(0);
  } catch (error) {
    console.error('Error initializing field configurations:', error);
    process.exit(1);
  }
};

initializeFields();
