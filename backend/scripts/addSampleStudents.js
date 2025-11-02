const mongoose = require('mongoose');
require('dotenv').config();

// User model (matching your existing structure)
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  rfIdTag: { type: String, required: true, unique: true },
  role: { type: String, enum: ['admin', 'user'], default: 'user' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  lastAccess: { type: Date }
});

const User = mongoose.model('User', userSchema);

// Sample students data
const sampleStudents = [
  {
    name: "John Doe",
    email: "john.doe@school.edu",
    rfIdTag: "D0D39925", // Your main physical card
    role: "user"
  },
  {
    name: "Alice Johnson",
    email: "alice.johnson@school.edu",
    rfIdTag: "A1B2C3D4",
    role: "user"
  },
  {
    name: "Bob Smith",
    email: "bob.smith@school.edu",
    rfIdTag: "E5F6G7H8",
    role: "user"
  },
  {
    name: "Carol Wilson",
    email: "carol.wilson@school.edu",
    rfIdTag: "12345678",
    role: "user"
  },
  {
    name: "David Brown",
    email: "david.brown@school.edu",
    rfIdTag: "87654321",
    role: "user"
  },
  {
    name: "Emma Davis",
    email: "emma.davis@school.edu",
    rfIdTag: "ABCDEF12",
    role: "user"
  },
  {
    name: "Frank Miller",
    email: "frank.miller@school.edu",
    rfIdTag: "FEDCBA98",
    role: "user"
  },
  {
    name: "Grace Taylor",
    email: "grace.taylor@school.edu",
    rfIdTag: "11223344",
    role: "user"
  },
  {
    name: "Henry Anderson",
    email: "henry.anderson@school.edu",
    rfIdTag: "44332211",
    role: "user"
  },
  {
    name: "Ivy Martinez",
    email: "ivy.martinez@school.edu",
    rfIdTag: "DEADBEEF",
    role: "user"
  },
  {
    name: "Jack Garcia",
    email: "jack.garcia@school.edu",
    rfIdTag: "CAFEBABE",
    role: "user"
  }
];

async function addSampleStudents() {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGO_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/rfid_gate_system';
    await mongoose.connect(mongoURI);
    console.log('🔗 Connected to MongoDB');

    // Clear existing students (optional - comment out if you want to keep existing)
    // await User.deleteMany({});
    // console.log('🗑️ Cleared existing students');

    // Add sample students
    for (const studentData of sampleStudents) {
      try {
        // Check if student already exists
        const existingStudent = await User.findOne({ 
          $or: [
            { email: studentData.email },
            { rfIdTag: studentData.rfIdTag }
          ]
        });

        if (existingStudent) {
          console.log(`⚠️ Student already exists: ${studentData.name} (${studentData.rfIdTag})`);
          
          // Update existing student
          await User.findByIdAndUpdate(existingStudent._id, studentData);
          console.log(`✅ Updated: ${studentData.name}`);
        } else {
          // Create new student
          const student = new User(studentData);
          await student.save();
          console.log(`✅ Added: ${studentData.name} - RFID: ${studentData.rfIdTag}`);
        }
      } catch (error) {
        console.error(`❌ Error adding ${studentData.name}:`, error.message);
      }
    }

    // Show final count
    const totalStudents = await User.countDocuments();
    console.log(`\n🎓 Total students in database: ${totalStudents}`);

    // Show all students
    console.log('\n📋 All Students:');
    const allStudents = await User.find({}).select('name email rfIdTag isActive');
    allStudents.forEach((student, index) => {
      console.log(`${index + 1}. ${student.name} - ${student.rfIdTag} - ${student.email} - ${student.isActive ? 'Active' : 'Inactive'}`);
    });

  } catch (error) {
    console.error('❌ Database error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the script
if (require.main === module) {
  addSampleStudents().then(() => {
    console.log('\n✅ Sample students script completed!');
    process.exit(0);
  }).catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
}

module.exports = { addSampleStudents };
