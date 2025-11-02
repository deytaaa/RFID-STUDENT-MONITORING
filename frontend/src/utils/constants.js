// Course Options Constants
export const COURSE_OPTIONS = [
  {
    value: "Bachelor of Science Information Technology (BSIT)",
    label: "Bachelor of Science Information Technology (BSIT)",
    shortCode: "BSIT"
  },
  {
    value: "Certificate in Computer Sciences (CCS)",
    label: "Certificate in Computer Sciences (CCS)",
    shortCode: "CCS"
  },
  {
    value: "Bachelor of Science in Office Administration (BSOA)",
    label: "Bachelor of Science in Office Administration (BSOA)",
    shortCode: "BSOA"
  },
  {
    value: "Certificate in Office Administration (COA)",
    label: "Certificate in Office Administration (COA)",
    shortCode: "COA"
  },
  {
    value: "Associate in Business Administration (ABA)",
    label: "Associate in Business Administration (ABA)",
    shortCode: "ABA"
  },
  {
    value: "Associate in Accounting Information System (AAIS)",
    label: "Associate in Accounting Information System (AAIS)",
    shortCode: "AAIS"
  },
  {
    value: "Associate in Human Resource Development (AHRD)",
    label: "Associate in Human Resource Development (AHRD)",
    shortCode: "AHRD"
  },
  {
    value: "Associate in Hotel and Restaurant Technology (AHRT)",
    label: "Associate in Hotel and Restaurant Technology (AHRT)",
    shortCode: "AHRT"
  }
];

// Year Level Options
export const YEAR_LEVEL_OPTIONS = [
  "1st Year",
  "2nd Year", 
  "3rd Year",
  "4th Year",
  "5th Year",
  "Graduate"
];

// Access Level Options - Student Only System
export const ACCESS_LEVEL_OPTIONS = [
  { value: "student", label: "Student" }
];

// Utility function to get course short code
export const getCourseShortCode = (fullCourseName) => {
  const course = COURSE_OPTIONS.find(option => option.value === fullCourseName);
  return course ? course.shortCode : fullCourseName;
};

// Utility function to get full course name
export const getFullCourseName = (shortCode) => {
  const course = COURSE_OPTIONS.find(option => option.shortCode === shortCode);
  return course ? course.value : shortCode;
};
