# Profile Field Configuration System

## Overview
The profile field configuration system allows admins and superadmins to manage which profile fields are enabled/disabled and control profile completion percentage calculation based on enabled fields only.

## What Changed

### 1. **New Models**
- `ProfileFieldConfig` - Stores configuration for each profile field (enabled/disabled status)
- Location: `/backend/models/ProfileFieldConfig.js`

### 2. **New Utilities**
- `profileFieldUtils.js` - Helper functions for field management and profile completion calculation
- Location: `/backend/utils/profileFieldUtils.js`
- Key functions:
  - `getEnabledProfileFields()` - Retrieves list of enabled fields
  - `calculateProfileCompletion()` - Calculates completion % based on enabled fields only
  - `initializeDefaultFieldConfigs()` - Sets up default field configurations

### 3. **Updated Routes**
- `/backend/routes/auth.js` - Now uses field configuration for completion calculation
- `/backend/routes/admin.js` - Updated to fetch enabled fields when retrieving user profiles
- New route: `/backend/routes/profileFields.js` - API endpoints for managing field configurations

### 4. **New API Endpoints**

#### Get all field configurations
```
GET /api/profile-fields
```
Returns all field configurations with their enabled/disabled status.

#### Get only enabled fields
```
GET /api/profile-fields/enabled
```
Returns only the fields that are currently enabled.

#### Enable a specific field
```
PUT /api/profile-fields/:fieldName/enable
Headers: Authorization: Bearer {token}
Requires: Admin or Superadmin role
```
Example:
```bash
curl -X PUT http://localhost:5000/api/profile-fields/hobbies/enable \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

#### Disable a specific field
```
PUT /api/profile-fields/:fieldName/disable
Headers: Authorization: Bearer {token}
Requires: Admin or Superadmin role
```
Example:
```bash
curl -X PUT http://localhost:5000/api/profile-fields/hobbies/disable \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

#### Update field configuration
```
PUT /api/profile-fields/:fieldName
Headers: Authorization: Bearer {token}
Requires: Admin or Superadmin role
Body: { enabled: boolean, required: boolean, fieldLabel: string, description: string }
```

#### Initialize default configurations
```
POST /api/profile-fields/initialize
Headers: Authorization: Bearer {token}
Requires: Superadmin role
```

## Setup Instructions

### 1. Initialize Field Configurations
Run the seed script to create default field configurations:

```bash
cd backend
node seed-profile-fields.js
```

This will create 22 profile fields with the following as enabled by default:
- name
- regdNo
- section
- mobileNumber
- email
- admissionType
- caste
- rank
- dob
- bloodGroup
- tenthMarksPercentage (10th class marks %)
- interDiplomaMarksPercentage (Inter/Diploma marks %)
- parentName
- parentAddress
- parentOccupation
- parentContactNumber

And the following as disabled by default (can be enabled):
- localGuardianName
- localGuardianAddress
- localGuardianContactNumber
- hobbies
- participation
- profilePicture

### 2. Verify Setup
```bash
curl http://localhost:5000/api/profile-fields
```

You should see all 22 fields with their configuration.

## How Profile Completion % is Calculated

### Before (Hardcoded Fields)
- Always calculated based on 16 hardcoded fields
- Could not be customized
- Same fields counted for all institutions

### After (Field Configuration Based)
- Only **enabled fields** are counted in the denominator
- If you have 16 enabled fields and student completes 8:
  - Completion % = (8 / 16) * 100 = 50%
- If you disable 4 fields and only 12 are enabled:
  - Same student with 8 completed fields = (8 / 12) * 100 = 67%

## Example: Managing Profile Fields

### Scenario: Disable "Hobbies" field for profile completion calculation

**Option 1: Using API directly**
```bash
curl -X PUT http://localhost:5000/api/profile-fields/hobbies/disable \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "message": "Field disabled successfully",
  "field": {
    "_id": "...",
    "fieldName": "hobbies",
    "enabled": false,
    "fieldLabel": "Hobbies",
    "description": "Student hobbies"
  }
}
```

### Scenario: Enable "Participation" field

```bash
curl -X PUT http://localhost:5000/api/profile-fields/participation/enable \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

## Impact on Dashboard

When you view the **Principal Dashboard** or **Admin User Management**:
- The profile completion % will now reflect only enabled fields
- Students won't be penalized for empty optional (disabled) fields
- You can customize which fields are required for your institution

## For Frontend Development

The completion percentage shown in:
- `/dashboard` (student profile score)
- `/admin/users` (Admin User Management table)
- Components displaying student profiles

All will automatically use the new field configuration system. No frontend changes needed!

## Technical Details

### Database Schema - ProfileFieldConfig
```javascript
{
  fieldName: String (unique),
  enabled: Boolean (default: true),
  required: Boolean (default: false),
  fieldLabel: String,
  description: String,
  department: ObjectId (null = institution-wide),
  createdAt: Date,
  updatedAt: Date
}
```

### Key Functions

#### `getEnabledProfileFields(departmentId)`
Returns array of field names that are enabled.

```javascript
const enabledFields = await getEnabledProfileFields(user.departmentId);
// Returns: ['name', 'regdNo', 'email', ...]
```

#### `calculateProfileCompletion(profile, enabledFields)`
Calculates completion percentage based on enabled fields.

```javascript
const completion = calculateProfileCompletion(profileDoc, ['name', 'email', 'regdNo']);
// Returns: 67 (if 2 out of 3 fields are filled)
```

## Future Enhancements

1. **Department-specific field configurations** - Different departments can have different required fields
2. **Admin UI** - Create a dashboard for managing field configurations
3. **Field dependencies** - Some fields required only if others are filled
4. **Field validation rules** - Custom validators per field
5. **Audit logging** - Track who enabled/disabled which fields and when

## Troubleshooting

### Profile completion shows 0% after setup
- Run `node seed-profile-fields.js` to initialize configurations
- Check if fields are enabled: `GET /api/profile-fields/enabled`

### Changes to field configuration not reflecting
- Field configurations are cached in memory - restart server if using caching
- Check that the field name matches exactly (case-sensitive)
- Verify user's departmentId matches the field configuration

### API returns 403 Forbidden
- Ensure you're logged in as Admin or Superadmin for PUT/POST operations
- Check your authorization header: `Authorization: Bearer YOUR_TOKEN`

## Notes

- Default field configurations are institution-wide (department = null)
- Future versions can support department-specific configurations
- All calculations respect the enabled/disabled status only
- Required field status is stored but not yet used in validation - reserved for future UI implementation
