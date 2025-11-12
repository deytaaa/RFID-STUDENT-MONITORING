const { User } = require("../models");
const bcrypt = require("bcrypt");

const userController = {
  // GET ALL STUDENTS (with pagination)
  async getAllUsers(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      // Support filtering by accessLevel or role
      let filter = {};
      if (req.query.accessLevel) {
        filter.accessLevel = req.query.accessLevel;
      }
      if (req.query.role) {
        filter.role = req.query.role;
      }
      // Default: show students if no filter
      if (!filter.accessLevel && !filter.role) {
        filter.accessLevel = "student";
      }

      const users = await User.find(filter).skip(skip).limit(limit);
      const total = await User.countDocuments(filter);

      res.status(200).json({
        success: true,
        total,
        page,
        pages: Math.ceil(total / limit),
        data: users,
      });
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  },

  // GET USER BY ID
  async getUserById(req, res) {
    try {
      const { id } = req.params;
      const user = await User.findById(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      res.status(200).json({ success: true, data: user });
    } catch (error) {
      console.error("Error fetching user by ID:", error);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  },

  // GET USER BY RFID TAG
  async getUserByRfid(req, res) {
    try {
      const { tag } = req.params;
      const user = await User.findOne({ rfIdTag: tag });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      res.status(200).json({ success: true, data: user });
    } catch (error) {
      console.error("Error fetching user by RFID tag:", error);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  },

  // CREATE USER
  async createUser(req, res) {
    try {
      const { name, email, rfIdTag, accessLevel, password } = req.body;
      // Only superadmin can create admin or superadmin users
      if (
        (accessLevel === "admin" || accessLevel === "superadmin") &&
        (!req.user || req.user.accessLevel !== "superadmin")
      ) {
        return res.status(403).json({
          success: false,
          message: "Only super admins can create admin or super admin accounts.",
        });
      }
      // Validate required fields
      if (!name || !email || !rfIdTag || !password) {
        return res.status(400).json({
          success: false,
          message: "Name, email, rfIdTag, and password are required.",
        });
      }
      // Check for duplicates
      const existingUser = await User.findOne({
        $or: [{ email }, { rfIdTag }],
      });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "User with this email or RFID tag already exists.",
        });
      }
      // Hash password before saving
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new User({
        name,
        email,
        rfIdTag,
        accessLevel: accessLevel || "default",
        role: accessLevel || "student",
        password: hashedPassword,
      });
      await newUser.save();
      res.status(201).json({
        success: true,
        message: "User created successfully.",
        data: newUser,
      });
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  },

  // UPDATE USER
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { name, email, rfIdTag, accessLevel } = req.body;

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      // Only superadmin can update accessLevel to admin or superadmin
      if (
        accessLevel &&
        (accessLevel === "admin" || accessLevel === "superadmin") &&
        (!req.user || req.user.accessLevel !== "superadmin")
      ) {
        return res.status(403).json({
          success: false,
          message: "Only super admins can set accessLevel to admin or superadmin.",
        });
      }

      // Update only provided fields
      if (name) user.name = name;
      if (email) user.email = email;
      if (rfIdTag) user.rfIdTag = rfIdTag;
      if (accessLevel) user.accessLevel = accessLevel;

      await user.save();

      res.status(200).json({
        success: true,
        message: "User updated successfully.",
        data: user,
      });
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  },

  // DELETE USER
  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      const user = await User.findByIdAndDelete(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }
      res.status(200).json({
        success: true,
        message: "User deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).send({
        success: false,
        message: "Error in deleting User",
        error,
      });
    }
  },

  // DEACTIVATE USER (soft delete)
  async deactivateUser(req, res) {
    try {
      const { id } = req.params;
      const user = await User.findByIdAndUpdate(
        id,
        { isActive: false },
        { new: true }
      );
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }
      res.status(200).json({
        success: true,
        message: "User deactivated successfully.",
        data: user
      });
    } catch (error) {
      console.error("Error deactivating user:", error);
      res.status(500).json({
        success: false,
        message: "Error in deactivating User",
        error,
      });
    }
  },
};

module.exports = userController;
