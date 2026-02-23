const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

console.log('Testing MongoDB Connection...');
console.log('URI:', process.env.MONGODB_URI ? process.env.MONGODB_URI.substring(0, 20) + '...' : 'UNDEFINED');

mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 5000 // 5 seconds timeout
})
.then(() => {
  console.log('✅ Connected successfully!');
  console.log('Databases on this cluster:');
  return mongoose.connection.db.admin().listDatabases();
})
.then(dbs => {
  console.log(dbs.databases);
  process.exit(0);
})
.catch(err => {
  console.error('❌ Connection Failed:', err.message);
  console.log('Reason:', err.reason);
  process.exit(1);
});
