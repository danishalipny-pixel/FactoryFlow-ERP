import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';
import { authenticateToken, requireRoles } from '../middleware/auth';
import { logAudit } from '../middleware/audit';

const router = Router();

// Employees list
router.get('/employees', authenticateToken, async (req: Request, res: Response) => {
  try {
    const employees = await prisma.employee.findMany({
      include: {
        department: true,
        _count: {
          select: { assignedOperations: true, attendances: true, inspections: true },
        },
      },
      orderBy: { code: 'asc' },
    });
    return res.json({ employees });
  } catch (error) {
    return res.status(500).json({ error: 'فشل استرجاع قائمة الموظفين' });
  }
});

// Create Employee
router.post('/employees', authenticateToken, requireRoles(['SUPER_ADMIN', 'HR_MANAGER', 'FACTORY_OWNER']), async (req: Request, res: Response) => {
  try {
    const { nationalId, firstNameAr, lastNameAr, firstNameEn, lastNameEn, jobTitleAr, jobTitleEn, departmentId, shift, hourlyRateEgp, phone } = req.body;

    if (!firstNameAr || !lastNameAr || !jobTitleAr || !departmentId) {
      return res.status(400).json({ error: 'الاسم والمسمى الوظيفي والقسم مطلوبان' });
    }

    const count = await prisma.employee.count();
    const code = `EMP-${String(count + 1).padStart(4, '0')}`;

    const emp = await prisma.employee.create({
      data: {
        code,
        nationalId,
        firstNameAr,
        lastNameAr,
        firstNameEn: firstNameEn || firstNameAr,
        lastNameEn: lastNameEn || lastNameAr,
        jobTitleAr,
        jobTitleEn: jobTitleEn || jobTitleAr,
        departmentId,
        shift: shift || 'MORNING',
        hourlyRateEgp: Number(hourlyRateEgp) || 65.0,
        phone,
      },
      include: { department: true },
    });

    await logAudit(req, 'CREATE', 'Employee', emp.id, `إضافة موظف/فني جديد: ${firstNameAr} ${lastNameAr}`);
    return res.status(201).json({ employee: emp });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'فشل حفظ بيانات الموظف' });
  }
});

// Departments list
router.get('/departments', authenticateToken, async (req: Request, res: Response) => {
  try {
    const departments = await prisma.department.findMany({
      include: {
        _count: { select: { employees: true, workCenters: true } },
      },
      orderBy: { code: 'asc' },
    });
    return res.json({ departments });
  } catch (error) {
    return res.status(500).json({ error: 'فشل استرجاع الأقسام' });
  }
});

// Attendance summary
router.get('/attendance', authenticateToken, async (req: Request, res: Response) => {
  try {
    const attendance = await prisma.attendance.findMany({
      include: { employee: true },
      orderBy: { date: 'desc' },
      take: 50,
    });
    return res.json({ attendance });
  } catch (error) {
    return res.status(500).json({ error: 'فشل استرجاع سجل الحضور' });
  }
});

// Record Attendance
router.post('/attendance', authenticateToken, requireRoles(['SUPER_ADMIN', 'HR_MANAGER', 'PRODUCTION_MANAGER']), async (req: Request, res: Response) => {
  try {
    const { employeeId, date, hoursWorked, status } = req.body;
    if (!employeeId) {
      return res.status(400).json({ error: 'كود الموظف مطلوب' });
    }

    const record = await prisma.attendance.create({
      data: {
        employeeId,
        date: date ? new Date(date) : new Date(),
        hoursWorked: Number(hoursWorked) || 8.0,
        status: status || 'PRESENT',
      },
      include: { employee: true },
    });

    await logAudit(req, 'CREATE', 'Attendance', record.id, `تسجيل حضور الموظف ${record.employee.firstNameAr} ${record.employee.lastNameAr}`);
    return res.status(201).json({ attendance: record });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'فشل تسجيل الحضور' });
  }
});

// Direct Labor Payroll Summary
router.get('/payroll-summary', authenticateToken, async (req: Request, res: Response) => {
  try {
    const employees = await prisma.employee.findMany({
      include: {
        attendances: true,
        assignedOperations: { where: { status: 'COMPLETED' } },
        department: true,
      },
    });

    const summary = employees.map((emp) => {
      const totalShiftHours = emp.attendances.reduce((acc, att) => acc + att.hoursWorked, 0);
      const totalJobHours = emp.assignedOperations.reduce((acc, op) => acc + op.actualHours, 0);
      const grossDirectLaborEgp = totalJobHours * emp.hourlyRateEgp;

      return {
        employeeId: emp.id,
        code: emp.code,
        nameAr: `${emp.firstNameAr} ${emp.lastNameAr}`,
        nameEn: `${emp.firstNameEn} ${emp.lastNameEn}`,
        jobTitleAr: emp.jobTitleAr,
        department: emp.department.nameAr,
        hourlyRateEgp: emp.hourlyRateEgp,
        totalShiftHours,
        totalJobHours,
        grossDirectLaborEgp,
      };
    });

    return res.json({ payrollSummary: summary });
  } catch (error) {
    return res.status(500).json({ error: 'فشل استخراج مسير الأجور' });
  }
});

export default router;
