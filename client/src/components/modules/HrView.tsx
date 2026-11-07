import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { Employee } from '../../types/erp';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { formatEgp } from '../../utils/formatters';
import { useLanguage } from '../../context/LanguageContext';
import {
  Users,
  Plus,
} from 'lucide-react';

export const HrView: React.FC = () => {
  const { language, t } = useLanguage();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Employee Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    nationalId: '',
    firstNameAr: '',
    lastNameAr: '',
    jobTitleAr: '',
    departmentId: '',
    shift: 'MORNING',
    hourlyRateEgp: 75,
    phone: '',
  });

  useEffect(() => {
    fetchHrData();
  }, []);

  const fetchHrData = async () => {
    try {
      setLoading(true);
      const [empRes, deptRes] = await Promise.all([
        apiRequest<{ employees: Employee[] }>('/hr/employees'),
        apiRequest<{ departments: any[] }>('/hr/departments'),
      ]);
      setEmployees(empRes.employees);
      setDepartments(deptRes.departments);
      if (deptRes.departments.length > 0) {
        setForm((prev) => ({ ...prev, departmentId: deptRes.departments[0].id }));
      }
    } catch (e) {
      console.error('Failed to load HR data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/hr/employees', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setIsModalOpen(false);
      alert(language === 'ar' ? '✅ تم إضافة الموظف/الفني بنجاح!' : '✅ Employee added successfully!');
      fetchHrData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">
              {language === 'ar' ? 'الموارد البشرية وفنيو خطوط الإنتاج والورديات' : 'HR, Production Workforce & Shifts'}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
              Labor Tracking
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'ar'
              ? 'إدارة سجلات المهندسين والفنيين، الورديات، ومعدل أجر الساعة لاحتساب تكلفة العمالة المباشرة'
              : 'Workforce records, national IDs, shift allocation, and direct labor hourly rates.'}
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>{language === 'ar' ? 'إضافة فني / موظف جديد' : 'Add Employee / Operator'}</span>
        </button>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold">
                <th className="py-3 px-4 text-start">{language === 'ar' ? 'كود الموظف' : 'Emp #'}</th>
                <th className="py-3 px-4 text-start">{language === 'ar' ? 'الاسم الكامل' : 'Full Name'}</th>
                <th className="py-3 px-4 text-start">{language === 'ar' ? 'المسمى الوظيفي' : 'Job Title'}</th>
                <th className="py-3 px-4 text-start">{language === 'ar' ? 'الرقم القومي المصري' : 'National ID'}</th>
                <th className="py-3 px-4 text-start">{language === 'ar' ? 'الإدارة / القسم' : 'Department'}</th>
                <th className="py-3 px-4 text-center">{language === 'ar' ? 'الوردية' : 'Shift'}</th>
                <th className="py-3 px-4 text-end">{language === 'ar' ? 'أجر الساعة (ج.م)' : 'Hourly Rate'}</th>
                <th className="py-3 px-4 text-center">{t.status}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{emp.code}</td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">
                      {language === 'en'
                        ? `${emp.firstNameEn || emp.firstNameAr} ${emp.lastNameEn || emp.lastNameAr}`
                        : `${emp.firstNameAr} ${emp.lastNameAr}`}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {language === 'en'
                        ? (emp.firstNameAr ? `${emp.firstNameAr} ${emp.lastNameAr}` : '')
                        : `${emp.firstNameEn} ${emp.lastNameEn}`}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800">
                    {language === 'en' ? (emp.jobTitleEn || emp.jobTitleAr) : emp.jobTitleAr}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-700">{emp.nationalId || '-'}</td>
                  <td className="py-3.5 px-4 text-slate-600">
                    {language === 'en' ? (emp.department?.nameEn || emp.department?.nameAr) : emp.department?.nameAr}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-800">
                      {emp.shift === 'MORNING'
                        ? (language === 'ar' ? 'وردية صباحية' : 'Morning Shift')
                        : emp.shift === 'EVENING'
                        ? (language === 'ar' ? 'وردية مسائية' : 'Evening Shift')
                        : (language === 'ar' ? 'وردية ليلية' : 'Night Shift')}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-end font-mono font-bold text-emerald-800">
                    {formatEgp(emp.hourlyRateEgp, language)}{language === 'ar' ? '/ساعة' : '/hr'}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <Badge status={emp.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: ADD EMPLOYEE */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={language === 'ar' ? 'إضافة فني تشغيل أو مهندس جديد' : 'Add Employee / Production Operator'}
        subtitle={language === 'ar' ? 'تسجيل الرقم القومي ومعدل الأجر لاحتساب تكلفة الأوامر' : 'National ID and hourly cost rate'}
      >
        <form onSubmit={handleCreateEmployee} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'ar' ? 'الاسم الأول *' : 'First Name *'}
              </label>
              <input
                type="text"
                required
                value={form.firstNameAr}
                onChange={(e) => setForm({ ...form, firstNameAr: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'ar' ? 'اسم العائلة *' : 'Last Name *'}
              </label>
              <input
                type="text"
                required
                value={form.lastNameAr}
                onChange={(e) => setForm({ ...form, lastNameAr: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'ar' ? 'الرقم القومي المصري (14 رقم)' : 'Egyptian National ID (14 digits)'}
              </label>
              <input
                type="text"
                value={form.nationalId}
                onChange={(e) => setForm({ ...form, nationalId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="29000000000000"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'ar' ? 'المسمى الوظيفي *' : 'Job Title *'}
              </label>
              <input
                type="text"
                required
                value={form.jobTitleAr}
                onChange={(e) => setForm({ ...form, jobTitleAr: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder={language === 'ar' ? 'فني قص ليزر CNC / لحام معتمد' : 'e.g. CNC Laser Operator / Welder'}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'ar' ? 'الإدارة / القسم *' : 'Department *'}
              </label>
              <select
                value={form.departmentId}
                onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {language === 'en' ? (d.nameEn || d.nameAr) : d.nameAr}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'ar' ? 'الوردية' : 'Shift'}
              </label>
              <select
                value={form.shift}
                onChange={(e) => setForm({ ...form, shift: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
              >
                <option value="MORNING">
                  {language === 'ar' ? 'صباحية (8 ص - 4 م)' : 'Morning (8am - 4pm)'}
                </option>
                <option value="EVENING">
                  {language === 'ar' ? 'مسائية (4 م - 12 ص)' : 'Evening (4pm - 12am)'}
                </option>
                <option value="NIGHT">
                  {language === 'ar' ? 'ليلية (12 ص - 8 ص)' : 'Night (12am - 8am)'}
                </option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'ar' ? 'أجر الساعة (ج.م)' : 'Hourly Rate (EGP)'}
              </label>
              <input
                type="number"
                value={form.hourlyRateEgp}
                onChange={(e) => setForm({ ...form, hourlyRateEgp: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm"
            >
              {t.save}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
