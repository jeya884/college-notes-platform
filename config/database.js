const fs = require('fs');
const path = require('path');
const { syncDocToFirestore, deleteDocFromFirestore, firestoreDb } = require('./firebase');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'mba_database.json');
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Helper to generate sample PDF files
const samplePdfs = [
  // Year 1, Sem 1
  { name: 'mba_sem1_principles_of_management.pdf', title: 'Principles of Management & Org Dynamics', content: '%PDF-1.4\n% MBA Year 1, Semester 1\nSubject: Principles of Management (MBA101)\nTopics: Planning, Organizing, Staffing, Directing, Controlling, Fayol & Taylor Principles, Decision Making Models.' },
  { name: 'mba_sem1_managerial_economics.pdf', title: 'Managerial Economics & Demand Analysis', content: '%PDF-1.4\n% MBA Year 1, Semester 1\nSubject: Managerial Economics (MBA102)\nTopics: Demand Elasticity, Cost-Volume-Profit Analysis, Market Structures (Monopoly, Oligopoly), Pricing Strategies.' },
  { name: 'mba_sem1_financial_accounting.pdf', title: 'Accounting for Managers & Balance Sheets', content: '%PDF-1.4\n% MBA Year 1, Semester 1\nSubject: Accounting for Managers (MBA103)\nTopics: Double Entry, GAAP vs IFRS, Cash Flow Statement, Ratio Analysis, Break-Even Analysis.' },

  // Year 1, Sem 2
  { name: 'mba_marketing_management_unit1-5.pdf', title: 'Marketing Management Comprehensive Lecture Notes', content: '%PDF-1.4\n% MBA Year 1, Semester 2\nSubject: Marketing Management (MBA201)\nTopics: STP Framework, 7Ps of Services, Brand Equity Models, Digital Marketing Channels.' },
  { name: 'mba_financial_management_core.pdf', title: 'Financial Management & Capital Budgeting', content: '%PDF-1.4\n% MBA Year 1, Semester 2\nSubject: Financial Management (MBA202)\nTopics: NPV, IRR, WACC, Modigliani-Miller Theorem, Working Capital Management.' },
  { name: 'mba_human_resource_mgmt.pdf', title: 'Human Resource Management & Org Behavior', content: '%PDF-1.4\n% MBA Year 1, Semester 2\nSubject: Human Resource Management (MBA203)\nTopics: Strategic HRM, 360-Degree Feedback, Herzberg Dual Factor, Conflict Resolution.' },
  { name: 'mba_operations_supply_chain.pdf', title: 'Operations & Supply Chain Management Handbook', content: '%PDF-1.4\n% MBA Year 1, Semester 2\nSubject: Operations & Supply Chain (MBA204)\nTopics: Six Sigma DMAIC, EOQ, Lean Manufacturing, JIT, Facility Location & Layout.' },
  { name: 'mba_business_analytics_python.pdf', title: 'Business Analytics & Predictive Modeling', content: '%PDF-1.4\n% MBA Year 1, Semester 2\nSubject: Business Analytics (MBA205)\nTopics: Multiple Regression, Decision Trees, Logistic Regression, Tableau Dashboards.' },
  { name: 'mba_strategic_management_frameworks.pdf', title: 'Strategic Management & Competitive Advantage', content: '%PDF-1.4\n% MBA Year 1, Semester 2\nSubject: Strategic Management (MBA206)\nTopics: Porter\'s 5 Forces, VRIO Framework, BCG Matrix, Blue Ocean Strategy.' },

  // Year 2, Sem 3
  { name: 'mba_sem3_mergers_acquisitions.pdf', title: 'Corporate Finance, Mergers & Acquisitions', content: '%PDF-1.4\n% MBA Year 2, Semester 3\nSubject: Corporate Finance & M&A (MBA301)\nTopics: Due Diligence, DCF Valuation, Synergy Assessment, LBOs, Takeover Defenses.' },
  { name: 'mba_sem3_digital_marketing_strategy.pdf', title: 'Digital Marketing & Social Commerce', content: '%PDF-1.4\n% MBA Year 2, Semester 3\nSubject: Digital Marketing (MBA302)\nTopics: SEO/SEM, Performance Marketing, Omni-Channel Customer Journey, Influencer ROI.' },
  { name: 'mba_sem3_supply_chain_analytics.pdf', title: 'Supply Chain Analytics & Global Logistics', content: '%PDF-1.4\n% MBA Year 2, Semester 3\nSubject: Supply Chain Analytics (MBA303)\nTopics: Network Optimization, Bullwhip Effect Mitigation, Warehouse Robotics, Cold Chain Logistics.' },

  // Year 2, Sem 4
  { name: 'mba_sem4_entrepreneurship_venture.pdf', title: 'Entrepreneurship & Venture Capital Funding', content: '%PDF-1.4\n% MBA Year 2, Semester 4\nSubject: Entrepreneurship & Venture Capital (MBA401)\nTopics: Pitch Decks, Term Sheets, Cap Tables, Series A-C Valuations, Lean Startup Methodology.' },
  { name: 'mba_sem4_esg_corporate_governance.pdf', title: 'Corporate Governance & ESG Compliance', content: '%PDF-1.4\n% MBA Year 2, Semester 4\nSubject: Corporate Governance & Ethics (MBA403)\nTopics: Board Dynamics, Stakeholder Theory, ESG Reporting Frameworks (BRSR, GRI).' }
];

for (const p of samplePdfs) {
  const filePath = path.join(UPLOADS_DIR, p.name);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, p.content, 'utf-8');
  }
}

// User-defined Academic Year Mapping:
// Roll numbers starting with 25 (e.g. 25MBA01) = 2nd Year (Year 2)
// Roll numbers starting with 26 (e.g. 26MBA01) = 1st Year (Year 1)
function getYearAndSemesterFromRoll(inputRoll) {
  if (!inputRoll) return { year: 'Year 1', semester: 'Semester 2', batch: '2026-2028' };
  const clean = String(inputRoll).trim().toUpperCase();

  if (clean.startsWith('25') || clean.includes('25MBA')) {
    return {
      year: 'Year 2',
      semester: 'Semester 4',
      batch: '2025-2027'
    };
  }
  if (clean.startsWith('26') || clean.includes('26MBA')) {
    return {
      year: 'Year 1',
      semester: 'Semester 2',
      batch: '2026-2028'
    };
  }
  if (clean.startsWith('24') || clean.includes('24MBA')) {
    return {
      year: 'Year 2',
      semester: 'Semester 4',
      batch: '2024-2026'
    };
  }
  return {
    year: 'Year 1',
    semester: 'Semester 2',
    batch: '2026-2028'
  };
}

// Generate default student roll numbers:
// Year 1 (1st Year): 26MBA01 - 26MBA175
// Year 2 (2nd Year): 25MBA01 - 25MBA175
function generateDefaultStudents() {
  const list = [];
  // Year 1 Batch (2026-2028) - 1st Year
  for (let i = 1; i <= 175; i++) {
    const pad = i < 10 ? `0${i}` : `${i}`;
    list.push({
      roll_number: `26MBA${pad}`,
      name: `MBA 1st Year Student ${pad}`,
      year: 'Year 1',
      semester: 'Semester 2',
      batch: '2026-2028',
      status: 'active',
      created_at: new Date('2026-01-10T09:00:00Z').toISOString()
    });
  }
  // Year 2 Batch (2025-2027) - 2nd Year
  for (let i = 1; i <= 175; i++) {
    const pad = i < 10 ? `0${i}` : `${i}`;
    list.push({
      roll_number: `25MBA${pad}`,
      name: `MBA 2nd Year Student ${pad}`,
      year: 'Year 2',
      semester: 'Semester 4',
      batch: '2025-2027',
      status: 'active',
      created_at: new Date('2025-01-10T09:00:00Z').toISOString()
    });
  }
  // Also preserve 24MBA01-24MBA175 for Year 2 alumni / previous records
  for (let i = 1; i <= 175; i++) {
    const pad = i < 10 ? `0${i}` : `${i}`;
    list.push({
      roll_number: `24MBA${pad}`,
      name: `MBA Senior Student (Y2) ${pad}`,
      year: 'Year 2',
      semester: 'Semester 4',
      batch: '2024-2026',
      status: 'active',
      created_at: new Date('2024-01-10T09:00:00Z').toISOString()
    });
  }
  return list;
}

function normalizeStudentRoll(input) {
  if (!input) return '';
  let str = String(input).trim().toUpperCase().replace(/\s+/g, '');
  // If pure number (e.g. "1" or "01" or "75")
  if (/^\d+$/.test(str)) {
    const num = parseInt(str, 10);
    const pad = num < 10 ? `0${num}` : `${num}`;
    return `26MBA${pad}`; // Defaults to 1st year (26MBA)
  }
  // If format like "26MBA1" or "25MBA1" -> pad to 2 digits
  const matchWithPrefix = str.match(/^(\d{2}MBA)(\d+)$/);
  if (matchWithPrefix) {
    const prefix = matchWithPrefix[1];
    const num = parseInt(matchWithPrefix[2], 10);
    const pad = num < 10 ? `0${num}` : `${num}`;
    return `${prefix}${pad}`;
  }
  // If format like "2601" or "2501"
  const matchDigits = str.match(/^(\d{2})(\d{2,3})$/);
  if (matchDigits) {
    const yr = matchDigits[1];
    const num = parseInt(matchDigits[2], 10);
    const pad = num < 10 ? `0${num}` : `${num}`;
    return `${yr}MBA${pad}`;
  }
  // If format like "MBA1" or "MBA01"
  const matchMBA = str.match(/^MBA(\d+)$/);
  if (matchMBA) {
    const num = parseInt(matchMBA[1], 10);
    const pad = num < 10 ? `0${num}` : `${num}`;
    return `26MBA${pad}`;
  }
  return str;
}

function findOrRegisterStudent(inputRoll) {
  if (!inputRoll) return null;
  const normalized = normalizeStudentRoll(inputRoll);
  const database = db || loadDatabase();
  let student = database.students.find(s => s.roll_number.toUpperCase() === normalized);
  if (student) {
    // Reconcile year & semester according to user-defined roll number prefix rules
    const cohortInfo = getYearAndSemesterFromRoll(student.roll_number);
    if (student.year !== cohortInfo.year) {
      student.year = cohortInfo.year;
      student.semester = cohortInfo.semester;
      student.batch = cohortInfo.batch;
      saveDatabase();
    }
    return student;
  }

  // Fallback match: also check without leading zeros
  student = database.students.find(s => s.roll_number.replace(/^0+/, '') === normalized.replace(/^0+/, ''));
  if (student) {
    const cohortInfo = getYearAndSemesterFromRoll(student.roll_number);
    if (student.year !== cohortInfo.year) {
      student.year = cohortInfo.year;
      student.semester = cohortInfo.semester;
      student.batch = cohortInfo.batch;
      saveDatabase();
    }
    return student;
  }

  // If still not found, dynamically register this student account with appropriate year
  const cohortInfo = getYearAndSemesterFromRoll(normalized);
  const newStudent = {
    roll_number: normalized,
    name: `MBA ${cohortInfo.year === 'Year 2' ? '2nd' : '1st'} Year Student ${normalized}`,
    year: cohortInfo.year,
    semester: cohortInfo.semester,
    batch: cohortInfo.batch,
    status: 'active',
    created_at: new Date().toISOString()
  };
  database.students.push(newStudent);
  saveDatabase();
  syncDocToFirestore('students', normalized, newStudent).catch(() => {});
  return newStudent;
}

function getDefaultDatabase() {
  return {
    admin: {
      password: 'MBA Notes'
    },
    students: generateDefaultStudents(1, 175),
    notes: [
      // Year 1 - Semester 1
      {
        id: 101,
        title: 'Principles of Management & Organization Dynamics',
        subject: 'Principles of Management',
        course_code: 'MBA101',
        year: 'Year 1',
        semester: 'Semester 1',
        description: 'Covers core managerial functions (Planning, Organizing, Staffing, Leading, Controlling), Classical and Modern management theories, and organizational structures.',
        file_name: 'mba_sem1_principles_of_management.pdf',
        file_path: path.join(UPLOADS_DIR, 'mba_sem1_principles_of_management.pdf'),
        file_size: 1950000,
        download_count: 156,
        uploaded_by: 'MBA Academic Office',
        created_at: new Date('2026-01-15T10:00:00Z').toISOString()
      },
      {
        id: 102,
        title: 'Managerial Economics & Demand Forecasting',
        subject: 'Managerial Economics',
        course_code: 'MBA102',
        year: 'Year 1',
        semester: 'Semester 1',
        description: 'Microeconomic foundations for business decision making: Elasticity of demand, Cost-Volume-Profit analysis, Oligopoly models, and Game Theory fundamentals.',
        file_name: 'mba_sem1_managerial_economics.pdf',
        file_path: path.join(UPLOADS_DIR, 'mba_sem1_managerial_economics.pdf'),
        file_size: 2180000,
        download_count: 140,
        uploaded_by: 'Economics Faculty',
        created_at: new Date('2026-01-18T11:00:00Z').toISOString()
      },
      {
        id: 103,
        title: 'Accounting for Decision Making & Balance Sheet Analysis',
        subject: 'Financial Accounting',
        course_code: 'MBA103',
        year: 'Year 1',
        semester: 'Semester 1',
        description: 'Financial statement preparation, GAAP vs IFRS accounting standards, Cash Flow statement modeling, liquidity & solvency ratio analysis.',
        file_name: 'mba_sem1_financial_accounting.pdf',
        file_path: path.join(UPLOADS_DIR, 'mba_sem1_financial_accounting.pdf'),
        file_size: 2840000,
        download_count: 198,
        uploaded_by: 'Prof. Accounting Coordinator',
        created_at: new Date('2026-01-20T12:00:00Z').toISOString()
      },

      // Year 1 - Semester 2
      {
        id: 1,
        title: 'Marketing Management: STP, 7Ps & Brand Equity Models',
        subject: 'Marketing Management',
        course_code: 'MBA201',
        year: 'Year 1',
        semester: 'Semester 2',
        description: 'Covers Segmentation, Targeting, Positioning (STP), 7Ps of Services, Customer Lifetime Value (CLV), Brand Resonance pyramid, and digital omnichannel strategies.',
        file_name: 'mba_marketing_management_unit1-5.pdf',
        file_path: path.join(UPLOADS_DIR, 'mba_marketing_management_unit1-5.pdf'),
        file_size: 2450000,
        download_count: 242,
        uploaded_by: 'MBA Department Admin',
        created_at: new Date('2026-02-10T10:00:00Z').toISOString()
      },
      {
        id: 2,
        title: 'Financial Management: Capital Budgeting & Valuation Methods',
        subject: 'Financial Management',
        course_code: 'MBA202',
        year: 'Year 1',
        semester: 'Semester 2',
        description: 'Formulas and solved financial modeling problems on NPV, IRR, WACC, Capital Structure (Modigliani-Miller theorems), and working capital management.',
        file_name: 'mba_financial_management_core.pdf',
        file_path: path.join(UPLOADS_DIR, 'mba_financial_management_core.pdf'),
        file_size: 3120000,
        download_count: 268,
        uploaded_by: 'Prof. Finance Coordinator',
        created_at: new Date('2026-02-14T11:30:00Z').toISOString()
      },
      {
        id: 3,
        title: 'Human Resource Management & Talent Acquisition Strategies',
        subject: 'Human Resource Management',
        course_code: 'MBA203',
        year: 'Year 1',
        semester: 'Semester 2',
        description: 'Talent pipeline building, 360-degree KPI performance evaluation, Herzberg dual-factor motivation theory, and organizational leadership frameworks.',
        file_name: 'mba_human_resource_mgmt.pdf',
        file_path: path.join(UPLOADS_DIR, 'mba_human_resource_mgmt.pdf'),
        file_size: 1980000,
        download_count: 175,
        uploaded_by: 'MBA Department Admin',
        created_at: new Date('2026-02-20T14:15:00Z').toISOString()
      },
      {
        id: 4,
        title: 'Operations & Supply Chain Management Handbook',
        subject: 'Operations & Supply Chain',
        course_code: 'MBA204',
        year: 'Year 1',
        semester: 'Semester 2',
        description: 'Six Sigma DMAIC methodology, EOQ inventory models, Lean manufacturing, Aggregate planning, and logistics network optimization.',
        file_name: 'mba_operations_supply_chain.pdf',
        file_path: path.join(UPLOADS_DIR, 'mba_operations_supply_chain.pdf'),
        file_size: 2850000,
        download_count: 189,
        uploaded_by: 'Prof. Operations Head',
        created_at: new Date('2026-02-25T16:00:00Z').toISOString()
      },
      {
        id: 5,
        title: 'Business Analytics & Predictive Modeling Course Notes',
        subject: 'Business Analytics',
        course_code: 'MBA205',
        year: 'Year 1',
        semester: 'Semester 2',
        description: 'Multiple linear regression, Decision Trees, Confusion Matrix evaluation, ROI optimization models, and PowerBI dashboard creation techniques.',
        file_name: 'mba_business_analytics_python.pdf',
        file_path: path.join(UPLOADS_DIR, 'mba_business_analytics_python.pdf'),
        file_size: 3450000,
        download_count: 283,
        uploaded_by: 'Analytics Lab Director',
        created_at: new Date('2026-03-01T09:45:00Z').toISOString()
      },
      {
        id: 6,
        title: 'Strategic Management & Competitive Advantage Frameworks',
        subject: 'Strategic Management',
        course_code: 'MBA206',
        year: 'Year 1',
        semester: 'Semester 2',
        description: 'Porter’s Five Forces, Blue Ocean Strategy, BCG Growth-Share Matrix, Core Competencies analysis, and M&A corporate strategy formulations.',
        file_name: 'mba_strategic_management_frameworks.pdf',
        file_path: path.join(UPLOADS_DIR, 'mba_strategic_management_frameworks.pdf'),
        file_size: 2200000,
        download_count: 219,
        uploaded_by: 'MBA Department Admin',
        created_at: new Date('2026-03-05T13:20:00Z').toISOString()
      },

      // Year 2 - Semester 3
      {
        id: 201,
        title: 'Corporate Finance, Mergers & Acquisitions Valuation',
        subject: 'Financial Management',
        course_code: 'MBA301',
        year: 'Year 2',
        semester: 'Semester 3',
        description: 'Advanced financial valuation methodologies, Due Diligence checklists, Synergy calculation in M&A, Leveraged Buyouts (LBO), and hostile takeover defenses.',
        file_name: 'mba_sem3_mergers_acquisitions.pdf',
        file_path: path.join(UPLOADS_DIR, 'mba_sem3_mergers_acquisitions.pdf'),
        file_size: 3100000,
        download_count: 145,
        uploaded_by: 'Prof. Ananya Sen',
        created_at: new Date('2026-03-10T10:00:00Z').toISOString()
      },
      {
        id: 202,
        title: 'Digital Marketing & Omni-Channel Strategy',
        subject: 'Marketing Management',
        course_code: 'MBA302',
        year: 'Year 2',
        semester: 'Semester 3',
        description: 'Search engine marketing, conversion rate optimization, programmatic advertising, social commerce analytics, and mobile customer journey mapping.',
        file_name: 'mba_sem3_digital_marketing_strategy.pdf',
        file_path: path.join(UPLOADS_DIR, 'mba_sem3_digital_marketing_strategy.pdf'),
        file_size: 2600000,
        download_count: 167,
        uploaded_by: 'Dr. Rajesh Nair',
        created_at: new Date('2026-03-12T11:00:00Z').toISOString()
      },
      {
        id: 203,
        title: 'Global Supply Chain Logistics & Analytics',
        subject: 'Operations & Supply Chain',
        course_code: 'MBA303',
        year: 'Year 2',
        semester: 'Semester 3',
        description: 'Container shipping economics, customs & tariff optimization, automated fulfillment centers, AI routing, and resilient supply chain architectures.',
        file_name: 'mba_sem3_supply_chain_analytics.pdf',
        file_path: path.join(UPLOADS_DIR, 'mba_sem3_supply_chain_analytics.pdf'),
        file_size: 2900000,
        download_count: 138,
        uploaded_by: 'Dr. Vikramaditya K.',
        created_at: new Date('2026-03-14T14:00:00Z').toISOString()
      },

      // Year 2 - Semester 4
      {
        id: 301,
        title: 'Entrepreneurship & Venture Capital Financing',
        subject: 'Entrepreneurship',
        course_code: 'MBA401',
        year: 'Year 2',
        semester: 'Semester 4',
        description: 'Incubation models, venture funding stages (Pre-seed to Series C), cap table modeling, term sheet negotiation, and IPO exit strategies.',
        file_name: 'mba_sem4_entrepreneurship_venture.pdf',
        file_path: path.join(UPLOADS_DIR, 'mba_sem4_entrepreneurship_venture.pdf'),
        file_size: 2750000,
        download_count: 182,
        uploaded_by: 'Incubation Cell Lead',
        created_at: new Date('2026-03-16T15:30:00Z').toISOString()
      },
      {
        id: 302,
        title: 'Corporate Governance & ESG Compliance Reporting',
        subject: 'Business Ethics & ESG',
        course_code: 'MBA403',
        year: 'Year 2',
        semester: 'Semester 4',
        description: 'Board independence, audit committee oversight, sustainability reporting under BRSR and GRI, carbon accounting, and ethical leadership.',
        file_name: 'mba_sem4_esg_corporate_governance.pdf',
        file_path: path.join(UPLOADS_DIR, 'mba_sem4_esg_corporate_governance.pdf'),
        file_size: 2350000,
        download_count: 124,
        uploaded_by: 'MBA Department Admin',
        created_at: new Date('2026-03-18T10:00:00Z').toISOString()
      }
    ],
    assignments: [
      // Year 1, Sem 1
      {
        id: 101,
        title: 'Financial Statement Analysis & Ratio Modeling Project',
        subject: 'Financial Accounting',
        year: 'Year 1',
        semester: 'Semester 1',
        faculty: 'Prof. Accounting Coordinator',
        due_date: '2026-10-10',
        max_marks: 25,
        status: 'Open',
        description: 'Select an NSE/BSE listed company. Compute 3 years of liquidity, solvency, and profitability ratios. Draft a comparative performance review.',
        submission_info: 'Submit Excel workbook and PDF synthesis report via LMS.',
        created_at: new Date('2026-09-15T09:00:00Z').toISOString()
      },

      // Year 1, Sem 2
      {
        id: 1,
        title: 'Marketing Strategy Case Study: Omnichannel Retail Launch',
        subject: 'Marketing Management',
        year: 'Year 1',
        semester: 'Semester 2',
        faculty: 'Dr. Rajesh Nair',
        due_date: '2026-10-15',
        max_marks: 25,
        status: 'Open',
        description: 'Analyze the retail expansion case study provided. Prepare a 5-page report detailing the STP strategy, promotional budget allocation, and digital acquisition channels for an Indian consumer brand.',
        submission_info: 'Submit written PDF report through college portal or email to r.nair@collegenotes.edu by 11:59 PM.',
        created_at: new Date('2026-09-18T10:00:00Z').toISOString()
      },
      {
        id: 2,
        title: 'Corporate Valuation & DCF Financial Modeling Exercise',
        subject: 'Financial Management',
        year: 'Year 1',
        semester: 'Semester 2',
        faculty: 'Prof. Ananya Sen',
        due_date: '2026-10-20',
        max_marks: 30,
        status: 'Open',
        description: 'Construct a 5-year discounted cash flow (DCF) model in Excel for the sample manufacturing company dataset. Calculate WACC, Terminal Value, and sensitivity analysis under varying growth rates.',
        submission_info: 'Submit working .xlsx file and a 2-page executive summary by October 20th.',
        created_at: new Date('2026-09-20T11:00:00Z').toISOString()
      },
      {
        id: 3,
        title: 'Supply Chain Optimization & Warehouse Layout Simulation',
        subject: 'Operations & Supply Chain',
        year: 'Year 1',
        semester: 'Semester 2',
        faculty: 'Dr. Vikramaditya K.',
        due_date: '2026-10-25',
        max_marks: 20,
        status: 'Open',
        description: 'Formulate an EOQ inventory policy considering holding costs and stockout penalties. Present layout recommendations to minimize picking transit time by 15%.',
        submission_info: 'Group submission (max 3 students per team). Submit hardcopy and softcopy.',
        created_at: new Date('2026-09-21T14:30:00Z').toISOString()
      },
      {
        id: 4,
        title: 'HR Performance Appraisal Design & Retention Strategy',
        subject: 'Human Resource Management',
        year: 'Year 1',
        semester: 'Semester 2',
        faculty: 'Prof. Meera Deshmukh',
        due_date: '2026-10-08',
        max_marks: 25,
        status: 'Urgent',
        description: 'Design a modernized 360-degree performance appraisal framework for a tech enterprise experiencing 22% attrition. Detail non-monetary incentives and mentorship programs.',
        submission_info: 'Submit via LMS before midnight of October 8th.',
        created_at: new Date('2026-09-22T08:00:00Z').toISOString()
      },

      // Year 2, Sem 3
      {
        id: 201,
        title: 'Mergers & Acquisitions Valuation Report: Tech Conglomerate',
        subject: 'Financial Management',
        year: 'Year 2',
        semester: 'Semester 3',
        faculty: 'Prof. Ananya Sen',
        due_date: '2026-10-18',
        max_marks: 30,
        status: 'Open',
        description: 'Conduct a comprehensive takeover valuation including synergy estimates, exchange ratio computation, and EPS accretion/dilution analysis.',
        submission_info: 'Submit report and supporting Excel valuation model.',
        created_at: new Date('2026-09-22T10:00:00Z').toISOString()
      },

      // Year 2, Sem 4
      {
        id: 301,
        title: 'Venture Capital Pitch Deck & Term Sheet Simulation',
        subject: 'Entrepreneurship',
        year: 'Year 2',
        semester: 'Semester 4',
        faculty: 'Dr. S. Kulkarni',
        due_date: '2026-10-30',
        max_marks: 35,
        status: 'Open',
        description: 'Develop a 12-slide investor pitch deck for an innovative business model with financial projections, unit economics, and required funding ask.',
        submission_info: 'Present deck in pitch room and submit PDF.',
        created_at: new Date('2026-09-22T12:00:00Z').toISOString()
      }
    ],
    timetable: [
      // Year 1 - Semester 2
      { id: 1, year: 'Year 1', semester: 'Semester 2', day: 'Monday', time: '09:00 AM - 10:30 AM', subject: 'Marketing Management', course_code: 'MBA201', faculty: 'Dr. Rajesh Nair', room: 'Hall A-101' },
      { id: 2, year: 'Year 1', semester: 'Semester 2', day: 'Monday', time: '10:45 AM - 12:15 PM', subject: 'Financial Management', course_code: 'MBA202', faculty: 'Prof. Ananya Sen', room: 'Hall A-101' },
      { id: 3, year: 'Year 1', semester: 'Semester 2', day: 'Monday', time: '01:15 PM - 02:45 PM', subject: 'Operations & Supply Chain', course_code: 'MBA204', faculty: 'Dr. Vikramaditya K.', room: 'Hall B-204' },
      { id: 4, year: 'Year 1', semester: 'Semester 2', day: 'Monday', time: '03:00 PM - 04:30 PM', subject: 'Business Analytics Lab', course_code: 'MBA205', faculty: 'Prof. Amit Sharma', room: 'Computer Lab 3' },

      { id: 5, year: 'Year 1', semester: 'Semester 2', day: 'Tuesday', time: '09:00 AM - 10:30 AM', subject: 'Human Resource Management', course_code: 'MBA203', faculty: 'Prof. Meera Deshmukh', room: 'Hall A-101' },
      { id: 6, year: 'Year 1', semester: 'Semester 2', day: 'Tuesday', time: '10:45 AM - 12:15 PM', subject: 'Strategic Management', course_code: 'MBA206', faculty: 'Dr. Harish Varma', room: 'Hall A-101' },
      { id: 7, year: 'Year 1', semester: 'Semester 2', day: 'Tuesday', time: '01:15 PM - 02:45 PM', subject: 'Financial Management Tutorial', course_code: 'MBA202', faculty: 'Prof. Ananya Sen', room: 'Seminar Room 2' },
      { id: 8, year: 'Year 1', semester: 'Semester 2', day: 'Tuesday', time: '03:00 PM - 04:30 PM', subject: 'Guest Lecture / Industry Connect', course_code: 'MBA-IND', faculty: 'Visiting Executive', room: 'Auditorium' },

      { id: 9, year: 'Year 1', semester: 'Semester 2', day: 'Wednesday', time: '09:00 AM - 10:30 AM', subject: 'Operations & Supply Chain', course_code: 'MBA204', faculty: 'Dr. Vikramaditya K.', room: 'Hall B-204' },
      { id: 10, year: 'Year 1', semester: 'Semester 2', day: 'Wednesday', time: '10:45 AM - 12:15 PM', subject: 'Marketing Management', course_code: 'MBA201', faculty: 'Dr. Rajesh Nair', room: 'Hall A-101' },
      { id: 11, year: 'Year 1', semester: 'Semester 2', day: 'Wednesday', time: '01:15 PM - 02:45 PM', subject: 'Business Analytics', course_code: 'MBA205', faculty: 'Prof. Amit Sharma', room: 'Computer Lab 3' },
      { id: 12, year: 'Year 1', semester: 'Semester 2', day: 'Wednesday', time: '03:00 PM - 04:30 PM', subject: 'Entrepreneurship & Innovation', course_code: 'MBA207', faculty: 'Dr. S. Kulkarni', room: 'Incubation Cell' },

      { id: 13, year: 'Year 1', semester: 'Semester 2', day: 'Thursday', time: '09:00 AM - 10:30 AM', subject: 'Financial Management', course_code: 'MBA202', faculty: 'Prof. Ananya Sen', room: 'Hall A-101' },
      { id: 14, year: 'Year 1', semester: 'Semester 2', day: 'Thursday', time: '10:45 AM - 12:15 PM', subject: 'Human Resource Management', course_code: 'MBA203', faculty: 'Prof. Meera Deshmukh', room: 'Hall A-101' },
      { id: 15, year: 'Year 1', semester: 'Semester 2', day: 'Thursday', time: '01:15 PM - 02:45 PM', subject: 'Strategic Management', course_code: 'MBA206', faculty: 'Dr. Harish Varma', room: 'Hall B-204' },
      { id: 16, year: 'Year 1', semester: 'Semester 2', day: 'Thursday', time: '03:00 PM - 04:30 PM', subject: 'Case Study Presentation Session', course_code: 'MBA-CS', faculty: 'Faculty Panel', room: 'Hall A-101' },

      { id: 17, year: 'Year 1', semester: 'Semester 2', day: 'Friday', time: '09:00 AM - 10:30 AM', subject: 'Business Analytics & Modeling', course_code: 'MBA205', faculty: 'Prof. Amit Sharma', room: 'Computer Lab 3' },
      { id: 18, year: 'Year 1', semester: 'Semester 2', day: 'Friday', time: '10:45 AM - 12:15 PM', subject: 'Marketing Management Workshop', course_code: 'MBA201', faculty: 'Dr. Rajesh Nair', room: 'Hall A-101' },
      { id: 19, year: 'Year 1', semester: 'Semester 2', day: 'Friday', time: '01:15 PM - 02:45 PM', subject: 'Operations Simulation Lab', course_code: 'MBA204', faculty: 'Dr. Vikramaditya K.', room: 'Computer Lab 2' },
      { id: 20, year: 'Year 1', semester: 'Semester 2', day: 'Friday', time: '03:00 PM - 04:30 PM', subject: 'Mentorship & Placement Prep', course_code: 'MBA-CDC', faculty: 'Placement Cell', room: 'Auditorium' },

      { id: 21, year: 'Year 1', semester: 'Semester 2', day: 'Saturday', time: '09:30 AM - 11:30 AM', subject: 'Leadership & Business Ethics Seminar', course_code: 'MBA208', faculty: 'Prof. Meera Deshmukh', room: 'Conference Hall' },
      { id: 22, year: 'Year 1', semester: 'Semester 2', day: 'Saturday', time: '11:45 AM - 01:15 PM', subject: 'Live Project / Dissertation Review', course_code: 'MBA-PROJ', faculty: 'Faculty Guides', room: 'Seminar Rooms' },

      // Year 2 - Semester 3
      { id: 31, year: 'Year 2', semester: 'Semester 3', day: 'Monday', time: '09:00 AM - 10:30 AM', subject: 'Corporate Finance & M&A', course_code: 'MBA301', faculty: 'Prof. Ananya Sen', room: 'Hall C-301' },
      { id: 32, year: 'Year 2', semester: 'Semester 3', day: 'Monday', time: '10:45 AM - 12:15 PM', subject: 'Digital Marketing & Social Commerce', course_code: 'MBA302', faculty: 'Dr. Rajesh Nair', room: 'Hall C-301' },
      { id: 33, year: 'Year 2', semester: 'Semester 3', day: 'Monday', time: '01:15 PM - 02:45 PM', subject: 'Supply Chain Analytics', course_code: 'MBA303', faculty: 'Dr. Vikramaditya K.', room: 'Hall C-301' },

      // Year 2 - Semester 4
      { id: 41, year: 'Year 2', semester: 'Semester 4', day: 'Tuesday', time: '09:00 AM - 10:30 AM', subject: 'Entrepreneurship & Venture Capital', course_code: 'MBA401', faculty: 'Dr. S. Kulkarni', room: 'Incubation Hub' },
      { id: 42, year: 'Year 2', semester: 'Semester 4', day: 'Tuesday', time: '10:45 AM - 12:15 PM', subject: 'Corporate Governance & ESG', course_code: 'MBA403', faculty: 'Prof. Meera Deshmukh', room: 'Conference Room 2' }
    ],
    announcements: [
      {
        id: 1,
        title: 'Mid-Term Examination Schedule Announced (Semester 2 & 4)',
        category: 'Exam',
        priority: 'urgent',
        year: 'All Years',
        date: '2026-09-22',
        author: 'Controller of Examinations',
        content: 'Mid-term exams for all MBA Sem 2 and Sem 4 subjects will commence from October 28, 2026. Seating arrangements and hall tickets are available via the student portal.'
      },
      {
        id: 2,
        title: 'Summer Internship Placement Drive: Top Consulting & FMCG Firms',
        category: 'Placement',
        priority: 'urgent',
        year: 'Year 1',
        date: '2026-09-20',
        author: 'Corporate Relations & Placement Cell',
        content: 'Registration is now open for the MBA Summer Internship Season. Eligible students from 25MBA01 to 25MBA175 must ensure their resumes are verified before October 5th.'
      },
      {
        id: 3,
        title: 'Executive Masterclass: "Generative AI in Corporate Finance & Fintech"',
        category: 'Academic',
        priority: 'normal',
        year: 'All Years',
        date: '2026-09-19',
        author: 'Department of Management Studies',
        content: 'Join us this Tuesday at 3:00 PM in the Main Auditorium for an exclusive masterclass with VP of FinTech Strategy, Goldman Sachs.'
      },
      {
        id: 4,
        title: 'Year 2 Capstone Dissertation Guidelines & Faculty Allocations',
        category: 'Academic',
        priority: 'normal',
        year: 'Year 2',
        date: '2026-09-18',
        author: 'Research Committee',
        content: 'Final year MBA students must submit their dissertation synopses to designated faculty mentors by October 12, 2026.'
      }
    ],
    nextIds: {
      notes: 350,
      assignments: 350,
      timetable: 100,
      announcements: 10
    }
  };
}

let db = null;

function loadDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      db = JSON.parse(data);
      if (!db.admin) db.admin = { password: 'MBA Notes' };
      if (!db.students || db.students.length === 0) db.students = generateDefaultStudents();
      if (!db.notes) db.notes = [];
      if (!db.assignments) db.assignments = [];
      if (!db.timetable) db.timetable = [];
      if (!db.announcements) db.announcements = [];
      if (!db.nextIds) db.nextIds = { notes: 400, assignments: 400, timetable: 100, announcements: 50 };

      // Ensure every item has year and semester and defaults are present
      const defaults = getDefaultDatabase();
      for (const defStu of defaults.students) {
        if (!db.students.some(s => s.roll_number === defStu.roll_number)) {
          db.students.push(defStu);
        }
      }
      for (const defNote of defaults.notes) {
        if (!db.notes.some(n => n.id === defNote.id)) {
          db.notes.push(defNote);
        }
      }
      for (const defAssign of defaults.assignments) {
        if (!db.assignments.some(a => a.id === defAssign.id)) {
          db.assignments.push(defAssign);
        }
      }
      for (const defSlot of defaults.timetable) {
        if (!db.timetable.some(t => t.id === defSlot.id)) {
          db.timetable.push(defSlot);
        }
      }
      for (const defNotice of defaults.announcements) {
        if (!db.announcements.some(an => an.id === defNotice.id)) {
          db.announcements.push(defNotice);
        }
      }

      ensureYearAndSemester(db);
      saveDatabase();
      return db;
    }
  } catch (err) {
    console.error('Error reading database file, creating fresh default:', err);
  }

  db = getDefaultDatabase();
  saveDatabase();
  return db;
}

function ensureYearAndSemester(data) {
  for (const n of data.notes) {
    if (!n.year) {
      n.year = (n.semester === 'Semester 3' || n.semester === 'Semester 4') ? 'Year 2' : 'Year 1';
    }
    if (!n.semester) n.semester = 'Semester 2';
  }
  for (const a of data.assignments) {
    if (!a.year) {
      a.year = (a.semester === 'Semester 3' || a.semester === 'Semester 4') ? 'Year 2' : 'Year 1';
    }
    if (!a.semester) a.semester = 'Semester 2';
  }
  for (const t of data.timetable) {
    if (!t.year) {
      t.year = (t.semester === 'Semester 3' || t.semester === 'Semester 4') ? 'Year 2' : 'Year 1';
    }
    if (!t.semester) t.semester = 'Semester 2';
  }
  for (const s of data.students) {
    const clean = String(s.roll_number || '').trim().toUpperCase();
    if (clean.startsWith('25') || clean.includes('25MBA')) {
      s.year = 'Year 2';
      if (!s.semester || s.semester === 'Semester 1' || s.semester === 'Semester 2') s.semester = 'Semester 4';
      s.batch = '2025-2027';
      if (s.name && s.name.includes('(Y1)')) {
        s.name = s.name.replace('(Y1)', '(2nd Year)');
      }
    } else if (clean.startsWith('26') || clean.includes('26MBA')) {
      s.year = 'Year 1';
      if (!s.semester || s.semester === 'Semester 3' || s.semester === 'Semester 4') s.semester = 'Semester 2';
      s.batch = '2026-2028';
    } else if (clean.startsWith('24') || clean.includes('24MBA')) {
      s.year = 'Year 2';
      s.semester = 'Semester 4';
      s.batch = '2024-2026';
    } else {
      if (!s.year) s.year = 'Year 1';
      if (!s.semester) s.semester = 'Semester 2';
    }
  }
}

function saveDatabase() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving database file:', err);
  }
}

// Background sync initial data to Firebase Firestore
let isSeedingFirebase = false;
async function seedFirebaseFirestore() {
  if (isSeedingFirebase) return;
  isSeedingFirebase = true;
  console.log('[Firebase Firestore] Starting initial cloud sync...');

  try {
    const current = getDb();
    // Sync Notes
    for (const note of current.notes) {
      await syncDocToFirestore('notes', note.id, note);
    }
    // Sync Assignments
    for (const assign of current.assignments) {
      await syncDocToFirestore('assignments', assign.id, assign);
    }
    // Sync Timetable
    for (const slot of current.timetable) {
      await syncDocToFirestore('timetable', slot.id, slot);
    }
    // Sync Announcements
    for (const notice of current.announcements) {
      await syncDocToFirestore('announcements', notice.id, notice);
    }
    // Sync Students (sample first 25 to avoid rate limit, rest synced on demand)
    for (const student of current.students.slice(0, 30)) {
      await syncDocToFirestore('students', student.roll_number, student);
    }
    // Sync Admin Config
    await syncDocToFirestore('admin_config', 'auth', { password: 'MBA Notes' });

    console.log('[Firebase Firestore] Cloud database synchronization completed successfully!');
  } catch (err) {
    console.warn('[Firebase Firestore] Initial sync note:', err.message);
  } finally {
    isSeedingFirebase = false;
  }
}

// Initialize database
loadDatabase();

// Trigger cloud sync
setTimeout(seedFirebaseFirestore, 1500);

module.exports = {
  getDb: () => db || loadDatabase(),
  saveDb: saveDatabase,
  seedFirebaseFirestore,
  generateDefaultStudents,
  getYearAndSemesterFromRoll,
  normalizeStudentRoll,
  findOrRegisterStudent,
  UPLOADS_DIR,
  DATA_DIR
};

