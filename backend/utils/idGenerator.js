const crypto = require('crypto');

/**
 * Generate a unique ID based on email
 * @param {String} email - Email address
 * @returns {String} - Unique ID based on email
 */
function generateUniqueIdFromEmail(email) {
  if (!email) return null;
  
  // Create a hash of the email
  const hash = crypto.createHash('sha256').update(email.toLowerCase()).digest('hex').substring(0, 12);
  
  // Extract username part (before @)
  const emailPrefix = email.split('@')[0].substring(0, 8);
  
  // Combine for unique ID
  return `${emailPrefix}-${hash}`;
}

/**
 * Generate an alternative unique ID based on email (simple format)
 * @param {String} email - Email address
 * @returns {String} - Unique ID
 */
function generateSimpleIdFromEmail(email) {
  if (!email) return null;
  
  // Create a hash of the email
  const hash = crypto.createHash('md5').update(email.toLowerCase()).digest('hex').substring(0, 8);
  return hash;
}

module.exports = {
  generateUniqueIdFromEmail,
  generateSimpleIdFromEmail
};
