// MongoDB Initialization Script
// This runs when the MongoDB container is first created

// Switch to the lifebydorm database
db = db.getSiblingDB('lifebydorm');

// Create application user with read/write access
db.createUser({
  user: 'lifebydorm_app',
  pwd: 'lifebydorm_password',
  roles: [
    {
      role: 'readWrite',
      db: 'lifebydorm'
    }
  ]
});

// Create indexes for better performance
db.users.createIndex({ email: 1 }, { unique: true });
db.universities.createIndex({ name: 1 });
db.dorms.createIndex({ universityId: 1 });
db.userreviews.createIndex({ dormId: 1 });
db.userreviews.createIndex({ userId: 1 });

print('✅ MongoDB initialization complete');
