/**
 * Offline development mock dataset.
 *
 * NOTE: This mock data is ONLY used when VITE_USE_MOCK_FALLBACK=true
 * in .env to allow frontend UI testing while the backend is under development.
 * It is completely bypassed when running against the live backend API.
 */

export const INITIAL_MOCK_DOCUMENTS = [
  {
    id: 'doc-001',
    name: 'College_Academic_Regulations_2026.pdf',
    type: 'pdf',
    fileSize: 2450000,
    uploadedAt: '2026-10-01T10:15:00Z',
    uploadedBy: 'Admin User',
    status: 'Completed',
    chunkCount: 142,
    processingStartTime: '2026-10-01T10:15:02Z',
    processingEndTime: '2026-10-01T10:16:15Z',
    errorMessage: null,
  },
  {
    id: 'doc-002',
    name: 'Computer_Science_Syllabus_Sem5.docx',
    type: 'docx',
    fileSize: 850000,
    uploadedAt: '2026-10-02T08:30:00Z',
    uploadedBy: 'Dr. Ramesh Sharma',
    status: 'Completed',
    chunkCount: 68,
    processingStartTime: '2026-10-02T08:30:05Z',
    processingEndTime: '2026-10-02T08:30:52Z',
    errorMessage: null,
  },
  {
    id: 'doc-003',
    name: 'Campus_Hostel_Fee_Structure_Fall2026.pdf',
    type: 'pdf',
    fileSize: 1200000,
    uploadedAt: '2026-10-02T11:05:00Z',
    uploadedBy: 'Admin User',
    status: 'Processing',
    chunkCount: null,
    processingStartTime: '2026-10-02T11:05:05Z',
    processingEndTime: null,
    errorMessage: null,
  },
  {
    id: 'doc-004',
    name: 'Old_Bus_Routes_Archive.txt',
    type: 'txt',
    fileSize: 45000,
    uploadedAt: '2026-10-02T09:12:00Z',
    uploadedBy: 'Staff Portal',
    status: 'Failed',
    chunkCount: null,
    processingStartTime: '2026-10-02T09:12:03Z',
    processingEndTime: '2026-10-02T09:12:15Z',
    errorMessage: 'Text extraction parser error: Corrupted character encoding at line 240.',
  },
  {
    id: 'doc-005',
    name: 'Sports_Complex_Guidelines.pdf',
    type: 'pdf',
    fileSize: 520000,
    uploadedAt: '2026-10-02T11:30:00Z',
    uploadedBy: 'Athletics Office',
    status: 'Pending',
    chunkCount: null,
    processingStartTime: null,
    processingEndTime: null,
    errorMessage: null,
  },
];

export const MOCK_CHAT_RESPONSES = [
  {
    keywords: ['attendance', 'criteria', 'minimum', 'percentage'],
    answer:
      'According to Section 4.2 of the College Academic Regulations, students are required to maintain a minimum of 75% attendance in each registered course to be eligible to appear for the end-semester examinations. An exemption up to 10% may be granted by the Dean on valid medical grounds.',
    sources: [
      {
        title: 'College Academic Regulations 2026',
        page: 18,
        docName: 'College_Academic_Regulations_2026.pdf',
        snippet: 'Section 4.2: Attendance Requirement - A candidate shall be deemed to have fulfilled the attendance requirements if they have attended at least 75% of classes...',
      },
    ],
  },
  {
    keywords: ['fee', 'hostel', 'payment', 'deadline', 'mess'],
    answer:
      'The hostel accommodation fees for Fall 2026 are structured across Room Rent (INR 35,000/sem) and Mess Charges (INR 22,000/sem). The payment window closes on October 15, 2026. Late fees apply thereafter.',
    sources: [
      {
        title: 'Campus Hostel Fee Structure Fall 2026',
        page: 2,
        docName: 'Campus_Hostel_Fee_Structure_Fall2026.pdf',
        snippet: 'Schedule of fees: Single/Double Occupancy and Mess advance for Fall semester 2026...',
      },
    ],
  },
  {
    keywords: ['syllabus', 'cs', 'computer science', 'sem 5', 'semester 5'],
    answer:
      'The Computer Science Semester 5 curriculum includes Core Subjects: Operating Systems, Database Management Systems, Theory of Computation, and Computer Networks, accompanied by respective practical lab sessions.',
    sources: [
      {
        title: 'Computer Science Syllabus Sem 5',
        page: 4,
        docName: 'Computer_Science_Syllabus_Sem5.docx',
        snippet: 'CS-501 Operating Systems (3-0-0), CS-502 Database Management Systems (3-0-2)...',
      },
    ],
  },
];
