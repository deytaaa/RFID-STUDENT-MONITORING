const express = require("express");
const studentController = require("../controllers/StudentController.js"); 
const { authenticateJWT, requireSuperAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

// === ENHANCED ROUTES (must come before :id routes) ===

// GET /api/students/statistics/overview - Get student statistics
router.get("/statistics/overview", authenticateJWT, requireSuperAdmin, studentController.getStudentStats);

// GET /api/students/export/data - Export students data (JSON or CSV)
router.get("/export/data", authenticateJWT, requireSuperAdmin, studentController.exportStudents);

// POST /api/students/bulk - Bulk create students
router.post("/bulk", authenticateJWT, requireSuperAdmin, studentController.bulkCreateStudents);

// PUT /api/students/bulk - Bulk update students
router.put("/bulk", authenticateJWT, requireSuperAdmin, studentController.bulkUpdateStudents);

// DELETE /api/students/bulk - Bulk delete/deactivate students
router.delete("/bulk", authenticateJWT, requireSuperAdmin, studentController.bulkDeleteStudents);

// POST /api/students/bulk-deactivate - Bulk deactivate students (soft delete)
router.post("/bulk-deactivate", authenticateJWT, requireSuperAdmin, studentController.bulkDeleteStudents);

// GET /api/students/rfid/:tag - Get student by RFID tag
router.get("/rfid/:tag", studentController.getStudentByRfid); // RFID tap, no auth

// === STANDARD CRUD ROUTES ===

// GET /api/students - Get all students (with pagination, search, filter)
router.get("/", authenticateJWT, requireSuperAdmin, studentController.getAllStudents);

// GET /api/students/:id - Get student by ID
router.get("/:id", authenticateJWT, requireSuperAdmin, studentController.getStudentById);

// POST /api/students - Create new student
router.post("/", authenticateJWT, requireSuperAdmin, studentController.createStudent);

// PUT /api/students/:id - Update student
router.put("/:id", authenticateJWT, requireSuperAdmin, studentController.updateStudent);

// DELETE /api/students/:id - Delete/deactivate student
router.delete("/:id", authenticateJWT, requireSuperAdmin, studentController.deleteStudent);

// PATCH /api/students/:id/status - Toggle student active status
router.patch("/:id/status", authenticateJWT, requireSuperAdmin, studentController.toggleStudentStatus);

module.exports = router;
