const { execSync } = require('child_process');

console.log('\x1b[31m%s\x1b[0m', '⚠️  WARNING: RADICAL FIRESTORE WIPE ⚠️');
console.log('This will delete EVERY document and sub-collection in your database.');
console.log('Starting in 3 seconds...');

setTimeout(() => {
  try {
    console.log('📡 Executing recursive delete via Firebase CLI...');
    // The --all-collections flag targets everything. --force skips confirmation.
    execSync('firebase firestore:delete --all-collections --force', { stdio: 'inherit' });
    
    console.log('\n\x1b[32m%s\x1b[0m', '✅ SUCCESS: Firestore is now empty.');
    console.log('Next step: Go to your Firebase Console and delete all users in the Authentication tab.');
  } catch (error) {
    console.error('\n\x1b[31m%s\x1b[0m', '❌ FAILED: Could not wipe Firestore.');
    console.log('Reason: ' + error.message);
    console.log('\nMake sure:');
    console.log('1. You have the Firebase CLI installed (npm install -g firebase-tools)');
    console.log('2. You are logged in (firebase login)');
    console.log('3. You have the correct project selected (firebase use <project-id>)');
  }
}, 3000);
