/**
 * Frontend role display labels.
 * Backend role keys (stored in JWT / localStorage) are unchanged.
 * Only the UI display text is mapped here.
 */
export const ROLE_LABELS = {
  master:     'Master',
  principal:  'Principal',
  superadmin: 'HOD',
  admin:      'Faculty',
  mentor:     'Mentor',
  user:       'Student',
};

/** Returns the display label for a given backend role key. */
export const getRoleLabel = (role) => ROLE_LABELS[role] || role;
