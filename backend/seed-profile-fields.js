const mongoose = require('mongoose');
const ProfileFieldConfig = require('./models/ProfileFieldConfig');
require('dotenv').config();

const profileFields = [
  { fieldName: 'personalInfo', displayName: 'Personal Information', enabled: true },
  { fieldName: 'contactInfo', displayName: 'Contact Information', enabled: true },
  { fieldName: 'academicInfo', displayName: 'Academic Information', enabled: true },
  { fieldName: 'familyInfo', displayName: 'Family Information', enabled: true },
  { fieldName: 'addressInfo', displayName: 'Address Information', enabled: true },
  { fieldName: 'additionalInfo', displayName: 'Additional Information', enabled: true }
];

async function seedProfileFields() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    for (const field of profileFields) {
      const existingField = await ProfileFieldConfig.findOne({ fieldName: field.fieldName });
      if (!existingField) {
        await ProfileFieldConfig.create(field);
        console.log(`Created profile field: ${field.displayName}`);
      } else {
        console.log(`Profile field already exists: ${field.displayName}`);
      }
    }

    console.log('Profile field seeding completed');

  } catch (error) {
    console.error('Error seeding profile fields:', error);
  } finally {
    process.exit(0);
  }
}

seedProfileFields();