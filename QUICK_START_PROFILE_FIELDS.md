# Quick Start Guide: Profile Field Configuration

## What Was Changed?

Your principal dashboard now calculates profile completion percentage based on **enabled fields only**, instead of a hardcoded set of fields.

## What Do I Need to Do?

### Step 1: Restart Your Backend Server
```bash
cd backend
npm start
```

The seed script has already initialized all field configurations. You don't need to run it again.

### Step 2: Verify It's Working

Check the admin user management or principal dashboard - profile completion percentages should now be calculated based on the enabled fields.

## API Commands Reference

### View All Field Configurations
```bash
curl http://localhost:5000/api/profile-fields
```

### View Only Enabled Fields
```bash
curl http://localhost:5000/api/profile-fields/enabled
```

### Disable a Field (Exclude from Completion Calculation)
Example - Disable "hobbies" field:
```bash
curl -X PUT http://localhost:5000/api/profile-fields/hobbies/disable \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

### Enable a Field (Include in Completion Calculation)
Example - Enable "hobbies" field:
```bash
curl -X PUT http://localhost:5000/api/profile-fields/hobbies/enable \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

## Currently Enabled Fields (Count Toward Completion)

By default, these 16 fields count toward profile completion:
1. name
2. regdNo (Registration Number)
3. section
4. mobileNumber
5. email
6. admissionType
7. caste
8. rank
9. dob (Date of Birth)
10. bloodGroup
11. tenthMarksPercentage
12. interDiplomaMarksPercentage
13. parentName
14. parentAddress
15. parentOccupation
16. parentContactNumber

## Currently Disabled Fields (Don't Count Toward Completion)

These can be enabled if needed:
1. localGuardianName
2. localGuardianAddress
3. localGuardianContactNumber
4. hobbies
5. participation
6. profilePicture

## Example Completion Calculation

**Scenario:**
- Student has filled: name, email, regdNo, section (4 fields)
- All 16 default fields are enabled
- **Completion % = (4 / 16) × 100 = 25%**

**If you disable "hobbies" and "participation":**
- Only 14 fields count now (16 - 2 disabled)
- Same student with 4 filled fields
- **New Completion % = (4 / 14) × 100 = 29%**

## Where This Affects Your App

The profile completion percentage is shown in:
- ✓ Student Dashboard (Profile Score)
- ✓ Admin User Management table
- ✓ Admin reports and data overview
- ✓ Principal Dashboard (student profiles)

All these now automatically use the field configuration system!

## Files Created/Modified

### New Files:
- `/backend/models/ProfileFieldConfig.js` - Field configuration database model
- `/backend/utils/profileFieldUtils.js` - Utility functions for field management
- `/backend/routes/profileFields.js` - API endpoints for managing fields
- `/backend/seed-profile-fields.js` - Script to initialize default configurations
- `PROFILE_FIELD_CONFIG_SETUP.md` - Detailed technical documentation

### Modified Files:
- `/backend/routes/auth.js` - Updated to use field configuration
- `/backend/routes/admin.js` - Updated to use field configuration
- `/backend/server.js` - Added profile-fields route

## Still Have Questions?

See `PROFILE_FIELD_CONFIG_SETUP.md` for detailed technical documentation and troubleshooting.
