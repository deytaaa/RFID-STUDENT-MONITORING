const { User } = require("../models");

const studentController = {
  // GET ALL STUDENTS (with pagination, search, filter, sort)
  async getAllStudents(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      // Build search query
      let query = {};

      // Search functionality
      if (req.query.search) {
        const searchRegex = new RegExp(req.query.search, "i");
        query.$or = [
          { name: searchRegex },
          { email: searchRegex },
          { studentId: searchRegex },
          { course: searchRegex },
        ];
      }

      // Filter by course
      if (req.query.course) {
        query.course = req.query.course;
      }

      // Filter by year level
      if (req.query.yearLevel) {
        query.yearLevel = req.query.yearLevel;
      }

      // Filter by active status
      if (req.query.isActive !== undefined) {
        query.isActive = req.query.isActive === "true";
      }

      // Filter by access level
      if (req.query.accessLevel) {
        query.accessLevel = req.query.accessLevel;
      }

      // Build sort options
      let sortOptions = {};
      if (req.query.sortBy) {
        const sortOrder = req.query.sortOrder === "desc" ? -1 : 1;
        sortOptions[req.query.sortBy] = sortOrder;
      } else {
        sortOptions.createdAt = -1; // Default: newest first
      }

      const students = await User.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .select("-__v"); // Exclude version key

      const total = await User.countDocuments(query);

      res.status(200).json({
        success: true,
        total,
        page,
        pages: Math.ceil(total / limit),
        data: students,
        filters: {
          search: req.query.search || "",
          course: req.query.course || "",
          yearLevel: req.query.yearLevel || "",
          isActive: req.query.isActive || "",
          accessLevel: req.query.accessLevel || "",
        },
      });
    } catch (error) {
      console.error("Error fetching students:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch students",
        error: error.message,
      });
    }
  },

  // GET STUDENT BY ID
  async getStudentById(req, res) {
    try {
      const { id } = req.params;
      const student = await User.findById(id);

      if (!student) {
        return res.status(404).json({
          success: false,
          message: "Student not found",
        });
      }

      res.status(200).json({ success: true, data: student });
    } catch (error) {
      console.error("Error fetching student by ID:", error);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  },

  // GET STUDENT BY RFID TAG
  async getStudentByRfid(req, res) {
    try {
      const { tag } = req.params;
      const student = await User.findOne({ rfIdTag: tag });

      if (!student) {
        return res.status(404).json({
          success: false,
          message: "Student not found with this RFID tag",
        });
      }

      res.status(200).json({ success: true, data: student });
    } catch (error) {
      console.error("Error fetching student by RFID:", error);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  },

  // CREATE NEW STUDENT
  async createStudent(req, res) {
    try {
      const {
        name,
        email,
        studentId,
        course,
        yearLevel,
        rfIdTag,
        accessLevel = "student",
        isActive = true,
      } = req.body;

      // Validate required fields
      if (!name || !email || !studentId) {
        return res.status(400).json({
          success: false,
          message: "Name, email, and student ID are required",
        });
      }

      // Check if student already exists
      const existingStudent = await User.findOne({
        $or: [{ email }, { studentId }, { rfIdTag: rfIdTag }],
      });

      if (existingStudent) {
        return res.status(400).json({
          success: false,
          message:
            "Student with this email, student ID, or RFID tag already exists",
        });
      }

      // Create new student
      const newStudent = new User({
        name,
        email,
        studentId,
        course,
        yearLevel,
        rfIdTag,
        accessLevel,
        isActive,
      });

      await newStudent.save();

      res.status(201).json({
        success: true,
        message: "Student created successfully",
        data: newStudent,
      });
    } catch (error) {
      console.error("Error creating student:", error);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  },

  // UPDATE STUDENT
  async updateStudent(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Remove immutable fields
      delete updates._id;
      delete updates.createdAt;

      const student = await User.findByIdAndUpdate(id, updates, {
        new: true,
        runValidators: true,
      });

      if (!student) {
        return res.status(404).json({
          success: false,
          message: "Student not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Student updated successfully",
        data: student,
      });
    } catch (error) {
      console.error("Error updating student:", error);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  },

  // DELETE STUDENT (soft delete by setting isActive = false)
  async deleteStudent(req, res) {
    try {
      const { id } = req.params;

      const student = await User.findByIdAndUpdate(
        id,
        { isActive: false },
        { new: true }
      );

      if (!student) {
        return res.status(404).json({
          success: false,
          message: "Student not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Student deactivated successfully",
        data: student,
      });
    } catch (error) {
      console.error("Error deleting student:", error);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  },

  // ACTIVATE/DEACTIVATE STUDENT
  async toggleStudentStatus(req, res) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      const student = await User.findByIdAndUpdate(
        id,
        { isActive },
        { new: true }
      );

      if (!student) {
        return res.status(404).json({
          success: false,
          message: "Student not found",
        });
      }

      res.status(200).json({
        success: true,
        message: `Student ${
          isActive ? "activated" : "deactivated"
        } successfully`,
        data: student,
      });
    } catch (error) {
      console.error("Error toggling student status:", error);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  },

  // BULK CREATE STUDENTS
  async bulkCreateStudents(req, res) {
    try {
      const { students } = req.body;

      if (!Array.isArray(students) || students.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Students array is required and cannot be empty",
        });
      }

      // Validate each student
      const validationErrors = [];
      const validStudents = [];

      for (let i = 0; i < students.length; i++) {
        const student = students[i];
        const errors = [];

        if (!student.name) errors.push(`Row ${i + 1}: Name is required`);
        if (!student.email) errors.push(`Row ${i + 1}: Email is required`);
        if (!student.studentId)
          errors.push(`Row ${i + 1}: Student ID is required`);
        if (!student.course) errors.push(`Row ${i + 1}: Course is required`);
        if (!student.yearLevel)
          errors.push(`Row ${i + 1}: Year Level is required`);

        if (errors.length > 0) {
          validationErrors.push(...errors);
        } else {
          validStudents.push({
            ...student,
            accessLevel: "student",
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      }

      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Validation errors found",
          errors: validationErrors,
        });
      }

      // Insert valid students
      const createdStudents = await User.insertMany(validStudents, {
        ordered: false,
      });

      // Broadcast student creation via WebSocket
      const io = req.app.get("io");
      io.emit("message", {
        type: "STUDENTS_BULK_CREATED",
        payload: {
          count: createdStudents.length,
          students: createdStudents,
        },
      });

      res.status(201).json({
        success: true,
        message: `Successfully created ${createdStudents.length} students`,
        data: createdStudents,
      });
    } catch (error) {
      console.error("Error bulk creating students:", error);

      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: "Duplicate entry found",
          error: "Student ID or Email already exists",
        });
      }

      res.status(500).json({
        success: false,
        message: "Failed to create students",
        error: error.message,
      });
    }
  },

  // BULK UPDATE STUDENTS
  async bulkUpdateStudents(req, res) {
    try {
      const { studentIds, updateData } = req.body;

      if (!Array.isArray(studentIds) || studentIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Student IDs array is required",
        });
      }

      const result = await User.updateMany(
        { _id: { $in: studentIds } },
        {
          ...updateData,
          updatedAt: new Date(),
        }
      );

      // Broadcast bulk update via WebSocket
      const io = req.app.get("io");
      io.emit("message", {
        type: "STUDENTS_BULK_UPDATED",
        payload: {
          count: result.modifiedCount,
          studentIds: studentIds,
        },
      });

      res.status(200).json({
        success: true,
        message: `Successfully updated ${result.modifiedCount} students`,
        data: {
          matchedCount: result.matchedCount,
          modifiedCount: result.modifiedCount,
        },
      });
    } catch (error) {
      console.error("Error bulk updating students:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update students",
        error: error.message,
      });
    }
  },

  // BULK DELETE STUDENTS (soft delete)
  async bulkDeleteStudents(req, res) {
    try {
      const { studentIds } = req.body;

      if (!Array.isArray(studentIds) || studentIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Student IDs array is required",
        });
      }

      const result = await User.updateMany(
        { _id: { $in: studentIds } },
        {
          isActive: false,
          updatedAt: new Date(),
        }
      );

      // Broadcast bulk delete via WebSocket
      const io = req.app.get("io");
      io.emit("message", {
        type: "STUDENTS_BULK_DELETED",
        payload: {
          count: result.modifiedCount,
          studentIds: studentIds,
        },
      });

      res.status(200).json({
        success: true,
        message: `Successfully deactivated ${result.modifiedCount} students`,
        data: {
          matchedCount: result.matchedCount,
          modifiedCount: result.modifiedCount,
        },
      });
    } catch (error) {
      console.error("Error bulk deleting students:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete students",
        error: error.message,
      });
    }
  },

  // GET STUDENT STATISTICS
  async getStudentStats(req, res) {
    try {
      const stats = await User.aggregate([
        { $match: { accessLevel: "student" } },
        {
          $group: {
            _id: null,
            totalStudents: { $sum: 1 },
            activeStudents: {
              $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] },
            },
            inactiveStudents: {
              $sum: { $cond: [{ $eq: ["$isActive", false] }, 1, 0] },
            },
          },
        },
      ]);

      const courseStats = await User.aggregate([
        { $match: { isActive: true, accessLevel: "student" } },
        { $group: { _id: "$course", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]);

      const yearLevelStats = await User.aggregate([
        { $match: { isActive: true, accessLevel: "student" } },
        { $group: { _id: "$yearLevel", count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]);

      res.status(200).json({
        success: true,
        data: {
          overview: stats[0] || {
            totalStudents: 0,
            activeStudents: 0,
            inactiveStudents: 0,
          },
          byCourse: courseStats,
          byYearLevel: yearLevelStats,
        },
      });
    } catch (error) {
      console.error("Error getting student statistics:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get student statistics",
        error: error.message,
      });
    }
  },

  // EXPORT STUDENTS DATA
  async exportStudents(req, res) {
    try {
      const format = req.query.format || "json";

      // Build query based on filters
      let query = {};
      if (req.query.course) query.course = req.query.course;
      if (req.query.yearLevel) query.yearLevel = req.query.yearLevel;
      if (req.query.isActive !== undefined)
        query.isActive = req.query.isActive === "true";

      const students = await User.find(query)
        .select("-__v -createdAt -updatedAt")
        .sort({ name: 1 });

      if (format === "csv") {
        // Convert to CSV format
        const csvHeader =
          "Name,Email,Student ID,Course,Year Level,RFID Tag,Access Level,Active\n";
        const csvData = students
          .map(
            (student) =>
              `"${student.name}","${student.email}","${student.studentId}","${
                student.course
              }","${student.yearLevel}","${student.rfIdTag || ""}","${
                student.accessLevel
              }","${student.isActive}"`
          )
          .join("\n");

        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
          "Content-Disposition",
          'attachment; filename="students.csv"'
        );
        res.status(200).send(csvHeader + csvData);
      } else {
        // JSON format
        res.status(200).json({
          success: true,
          data: students,
          count: students.length,
          exportedAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("Error exporting students:", error);
      res.status(500).json({
        success: false,
        message: "Failed to export students",
        error: error.message,
      });
    }
  },
};

module.exports = studentController;
