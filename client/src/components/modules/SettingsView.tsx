import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import {
  Building,
  CheckCircle2,
  FileCheck2,
  CreditCard,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { language } = useLanguage();

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-slate-900">
            {language === 'ar'
              ? 'إعدادات المصنع والامتثال الضريبي المصري'
              : 'Factory Profile & Egyptian Tax Localization'}
          </h2>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
            Egypt ETA Ready
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          {language === 'ar'
            ? 'تكوين ضريبة القيمة المضافة (14%)، ضريبة الخصم (1%)، وبيانات الربط مع منظومة الفاتورة الإلكترونية بمصلحة الضرائب المصرية'
            : 'Configuration for Egyptian VAT (14%), Withholding Tax (1%), and ETA E-Invoicing v1.0 architecture parameters.'}
        </p>
      </div>

      {/* Egyptian Factory Identification Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Building className="w-5 h-5 text-emerald-600" />
          <h3 className="font-bold text-slate-900 text-sm">
            {language === 'ar' ? 'بيانات المنشأة الصناعية المسجلة' : 'Registered Industrial Facility Profile'}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="text-slate-500 font-semibold block mb-1">
              {language === 'ar' ? 'الاسم القانوني للشركة' : 'Legal Entity Name'}
            </label>
            <p className="font-bold text-slate-900 text-sm">
              {language === 'ar'
                ? 'شركة الأهرام للصناعات الهندسية والمعدنية ش.م.م'
                : 'Al-Ahram Engineering & Metal Industries S.A.E.'}
            </p>
            <p className="text-slate-500 text-[11px]">
              {language === 'ar'
                ? 'Al-Ahram Engineering & Metal Industries S.A.E.'
                : 'شركة الأهرام للصناعات الهندسية والمعدنية ش.م.م'}
            </p>
          </div>
          <div>
            <label className="text-slate-500 font-semibold block mb-1">
              {language === 'ar' ? 'الموقع والمجمع الصناعي' : 'Industrial Complex Location'}
            </label>
            <p className="font-bold text-slate-900">
              {language === 'ar'
                ? 'المنطقة الصناعية الثالثة B4، العاشر من رمضان، الشرقية'
                : '3rd Industrial Zone B4, 10th of Ramadan City, Sharkia Governorate, Egypt'}
            </p>
          </div>
          <div>
            <label className="text-slate-500 font-semibold block mb-1">
              {language === 'ar' ? 'رقم التسجيل الضريبي (البطاقة الضريبية)' : 'Egyptian Tax Registration Number (TRN)'}
            </label>
            <p className="font-mono font-bold text-slate-900 text-sm">100-245-892</p>
          </div>
          <div>
            <label className="text-slate-500 font-semibold block mb-1">
              {language === 'ar' ? 'رقم السجل التجاري' : 'Commercial Registration (CR)'}
            </label>
            <p className="font-mono font-bold text-slate-900 text-sm">
              45892 - {language === 'ar' ? 'جنوب الجيزة' : 'South Giza Chamber of Commerce'}
            </p>
          </div>
        </div>
      </div>

      {/* Egyptian Tax Settings Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <CreditCard className="w-5 h-5 text-emerald-600" />
          <h3 className="font-bold text-slate-900 text-sm">
            {language === 'ar' ? 'السياسات والنسب الضريبية المعمول بها' : 'Applicable Egyptian Statutory Tax Policies'}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 font-semibold block">
              {language === 'ar' ? 'ضريبة القيمة المضافة العامة (VAT T1)' : 'Standard Value Added Tax (VAT T1)'}
            </span>
            <p className="text-2xl font-bold text-slate-900 mt-2 font-mono">14.0%</p>
            <span className="text-[11px] text-emerald-700 font-semibold mt-1 block">
              {language === 'ar' ? 'مطبقة تلقائياً على كافة الفواتير' : 'Automatically applied across sales & procurement'}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 font-semibold block">
              {language === 'ar' ? 'ضريبة الخصم والإضافة (WHT T4)' : 'Withholding Tax (WHT T4)'}
            </span>
            <p className="text-2xl font-bold text-slate-900 mt-2 font-mono">1.0%</p>
            <span className="text-[11px] text-slate-600 font-semibold mt-1 block">
              {language === 'ar' ? 'توريدات المصنوعات والخدمات الهندسية' : 'Manufactured goods & engineering supply'}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 font-semibold block">
              {language === 'ar' ? 'العملة الرسمية والمنطقة الزمنية' : 'Currency & Timezone'}
            </span>
            <p className="text-lg font-bold text-slate-900 mt-2 font-mono">EGP (ج.م)</p>
            <span className="text-[11px] text-slate-600 font-semibold mt-1 block">Africa/Cairo (UTC+2)</span>
          </div>
        </div>
      </div>

      {/* ETA E-Invoicing Readiness Checklist */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <FileCheck2 className="w-5 h-5 text-emerald-600" />
          <h3 className="font-bold text-slate-900 text-sm">
            {language === 'ar'
              ? 'جاهزية الربط مع منظومة مصلحة الضرائب المصرية (ETA)'
              : 'Egyptian Tax Authority (ETA) E-Invoicing Compliance Checklist'}
          </h3>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 text-emerald-950 border border-emerald-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold">
                {language === 'ar'
                  ? 'هيكل الوثيقة متوافق مع إصدار Document Type Version 1.0'
                  : 'Document Type Version 1.0 Structure Compliant'}
              </p>
              <p className="text-[11px] text-emerald-800">
                {language === 'ar'
                  ? 'ترميز بيانات المصدر (Issuer) والمستلم (Receiver) مع العنوان الوطني التفصيلي وأكواد الضرائب.'
                  : 'Full schema formatting for Issuer, Receiver, detailed Egyptian postal address, and tax subtotals.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 text-emerald-950 border border-emerald-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold">
                {language === 'ar'
                  ? 'نظام تكويد البنود والسلع المصرية (EGS / GS1)'
                  : 'Egyptian Goods & Services Coding Standard (EGS / GS1)'}
              </p>
              <p className="text-[11px] text-emerald-800">
                {language === 'ar'
                  ? 'توليد أكواد السلع المعتمدة EG-100245892-ItemCode لكافة المنتجات التامة والخامات.'
                  : 'Automatic prefixing of EG-100245892-ItemCode for all custom manufactured assemblies and materials.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 text-emerald-950 border border-emerald-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold">
                {language === 'ar'
                  ? 'معرف فريد رقمي مشفر (Unique UUID)'
                  : 'Cryptographic Document UUID & Digital E-Seal Ready'}
              </p>
              <p className="text-[11px] text-emerald-800">
                {language === 'ar'
                  ? 'توليد UUID قياسي لكل فاتورة مبيعات مؤكدة وجاهزة للتوقيع الإلكتروني بمفتاح HSM / Token.'
                  : 'Standardized UUID payload generated per confirmed order invoice, prepared for USB token / HSM e-seal signing.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
