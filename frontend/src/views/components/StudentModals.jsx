import { useState, useEffect } from "react";
import {
  X,
  Save,
  User,
  Mail,
  CreditCard,
  GraduationCap,
  CheckCircle,
  Upload,
} from "lucide-react";
import {
  COURSE_OPTIONS,
  YEAR_LEVEL_OPTIONS,
  ACCESS_LEVEL_OPTIONS,
} from "../../utils/constants.js";
import "./StudentModals.css";

// Add/Edit Student Modal
export const StudentFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  student = null,
  loading = false,
}) => {
  const [formData, setFormData] = useState({
    name: student?.name || "",
    email: student?.email || "",
    studentId: student?.studentId || "",
    course: student?.course || "",
    yearLevel: student?.yearLevel || "1st Year",
    rfIdTag: student?.rfIdTag || "",
    accessLevel: student?.accessLevel || "student",
    isActive: student?.isActive !== undefined ? student.isActive : true,
  });

  const [errors, setErrors] = useState({});
  const [profileFile, setProfileFile] = useState(null);
  const [profilePreview, setProfilePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);

  useEffect(() => {
    setFormData({
      name: student?.name || "",
      email: student?.email || "",
      studentId: student?.studentId || "",
      course: student?.course || "",
      yearLevel: student?.yearLevel || "1st Year",
      rfIdTag: student?.rfIdTag || "",
      accessLevel: student?.accessLevel || "student",
      isActive: student?.isActive !== undefined ? student.isActive : true,
    });
  }, [student]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.studentId.trim()) {
      newErrors.studentId = "Student ID is required";
    }

    if (!formData.course.trim()) {
      newErrors.course = "Course is required";
    }

    if (!formData.rfIdTag.trim()) {
      newErrors.rfIdTag = "RFID Tag is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // Handle profile picture file selection
  const handleProfileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileFile(file);
      setProfilePreview(URL.createObjectURL(file));
    }
  };

  // Upload profile picture to backend
  const handleProfileUpload = async () => {
    if (!profileFile || !student?._id) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("profilePicture", profileFile);
    try {
      const res = await fetch(
        `http://localhost:3000/api/profile-picture/${student._id}/upload-profile-picture`,
        {
          method: "POST",
          body: formData,
        }
      );
      const data = await res.json();
      if (data.success) {
        setFormData((prev) => ({ ...prev, profilePicture: data.imageUrl }));
        setUploaded(true);
        alert("Uploaded");
      }
    } catch (err) {
      alert("Upload failed", err);
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2>{student ? "Edit Student" : "Add New Student"}</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="name">
                <User size={16} />
                Full Name *
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className={errors.name ? "error" : ""}
                placeholder="Enter full name"
              />
              {errors.name && (
                <span className="error-message">{errors.name}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="email">
                <Mail size={16} />
                Email Address *
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className={errors.email ? "error" : ""}
                placeholder="Enter email address"
              />
              {errors.email && (
                <span className="error-message">{errors.email}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="studentId">
                <CreditCard size={16} />
                Student ID *
              </label>
              <input
                id="studentId"
                type="text"
                value={formData.studentId}
                onChange={(e) =>
                  handleChange("studentId", e.target.value.toUpperCase())
                }
                className={errors.studentId ? "error" : ""}
                placeholder="Enter student ID"
              />
              {errors.studentId && (
                <span className="error-message">{errors.studentId}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="course">
                <GraduationCap size={16} />
                Course *
              </label>
              <select
                id="course"
                value={formData.course}
                onChange={(e) => handleChange("course", e.target.value)}
                className={errors.course ? "error" : ""}
              >
                <option value="">Select Course</option>
                {COURSE_OPTIONS.map((course) => (
                  <option key={course.value} value={course.value}>
                    {course.label}
                  </option>
                ))}
              </select>
              {errors.course && (
                <span className="error-message">{errors.course}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="yearLevel">Year Level *</label>
              <select
                id="yearLevel"
                value={formData.yearLevel}
                onChange={(e) => handleChange("yearLevel", e.target.value)}
              >
                {YEAR_LEVEL_OPTIONS.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="rfIdTag">
                <CreditCard size={16} />
                RFID Tag *
              </label>
              <input
                id="rfIdTag"
                type="text"
                value={formData.rfIdTag}
                onChange={(e) =>
                  handleChange("rfIdTag", e.target.value.toUpperCase())
                }
                className={errors.rfIdTag ? "error" : ""}
                placeholder="Enter RFID tag"
              />
              {errors.rfIdTag && (
                <span className="error-message">{errors.rfIdTag}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="accessLevel">Access Level</label>
              <select
                id="accessLevel"
                value={formData.accessLevel}
                onChange={(e) => handleChange("accessLevel", e.target.value)}
              >
                {ACCESS_LEVEL_OPTIONS.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="profilePicture">Profile Picture</label>
              <input
                id="profilePicture"
                type="file"
                accept="image/*"
                style={{
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                  background: "#f9fafb",
                  fontFamily: "Arial",
                }}
                onChange={handleProfileChange}
              />
              {profilePreview && (
                <div className="profile-preview">
                  <img
                    src={profilePreview}
                    alt="Profile Preview"
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: "2px solid #10b981",
                    }}
                  />
                  {profileFile && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleProfileUpload}
                      disabled={uploading || uploaded}
                    >
                      <Upload size={16} />{" "}
                      {uploaded ? "Uploaded" : uploading ? "Uploading..." : "Upload"}
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="isActive">Status</label>
              <select
                id="isActive"
                value={formData.isActive ? "active" : "inactive"}
                onChange={(e) =>
                  handleChange("isActive", e.target.value === "active")
                }
                style={{
                  padding: "8px",
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                  background: "#f9fafb",
                  fontFamily: "Arial",
                }}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </form>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={loading}
          >
            <Save size={16} />
            {loading ? "Saving..." : student ? "Update Student" : "Add Student"}
          </button>
        </div>
      </div>
    </div>
  );
};

// View Student Details Modal
export const StudentViewModal = ({ isOpen, onClose, student }) => {
  if (!isOpen || !student) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2>Student Details</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="student-details">
            <div className="detail-section">
              <h3>Personal Information</h3>
              <div className="detail-grid personal-info-grid">
                <div className="detail-item profile-pic-item">
                  {student.profilePicture ? (
                    <img
                      src={student.profilePicture.startsWith('/uploads/profile-pictures/')
                        ? `http://localhost:3000${student.profilePicture}`
                        : student.profilePicture.startsWith('http')
                          ? student.profilePicture
                          : `http://localhost:3000/uploads/profile-pictures/${student.profilePicture}`}
                      alt="Profile"
                      style={{
                        width: 100,
                        height: 100,
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: "2px solid #10b981",
                      }}
                    />
                  ) : (
                    <span>No profile picture uploaded</span>
                  )}
                </div>
                <div className="detail-item">
                  <label>Full Name</label>
                  <span>{student.name}</span>
                </div>
                <div className="detail-item">
                  <label>Email</label>
                  <span className="long-email">{student.email}</span>
                </div>
                <div className="detail-item">
                  <label>Student ID</label>
                  <code>{student.studentId}</code>
                </div>
                <div className="detail-item">
                  <label>Status</label>
                  <span
                    className={`status-badge ${
                      student.isActive ? "active" : "inactive"
                    }`}
                  >
                    {student.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h3>Academic Information</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <label>Course</label>
                  <span className="course-badge">{student.course}</span>
                </div>
                <div className="detail-item">
                  <label>Year Level</label>
                  <span>{student.yearLevel}</span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h3>Access Information</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <label>RFID Tag</label>
                  <code>{student.rfIdTag || "Not assigned"}</code>
                </div>
                <div className="detail-item">
                  <label>Access Level</label>
                  <span className={`access-badge ${student.accessLevel}`}>
                    {student.accessLevel}
                  </span>
                </div>
              </div>
            </div>

            {student.createdAt && (
              <div className="detail-section">
                <h3>System Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Created</label>
                    <span>{new Date(student.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="detail-item">
                    <label>Last Updated</label>
                    <span>{new Date(student.updatedAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Bulk Operations Modal
export const BulkUpdateModal = ({
  isOpen,
  onClose,
  onSubmit,
  selectedCount,
  loading = false,
}) => {
  const [updateData, setUpdateData] = useState({
    course: "",
    yearLevel: "",
    accessLevel: "",
    isActive: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    // Filter out empty values
    const filteredData = Object.entries(updateData)
      .filter(([, value]) => value !== "")
      .reduce((acc, [key, value]) => {
        acc[key] = value === "true" ? true : value === "false" ? false : value;
        return acc;
      }, {});

    if (Object.keys(filteredData).length === 0) {
      alert("Please select at least one field to update");
      return;
    }

    onSubmit(filteredData);
  };

  const handleChange = (field, value) => {
    setUpdateData((prev) => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2>Bulk Update Students</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="bulk-info">
            <p>
              Updating <strong>{selectedCount}</strong> selected students
            </p>
            <p className="bulk-note">
              Only fields with values will be updated. Leave fields empty to
              keep current values.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="bulk-form">
            <div className="form-group">
              <label htmlFor="bulk-course">Course</label>
              <select
                id="bulk-course"
                value={updateData.course}
                onChange={(e) => handleChange("course", e.target.value)}
              >
                <option value="">Keep current</option>
                {COURSE_OPTIONS.map((course) => (
                  <option key={course.value} value={course.value}>
                    {course.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="bulk-yearLevel">Year Level</label>
              <select
                id="bulk-yearLevel"
                value={updateData.yearLevel}
                onChange={(e) => handleChange("yearLevel", e.target.value)}
              >
                <option value="">Keep current</option>
                {YEAR_LEVEL_OPTIONS.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="bulk-accessLevel">Access Level</label>
              <select
                id="bulk-accessLevel"
                value={updateData.accessLevel}
                onChange={(e) => handleChange("accessLevel", e.target.value)}
              >
                <option value="">Keep current</option>
                {ACCESS_LEVEL_OPTIONS.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="bulk-isActive">Status</label>
              <select
                id="bulk-isActive"
                value={updateData.isActive}
                onChange={(e) => handleChange("isActive", e.target.value)}
              >
                <option value="">Keep current</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </form>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={loading}
          >
            <Save size={16} />
            {loading ? "Updating..." : "Update Students"}
          </button>
        </div>
      </div>
    </div>
  );
};

// Bulk Import Modal
export const BulkImportModal = ({
  isOpen,
  onClose,
  onImport,
  loading = false,
}) => {
  const [importData, setImportData] = useState("");
  const [importFormat, setImportFormat] = useState("json");
  const [errors, setErrors] = useState([]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setImportData(event.target.result);
    };
    reader.readAsText(file);
  };

  const validateImportData = () => {
    try {
      if (importFormat === "json") {
        const data = JSON.parse(importData);
        if (!Array.isArray(data)) {
          throw new Error("JSON must be an array of student objects");
        }
        return data;
      } else {
        // Simple CSV parsing
        const lines = importData.trim().split("\n");
        const headers = lines[0].split(",").map((h) => h.trim());
        const requiredHeaders = [
          "name",
          "email",
          "studentId",
          "course",
          "yearLevel",
          "rfIdTag",
        ];

        const missingHeaders = requiredHeaders.filter(
          (h) => !headers.includes(h)
        );
        if (missingHeaders.length > 0) {
          throw new Error(
            `Missing required headers: ${missingHeaders.join(", ")}`
          );
        }

        const data = lines.slice(1).map((line) => {
          const values = line.split(",").map((v) => v.trim());
          const student = {};
          headers.forEach((header, i) => {
            student[header] = values[i] || "";
          });
          return student;
        });

        return data;
      }
    } catch (error) {
      setErrors([error.message]);
      return null;
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrors([]);

    const data = validateImportData();
    if (data) {
      onImport(data, importFormat);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container large">
        <div className="modal-header">
          <h2>Bulk Import Students</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="import-options">
            <div className="form-group">
              <label>Import Format</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    value="json"
                    checked={importFormat === "json"}
                    onChange={(e) => setImportFormat(e.target.value)}
                  />
                  JSON
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    value="csv"
                    checked={importFormat === "csv"}
                    onChange={(e) => setImportFormat(e.target.value)}
                  />
                  CSV
                </label>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="file-upload">
                <Upload size={16} />
                Upload File
              </label>
              <input
                id="file-upload"
                type="file"
                accept={importFormat === "json" ? ".json" : ".csv"}
                onChange={handleFileUpload}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="import-data">Data Preview</label>
            <textarea
              id="import-data"
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              placeholder={
                importFormat === "json"
                  ? "Paste JSON array of student objects here..."
                  : "Paste CSV data here (first row should be headers)..."
              }
              rows={12}
            />
          </div>

          {errors.length > 0 && (
            <div className="import-errors">
              <h4>Import Errors:</h4>
              <ul>
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="import-help">
            <h4>Required Fields:</h4>
            <p>name, email, studentId, course, yearLevel, rfIdTag</p>

            {importFormat === "json" && (
              <div className="format-example">
                <h4>JSON Example:</h4>
                <pre>{`[
  {
    "name": "John Doe",
    "email": "john.doe@example.com",
    "studentId": "STU001",
    "course": "Computer Science",
    "yearLevel": "3rd Year",
    "rfIdTag": "RFID001",
    "accessLevel": "student",
    "isActive": true
  }
]`}</pre>
              </div>
            )}

            {importFormat === "csv" && (
              <div className="format-example">
                <h4>CSV Example:</h4>
                <pre>{`name,email,studentId,course,yearLevel,rfIdTag,accessLevel,isActive
John Doe,john.doe@example.com,STU001,Computer Science,3rd Year,RFID001,student,true`}</pre>
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={loading || !importData.trim()}
          >
            <Upload size={16} />
            {loading ? "Importing..." : "Import Students"}
          </button>
        </div>
      </div>
    </div>
  );
};
