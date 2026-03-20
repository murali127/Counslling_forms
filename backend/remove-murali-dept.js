const mongoose = require('mongoose');
const Department = require('./models/Department');
require('dotenv').config();

async function removeMuraliDepartment() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find and delete the Murali department
    const result = await Department.findOneAndDelete({ 
      name: { $regex: 'murali', $options: 'i' }
    });

    if (result) {
      console.log(`✅ Deleted department: ${result.name}`);
    } else {
      console.log('❌ Murali department not found');
    }

  } catch (error) {
    console.error('❌ Error deleting department:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

removeMuraliDepartment();
