/* eslint-disable no-console */
const {
  PrismaClient,
  Role,
  UserStatus,
  EmploymentType,
  Currency,
  Language,
  TimeLogStatus,
  LeaveType,
  LeaveStatus,
  TransactionType,
  TransactionStatus,
  QueueJobStatus,
  InvoiceStatus,
  RecruitmentStage,
  PerformanceReviewStatus,
  AssetStatus,
} = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const { hash } = require('bcryptjs');
const fs = require('fs');
const path = require('path');

function loadEnvFileIfPresent(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const eqIndex = line.indexOf('=');
    if (eqIndex <= 0) {
      continue;
    }

    const key = line.slice(0, eqIndex).trim();
    let value = line.slice(eqIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnvFileIfPresent(path.resolve(__dirname, '../.env'));
loadEnvFileIfPresent(path.resolve(__dirname, '../../.env'));

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    'DATABASE_URL is not set. Please define it before running the seed script.',
  );
}

const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const ids = {
  organization: 'seed_org_flowforce',

  departments: {
    hr: 'seed_dept_hr',
    eng: 'seed_dept_eng',
    ops: 'seed_dept_ops',
    fin: 'seed_dept_fin',
  },

  designations: {
    hrManager: 'seed_des_hr_manager',
    engManager: 'seed_des_eng_manager',
    softwareEngineer: 'seed_des_software_engineer',
    intern: 'seed_des_intern',
  },

  locations: {
    hq: 'seed_loc_hq',
    remote: 'seed_loc_remote',
  },

  shifts: {
    general: 'seed_shift_general',
  },

  users: {
    superAdmin: 'seed_user_super_admin',
    admin: 'seed_user_admin',
    hr: 'seed_user_hr',
    manager: 'seed_user_manager',
    employeeA: 'seed_user_employee_a',
    employeeB: 'seed_user_employee_b',
    intern: 'seed_user_intern',
  },

  assignments: {
    manager: 'seed_assignment_manager',
    employeeA: 'seed_assignment_employee_a',
    employeeB: 'seed_assignment_employee_b',
    intern: 'seed_assignment_intern',
  },

  wallets: {
    employeeA: 'seed_wallet_employee_a',
    employeeB: 'seed_wallet_employee_b',
  },

  transactions: {
    salaryA: 'seed_tx_salary_a',
    salaryB: 'seed_tx_salary_b',
    expenseA: 'seed_tx_expense_a',
  },

  timelogs: {
    a1: 'seed_timelog_a1',
    a2: 'seed_timelog_a2',
    a3: 'seed_timelog_a3',
    b1: 'seed_timelog_b1',
    b2: 'seed_timelog_b2',
    i1: 'seed_timelog_i1',
  },

  leaves: {
    pending: 'seed_leave_pending',
    approved: 'seed_leave_approved',
    rejected: 'seed_leave_rejected',
  },

  holidays: {
    foundersDay: 'seed_holiday_founders_day',
  },

  invoices: {
    aprilA: 'seed_invoice_april_a',
  },

  queueJobs: {
    pending: 'seed_job_pending',
    completed: 'seed_job_completed',
  },

  templates: {
    emailLeaveApproved: 'seed_email_tpl_leave_approved',
    emailLeaveRejected: 'seed_email_tpl_leave_rejected',
    invoiceDefault: 'seed_invoice_tpl_default',
  },

  candidate: 'seed_candidate_akash',
  review: 'seed_review_employee_a',
  asset: 'seed_asset_laptop_001',
};

function dayOffset(offset, hour = 9, minute = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  date.setHours(hour, minute, 0, 0);
  return date;
}

async function seedOrganization() {
  return prisma.organization.upsert({
    where: { id: ids.organization },
    update: {
      name: 'FlowForce Demo Org',
      country: 'India',
      currency: Currency.INR,
      timezone: 'Asia/Kolkata',
      baseHourlyRate: 650,
      overtimeMultiplier: 1.5,
    },
    create: {
      id: ids.organization,
      name: 'FlowForce Demo Org',
      country: 'India',
      currency: Currency.INR,
      timezone: 'Asia/Kolkata',
      baseHourlyRate: 650,
      overtimeMultiplier: 1.5,
    },
  });
}

async function seedDepartments() {
  await prisma.department.upsert({
    where: { id: ids.departments.hr },
    update: {
      name: 'Human Resources',
      code: 'FF-HR',
      organizationId: ids.organization,
    },
    create: {
      id: ids.departments.hr,
      name: 'Human Resources',
      code: 'FF-HR',
      organizationId: ids.organization,
    },
  });

  await prisma.department.upsert({
    where: { id: ids.departments.eng },
    update: {
      name: 'Engineering',
      code: 'FF-ENG',
      organizationId: ids.organization,
    },
    create: {
      id: ids.departments.eng,
      name: 'Engineering',
      code: 'FF-ENG',
      organizationId: ids.organization,
    },
  });

  await prisma.department.upsert({
    where: { id: ids.departments.ops },
    update: {
      name: 'Operations',
      code: 'FF-OPS',
      organizationId: ids.organization,
    },
    create: {
      id: ids.departments.ops,
      name: 'Operations',
      code: 'FF-OPS',
      organizationId: ids.organization,
    },
  });

  await prisma.department.upsert({
    where: { id: ids.departments.fin },
    update: {
      name: 'Finance',
      code: 'FF-FIN',
      organizationId: ids.organization,
    },
    create: {
      id: ids.departments.fin,
      name: 'Finance',
      code: 'FF-FIN',
      organizationId: ids.organization,
    },
  });
}

async function seedDesignations() {
  await prisma.designation.upsert({
    where: { id: ids.designations.hrManager },
    update: {
      name: 'HR Manager',
      code: 'DES-HRM',
      organizationId: ids.organization,
    },
    create: {
      id: ids.designations.hrManager,
      name: 'HR Manager',
      code: 'DES-HRM',
      organizationId: ids.organization,
    },
  });

  await prisma.designation.upsert({
    where: { id: ids.designations.engManager },
    update: {
      name: 'Engineering Manager',
      code: 'DES-EM',
      organizationId: ids.organization,
    },
    create: {
      id: ids.designations.engManager,
      name: 'Engineering Manager',
      code: 'DES-EM',
      organizationId: ids.organization,
    },
  });

  await prisma.designation.upsert({
    where: { id: ids.designations.softwareEngineer },
    update: {
      name: 'Software Engineer',
      code: 'DES-SE',
      organizationId: ids.organization,
    },
    create: {
      id: ids.designations.softwareEngineer,
      name: 'Software Engineer',
      code: 'DES-SE',
      organizationId: ids.organization,
    },
  });

  await prisma.designation.upsert({
    where: { id: ids.designations.intern },
    update: {
      name: 'Intern',
      code: 'DES-INT',
      organizationId: ids.organization,
    },
    create: {
      id: ids.designations.intern,
      name: 'Intern',
      code: 'DES-INT',
      organizationId: ids.organization,
    },
  });
}

async function seedLocations() {
  await prisma.location.upsert({
    where: { id: ids.locations.hq },
    update: {
      name: 'Bengaluru HQ',
      city: 'Bengaluru',
      country: 'India',
      timezone: 'Asia/Kolkata',
      isRemote: false,
      organizationId: ids.organization,
    },
    create: {
      id: ids.locations.hq,
      name: 'Bengaluru HQ',
      city: 'Bengaluru',
      country: 'India',
      timezone: 'Asia/Kolkata',
      isRemote: false,
      organizationId: ids.organization,
    },
  });

  await prisma.location.upsert({
    where: { id: ids.locations.remote },
    update: {
      name: 'Remote India',
      city: 'Remote',
      country: 'India',
      timezone: 'Asia/Kolkata',
      isRemote: true,
      organizationId: ids.organization,
    },
    create: {
      id: ids.locations.remote,
      name: 'Remote India',
      city: 'Remote',
      country: 'India',
      timezone: 'Asia/Kolkata',
      isRemote: true,
      organizationId: ids.organization,
    },
  });
}

async function seedShift() {
  await prisma.shift.upsert({
    where: { id: ids.shifts.general },
    update: {
      name: 'General Shift',
      startTime: '09:30',
      endTime: '18:30',
      graceTimeMinutes: 15,
      breakDurationMinutes: 60,
      isActive: true,
      organizationId: ids.organization,
    },
    create: {
      id: ids.shifts.general,
      name: 'General Shift',
      startTime: '09:30',
      endTime: '18:30',
      graceTimeMinutes: 15,
      breakDurationMinutes: 60,
      isActive: true,
      organizationId: ids.organization,
    },
  });
}

async function seedUsers(passwordHash) {
  const users = [
    {
      id: ids.users.superAdmin,
      email: 'superadmin@flowforce.dev',
      role: Role.SUPER_ADMIN,
      firstName: 'Super',
      lastName: 'Admin',
      employeeId: 'FF-0001',
      departmentId: ids.departments.hr,
      designationId: ids.designations.hrManager,
      locationId: ids.locations.hq,
      managerId: null,
      employmentType: EmploymentType.FULL_TIME,
      preferredLanguage: Language.en,
      preferredCurrency: Currency.INR,
      joiningDate: dayOffset(-400, 10, 0),
    },
    {
      id: ids.users.admin,
      email: 'admin@flowforce.dev',
      role: Role.ADMIN,
      firstName: 'Aarav',
      lastName: 'Sharma',
      employeeId: 'FF-0002',
      departmentId: ids.departments.ops,
      designationId: ids.designations.hrManager,
      locationId: ids.locations.hq,
      managerId: ids.users.superAdmin,
      employmentType: EmploymentType.FULL_TIME,
      preferredLanguage: Language.en,
      preferredCurrency: Currency.INR,
      joiningDate: dayOffset(-330, 10, 0),
    },
    {
      id: ids.users.hr,
      email: 'hr@flowforce.dev',
      role: Role.HR_MANAGER,
      firstName: 'Neha',
      lastName: 'Gupta',
      employeeId: 'FF-0003',
      departmentId: ids.departments.hr,
      designationId: ids.designations.hrManager,
      locationId: ids.locations.hq,
      managerId: ids.users.admin,
      employmentType: EmploymentType.FULL_TIME,
      preferredLanguage: Language.en,
      preferredCurrency: Currency.INR,
      joiningDate: dayOffset(-270, 10, 0),
    },
    {
      id: ids.users.manager,
      email: 'manager@flowforce.dev',
      role: Role.MANAGER,
      firstName: 'Priya',
      lastName: 'Nair',
      employeeId: 'FF-0004',
      departmentId: ids.departments.eng,
      designationId: ids.designations.engManager,
      locationId: ids.locations.hq,
      managerId: ids.users.admin,
      employmentType: EmploymentType.FULL_TIME,
      preferredLanguage: Language.en,
      preferredCurrency: Currency.INR,
      joiningDate: dayOffset(-250, 10, 0),
    },
    {
      id: ids.users.employeeA,
      email: 'employee.a@flowforce.dev',
      role: Role.EMPLOYEE,
      firstName: 'Rahul',
      lastName: 'Verma',
      employeeId: 'FF-0005',
      departmentId: ids.departments.eng,
      designationId: ids.designations.softwareEngineer,
      locationId: ids.locations.remote,
      managerId: ids.users.manager,
      employmentType: EmploymentType.FULL_TIME,
      preferredLanguage: Language.en,
      preferredCurrency: Currency.INR,
      joiningDate: dayOffset(-180, 10, 0),
    },
    {
      id: ids.users.employeeB,
      email: 'employee.b@flowforce.dev',
      role: Role.EMPLOYEE,
      firstName: 'Ananya',
      lastName: 'Rao',
      employeeId: 'FF-0006',
      departmentId: ids.departments.fin,
      designationId: ids.designations.softwareEngineer,
      locationId: ids.locations.hq,
      managerId: ids.users.manager,
      employmentType: EmploymentType.FULL_TIME,
      preferredLanguage: Language.en,
      preferredCurrency: Currency.INR,
      joiningDate: dayOffset(-140, 10, 0),
    },
    {
      id: ids.users.intern,
      email: 'intern@flowforce.dev',
      role: Role.INTERN,
      firstName: 'Kunal',
      lastName: 'Singh',
      employeeId: 'FF-0007',
      departmentId: ids.departments.eng,
      designationId: ids.designations.intern,
      locationId: ids.locations.remote,
      managerId: ids.users.manager,
      employmentType: EmploymentType.INTERN,
      preferredLanguage: Language.en,
      preferredCurrency: Currency.INR,
      joiningDate: dayOffset(-60, 10, 0),
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: {
        email: user.email,
        password: passwordHash,
        role: user.role,
        status: UserStatus.ACTIVE,
        firstName: user.firstName,
        lastName: user.lastName,
        employeeId: user.employeeId,
        organizationId: ids.organization,
        departmentId: user.departmentId,
        designationId: user.designationId,
        locationId: user.locationId,
        managerId: user.managerId,
        employmentType: user.employmentType,
        preferredLanguage: user.preferredLanguage,
        preferredCurrency: user.preferredCurrency,
        joiningDate: user.joiningDate,
      },
      create: {
        id: user.id,
        email: user.email,
        password: passwordHash,
        role: user.role,
        status: UserStatus.ACTIVE,
        firstName: user.firstName,
        lastName: user.lastName,
        employeeId: user.employeeId,
        organizationId: ids.organization,
        departmentId: user.departmentId,
        designationId: user.designationId,
        locationId: user.locationId,
        managerId: user.managerId,
        employmentType: user.employmentType,
        preferredLanguage: user.preferredLanguage,
        preferredCurrency: user.preferredCurrency,
        joiningDate: user.joiningDate,
      },
    });
  }
}

async function seedShiftAssignments() {
  const assignmentRows = [
    { id: ids.assignments.manager, userId: ids.users.manager },
    { id: ids.assignments.employeeA, userId: ids.users.employeeA },
    { id: ids.assignments.employeeB, userId: ids.users.employeeB },
    { id: ids.assignments.intern, userId: ids.users.intern },
  ];

  for (const row of assignmentRows) {
    await prisma.shiftAssignment.upsert({
      where: { id: row.id },
      update: {
        userId: row.userId,
        shiftId: ids.shifts.general,
        effectiveFrom: dayOffset(-90, 0, 0),
        effectiveUntil: null,
        isActive: true,
      },
      create: {
        id: row.id,
        userId: row.userId,
        shiftId: ids.shifts.general,
        effectiveFrom: dayOffset(-90, 0, 0),
        effectiveUntil: null,
        isActive: true,
      },
    });
  }
}

async function seedWalletsAndTransactions() {
  await prisma.wallet.upsert({
    where: { userId: ids.users.employeeA },
    update: {
      id: ids.wallets.employeeA,
      balance: 74250,
      currency: Currency.INR,
      totalEarned: 82000,
      totalWithdrawn: 7750,
      isActive: true,
    },
    create: {
      id: ids.wallets.employeeA,
      userId: ids.users.employeeA,
      balance: 74250,
      currency: Currency.INR,
      totalEarned: 82000,
      totalWithdrawn: 7750,
      isActive: true,
    },
  });

  await prisma.wallet.upsert({
    where: { userId: ids.users.employeeB },
    update: {
      id: ids.wallets.employeeB,
      balance: 69300,
      currency: Currency.INR,
      totalEarned: 75000,
      totalWithdrawn: 5700,
      isActive: true,
    },
    create: {
      id: ids.wallets.employeeB,
      userId: ids.users.employeeB,
      balance: 69300,
      currency: Currency.INR,
      totalEarned: 75000,
      totalWithdrawn: 5700,
      isActive: true,
    },
  });

  await prisma.walletTransaction.upsert({
    where: { id: ids.transactions.salaryA },
    update: {
      walletId: ids.wallets.employeeA,
      amount: 82000,
      currency: Currency.INR,
      type: TransactionType.CREDIT,
      status: TransactionStatus.COMPLETED,
      description: 'Monthly payroll credit',
      processedAt: dayOffset(-2, 18, 0),
    },
    create: {
      id: ids.transactions.salaryA,
      walletId: ids.wallets.employeeA,
      amount: 82000,
      currency: Currency.INR,
      type: TransactionType.CREDIT,
      status: TransactionStatus.COMPLETED,
      description: 'Monthly payroll credit',
      processedAt: dayOffset(-2, 18, 0),
    },
  });

  await prisma.walletTransaction.upsert({
    where: { id: ids.transactions.salaryB },
    update: {
      walletId: ids.wallets.employeeB,
      amount: 75000,
      currency: Currency.INR,
      type: TransactionType.CREDIT,
      status: TransactionStatus.COMPLETED,
      description: 'Monthly payroll credit',
      processedAt: dayOffset(-2, 18, 10),
    },
    create: {
      id: ids.transactions.salaryB,
      walletId: ids.wallets.employeeB,
      amount: 75000,
      currency: Currency.INR,
      type: TransactionType.CREDIT,
      status: TransactionStatus.COMPLETED,
      description: 'Monthly payroll credit',
      processedAt: dayOffset(-2, 18, 10),
    },
  });

  await prisma.walletTransaction.upsert({
    where: { id: ids.transactions.expenseA },
    update: {
      walletId: ids.wallets.employeeA,
      amount: 7750,
      currency: Currency.INR,
      type: TransactionType.DEBIT,
      status: TransactionStatus.COMPLETED,
      description: 'Expense reimbursement payout',
      processedAt: dayOffset(-1, 12, 30),
    },
    create: {
      id: ids.transactions.expenseA,
      walletId: ids.wallets.employeeA,
      amount: 7750,
      currency: Currency.INR,
      type: TransactionType.DEBIT,
      status: TransactionStatus.COMPLETED,
      description: 'Expense reimbursement payout',
      processedAt: dayOffset(-1, 12, 30),
    },
  });
}

async function seedInvoiceAndTimelogs() {
  await prisma.invoice.upsert({
    where: { id: ids.invoices.aprilA },
    update: {
      invoiceNumber: 'FF-INV-2026-04-0001',
      userId: ids.users.employeeA,
      month: 4,
      year: 2026,
      totalHours: 164,
      overtimeHours: 8,
      basicAmount: 73800,
      overtimeAmount: 5400,
      grossAmount: 79200,
      currency: Currency.INR,
      templateKey: 'default-invoice',
      renderedHtml:
        '<h1>FlowForce Invoice</h1><p>Generated for demo preview in seeded environment.</p>',
      status: InvoiceStatus.PAID,
      paymentReference: 'PAY-DEMO-2026-04-0001',
      paidAt: dayOffset(-2, 18, 5),
    },
    create: {
      id: ids.invoices.aprilA,
      invoiceNumber: 'FF-INV-2026-04-0001',
      userId: ids.users.employeeA,
      month: 4,
      year: 2026,
      totalHours: 164,
      overtimeHours: 8,
      basicAmount: 73800,
      overtimeAmount: 5400,
      grossAmount: 79200,
      currency: Currency.INR,
      templateKey: 'default-invoice',
      renderedHtml:
        '<h1>FlowForce Invoice</h1><p>Generated for demo preview in seeded environment.</p>',
      status: InvoiceStatus.PAID,
      paymentReference: 'PAY-DEMO-2026-04-0001',
      paidAt: dayOffset(-2, 18, 5),
    },
  });

  const timelogRows = [
    {
      id: ids.timelogs.a1,
      userId: ids.users.employeeA,
      shiftAssignmentId: ids.assignments.employeeA,
      clockIn: dayOffset(-4, 9, 35),
      clockOut: dayOffset(-4, 18, 45),
      totalHours: 8.8,
      overtimeHours: 0.8,
      status: TimeLogStatus.APPROVED,
      notes: 'Completed sprint integration tasks',
      invoiceId: ids.invoices.aprilA,
    },
    {
      id: ids.timelogs.a2,
      userId: ids.users.employeeA,
      shiftAssignmentId: ids.assignments.employeeA,
      clockIn: dayOffset(-3, 9, 28),
      clockOut: dayOffset(-3, 18, 32),
      totalHours: 8.5,
      overtimeHours: 0.5,
      status: TimeLogStatus.INVOICED,
      notes: 'Code review and production support',
      invoiceId: ids.invoices.aprilA,
    },
    {
      id: ids.timelogs.a3,
      userId: ids.users.employeeA,
      shiftAssignmentId: ids.assignments.employeeA,
      clockIn: dayOffset(0, 9, 42),
      clockOut: null,
      totalHours: null,
      overtimeHours: 0,
      status: TimeLogStatus.PENDING_APPROVAL,
      notes: 'Working on dashboard enhancements',
      invoiceId: null,
    },
    {
      id: ids.timelogs.b1,
      userId: ids.users.employeeB,
      shiftAssignmentId: ids.assignments.employeeB,
      clockIn: dayOffset(-4, 9, 30),
      clockOut: dayOffset(-4, 18, 15),
      totalHours: 8.25,
      overtimeHours: 0.25,
      status: TimeLogStatus.APPROVED,
      notes: 'Monthly close activities',
      invoiceId: null,
    },
    {
      id: ids.timelogs.b2,
      userId: ids.users.employeeB,
      shiftAssignmentId: ids.assignments.employeeB,
      clockIn: dayOffset(-2, 10, 10),
      clockOut: dayOffset(-2, 15, 0),
      totalHours: 4.5,
      overtimeHours: 0,
      status: TimeLogStatus.REJECTED,
      notes: 'Rejected due to missing timesheet details',
      invoiceId: null,
    },
    {
      id: ids.timelogs.i1,
      userId: ids.users.intern,
      shiftAssignmentId: ids.assignments.intern,
      clockIn: dayOffset(-1, 10, 0),
      clockOut: dayOffset(-1, 17, 0),
      totalHours: 6.5,
      overtimeHours: 0,
      status: TimeLogStatus.PENDING_APPROVAL,
      notes: 'Research and documentation support',
      invoiceId: null,
    },
  ];

  for (const row of timelogRows) {
    await prisma.timeLog.upsert({
      where: { id: row.id },
      update: row,
      create: row,
    });
  }
}

async function seedLeaves() {
  const leaveRows = [
    {
      id: ids.leaves.pending,
      userId: ids.users.employeeB,
      leaveType: LeaveType.CASUAL,
      startDate: dayOffset(3, 0, 0),
      endDate: dayOffset(4, 0, 0),
      totalDays: 2,
      reason: 'Family event',
      status: LeaveStatus.PENDING,
      appliedToId: ids.users.manager,
      approvedById: null,
      approvedAt: null,
      rejectionReason: null,
      isHalfDay: false,
    },
    {
      id: ids.leaves.approved,
      userId: ids.users.employeeA,
      leaveType: LeaveType.EARNED,
      startDate: dayOffset(-12, 0, 0),
      endDate: dayOffset(-10, 0, 0),
      totalDays: 3,
      reason: 'Planned vacation',
      status: LeaveStatus.APPROVED,
      appliedToId: ids.users.manager,
      approvedById: ids.users.manager,
      approvedAt: dayOffset(-13, 19, 0),
      rejectionReason: null,
      isHalfDay: false,
    },
    {
      id: ids.leaves.rejected,
      userId: ids.users.intern,
      leaveType: LeaveType.SICK,
      startDate: dayOffset(-6, 0, 0),
      endDate: dayOffset(-6, 0, 0),
      totalDays: 1,
      reason: 'Medical appointment',
      status: LeaveStatus.REJECTED,
      appliedToId: ids.users.manager,
      approvedById: ids.users.manager,
      approvedAt: dayOffset(-7, 17, 15),
      rejectionReason: 'Please attach medical certificate for paid sick leave.',
      isHalfDay: false,
    },
  ];

  for (const leave of leaveRows) {
    await prisma.leave.upsert({
      where: { id: leave.id },
      update: leave,
      create: leave,
    });
  }
}

async function seedTemplatesAndHoliday() {
  await prisma.emailTemplate.upsert({
    where: {
      organizationId_key: {
        organizationId: ids.organization,
        key: 'leave-approved',
      },
    },
    update: {
      id: ids.templates.emailLeaveApproved,
      name: 'Leave Approved',
      subject: 'Your leave request was approved',
      body: 'Hi {{firstName}}, your leave request from {{startDate}} to {{endDate}} is approved.',
      variables: ['firstName', 'startDate', 'endDate'],
      isActive: true,
    },
    create: {
      id: ids.templates.emailLeaveApproved,
      organizationId: ids.organization,
      key: 'leave-approved',
      name: 'Leave Approved',
      subject: 'Your leave request was approved',
      body: 'Hi {{firstName}}, your leave request from {{startDate}} to {{endDate}} is approved.',
      variables: ['firstName', 'startDate', 'endDate'],
      isActive: true,
    },
  });

  await prisma.emailTemplate.upsert({
    where: {
      organizationId_key: {
        organizationId: ids.organization,
        key: 'leave-rejected',
      },
    },
    update: {
      id: ids.templates.emailLeaveRejected,
      name: 'Leave Rejected',
      subject: 'Your leave request was rejected',
      body: 'Hi {{firstName}}, your leave request was rejected. Reason: {{reason}}.',
      variables: ['firstName', 'reason'],
      isActive: true,
    },
    create: {
      id: ids.templates.emailLeaveRejected,
      organizationId: ids.organization,
      key: 'leave-rejected',
      name: 'Leave Rejected',
      subject: 'Your leave request was rejected',
      body: 'Hi {{firstName}}, your leave request was rejected. Reason: {{reason}}.',
      variables: ['firstName', 'reason'],
      isActive: true,
    },
  });

  await prisma.invoiceTemplate.upsert({
    where: {
      organizationId_key: {
        organizationId: ids.organization,
        key: 'default-invoice',
      },
    },
    update: {
      id: ids.templates.invoiceDefault,
      name: 'Default Invoice Template',
      bodyHtml:
        '<section><h1>Payroll Invoice</h1><p><strong>Employee:</strong> {{employeeName}}</p><p><strong>Gross:</strong> {{grossAmount}}</p></section>',
      headerHtml: '<header><h2>FlowForce Demo Org</h2></header>',
      footerHtml: '<footer><p>Auto-generated by FlowForce</p></footer>',
      css: 'body { font-family: Arial, sans-serif; } h1 { margin-bottom: 8px; }',
      variables: ['employeeName', 'grossAmount'],
      isDefault: true,
      isActive: true,
    },
    create: {
      id: ids.templates.invoiceDefault,
      organizationId: ids.organization,
      key: 'default-invoice',
      name: 'Default Invoice Template',
      bodyHtml:
        '<section><h1>Payroll Invoice</h1><p><strong>Employee:</strong> {{employeeName}}</p><p><strong>Gross:</strong> {{grossAmount}}</p></section>',
      headerHtml: '<header><h2>FlowForce Demo Org</h2></header>',
      footerHtml: '<footer><p>Auto-generated by FlowForce</p></footer>',
      css: 'body { font-family: Arial, sans-serif; } h1 { margin-bottom: 8px; }',
      variables: ['employeeName', 'grossAmount'],
      isDefault: true,
      isActive: true,
    },
  });

  await prisma.holiday.upsert({
    where: { id: ids.holidays.foundersDay },
    update: {
      organizationId: ids.organization,
      name: 'Founders Day',
      date: new Date('2026-04-18T00:00:00.000Z'),
      country: 'India',
      isOptional: false,
    },
    create: {
      id: ids.holidays.foundersDay,
      organizationId: ids.organization,
      name: 'Founders Day',
      date: new Date('2026-04-18T00:00:00.000Z'),
      country: 'India',
      isOptional: false,
    },
  });
}

async function seedRecruitmentPerformanceAsset() {
  await prisma.recruitmentCandidate.upsert({
    where: {
      organizationId_email: {
        organizationId: ids.organization,
        email: 'akash.kumar@example.com',
      },
    },
    update: {
      id: ids.candidate,
      fullName: 'Akash Kumar',
      phone: '+91-9000000001',
      source: 'LinkedIn',
      totalExperienceYears: 3.5,
      expectedSalary: 1200000,
      expectedCurrency: Currency.INR,
      stage: RecruitmentStage.INTERVIEW,
      score: 82.5,
      scoreBreakdown: { communication: 80, coding: 85, domain: 82 },
      notes: 'Strong backend fundamentals, good communication.',
      lastScoredAt: dayOffset(-1, 14, 0),
    },
    create: {
      id: ids.candidate,
      organizationId: ids.organization,
      fullName: 'Akash Kumar',
      email: 'akash.kumar@example.com',
      phone: '+91-9000000001',
      source: 'LinkedIn',
      totalExperienceYears: 3.5,
      expectedSalary: 1200000,
      expectedCurrency: Currency.INR,
      stage: RecruitmentStage.INTERVIEW,
      score: 82.5,
      scoreBreakdown: { communication: 80, coding: 85, domain: 82 },
      notes: 'Strong backend fundamentals, good communication.',
      lastScoredAt: dayOffset(-1, 14, 0),
    },
  });

  await prisma.performanceReview.upsert({
    where: {
      organizationId_userId_cycleMonth_cycleYear: {
        organizationId: ids.organization,
        userId: ids.users.employeeA,
        cycleMonth: 3,
        cycleYear: 2026,
      },
    },
    update: {
      id: ids.review,
      reviewerId: ids.users.manager,
      score: 4.2,
      status: PerformanceReviewStatus.FINALIZED,
      summary: 'Consistent performer with strong ownership.',
      strengths: 'Problem solving, collaboration, reliability',
      improvements: 'Presentation skills, cross-team visibility',
      goals: ['Lead one sprint planning', 'Mentor an intern'],
      generatedByJob: 'performance.cycle.generate',
    },
    create: {
      id: ids.review,
      organizationId: ids.organization,
      userId: ids.users.employeeA,
      reviewerId: ids.users.manager,
      cycleMonth: 3,
      cycleYear: 2026,
      score: 4.2,
      status: PerformanceReviewStatus.FINALIZED,
      summary: 'Consistent performer with strong ownership.',
      strengths: 'Problem solving, collaboration, reliability',
      improvements: 'Presentation skills, cross-team visibility',
      goals: ['Lead one sprint planning', 'Mentor an intern'],
      generatedByJob: 'performance.cycle.generate',
    },
  });

  await prisma.asset.upsert({
    where: {
      organizationId_assetCode: {
        organizationId: ids.organization,
        assetCode: 'ASSET-LT-001',
      },
    },
    update: {
      id: ids.asset,
      name: 'MacBook Pro 14',
      category: 'Laptop',
      status: AssetStatus.ASSIGNED,
      assignedToUserId: ids.users.employeeA,
      purchaseDate: new Date('2025-07-01T00:00:00.000Z'),
      purchaseCost: 190000,
      salvageValue: 25000,
      usefulLifeMonths: 36,
      accumulatedDepreciation: 42000,
      netBookValue: 148000,
      lastDepreciationAt: dayOffset(-5, 2, 0),
      notes: 'Assigned to engineering team demo user.',
    },
    create: {
      id: ids.asset,
      organizationId: ids.organization,
      assetCode: 'ASSET-LT-001',
      name: 'MacBook Pro 14',
      category: 'Laptop',
      status: AssetStatus.ASSIGNED,
      assignedToUserId: ids.users.employeeA,
      purchaseDate: new Date('2025-07-01T00:00:00.000Z'),
      purchaseCost: 190000,
      salvageValue: 25000,
      usefulLifeMonths: 36,
      accumulatedDepreciation: 42000,
      netBookValue: 148000,
      lastDepreciationAt: dayOffset(-5, 2, 0),
      notes: 'Assigned to engineering team demo user.',
    },
  });
}

async function seedQueueJobs() {
  await prisma.queueJob.upsert({
    where: { id: ids.queueJobs.pending },
    update: {
      type: 'notification.send',
      payload: {
        userId: ids.users.employeeB,
        title: 'Leave approval pending',
        message: 'Your leave request is waiting for manager action.',
      },
      status: QueueJobStatus.PENDING,
      attempts: 0,
      maxAttempts: 3,
      availableAt: dayOffset(0, 10, 0),
      lockedAt: null,
      lockedBy: null,
      lastError: null,
      processedAt: null,
    },
    create: {
      id: ids.queueJobs.pending,
      type: 'notification.send',
      payload: {
        userId: ids.users.employeeB,
        title: 'Leave approval pending',
        message: 'Your leave request is waiting for manager action.',
      },
      status: QueueJobStatus.PENDING,
      attempts: 0,
      maxAttempts: 3,
      availableAt: dayOffset(0, 10, 0),
    },
  });

  await prisma.queueJob.upsert({
    where: { id: ids.queueJobs.completed },
    update: {
      type: 'payroll.generate-cycle',
      payload: {
        organizationId: ids.organization,
        month: 4,
        year: 2026,
      },
      status: QueueJobStatus.COMPLETED,
      attempts: 1,
      maxAttempts: 3,
      availableAt: dayOffset(-2, 9, 0),
      lockedAt: dayOffset(-2, 9, 1),
      lockedBy: 'seed-worker',
      lastError: null,
      processedAt: dayOffset(-2, 9, 3),
    },
    create: {
      id: ids.queueJobs.completed,
      type: 'payroll.generate-cycle',
      payload: {
        organizationId: ids.organization,
        month: 4,
        year: 2026,
      },
      status: QueueJobStatus.COMPLETED,
      attempts: 1,
      maxAttempts: 3,
      availableAt: dayOffset(-2, 9, 0),
      lockedAt: dayOffset(-2, 9, 1),
      lockedBy: 'seed-worker',
      processedAt: dayOffset(-2, 9, 3),
    },
  });
}

async function main() {
  console.log('Seeding demo data...');

  const passwordHash = await hash('Demo@12345', 10);

  await seedOrganization();
  await seedDepartments();
  await seedDesignations();
  await seedLocations();
  await seedShift();
  await seedUsers(passwordHash);
  await seedShiftAssignments();
  await seedWalletsAndTransactions();
  await seedTemplatesAndHoliday();
  await seedRecruitmentPerformanceAsset();
  await seedInvoiceAndTimelogs();
  await seedLeaves();
  await seedQueueJobs();

  console.log('Seed completed successfully.');
  console.log('Demo login credentials:');
  console.log('  admin@flowforce.dev / Demo@12345');
  console.log('  hr@flowforce.dev / Demo@12345');
  console.log('  manager@flowforce.dev / Demo@12345');
  console.log('  employee.a@flowforce.dev / Demo@12345');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
