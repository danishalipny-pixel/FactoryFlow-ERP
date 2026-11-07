import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { Navbar } from './components/common/Navbar';
import { Sidebar, ActiveTab } from './components/common/Sidebar';
import { DashboardView } from './components/modules/DashboardView';
import { SalesView } from './components/modules/SalesView';
import { EngineeringView } from './components/modules/EngineeringView';
import { ProductionView } from './components/modules/ProductionView';
import { InventoryView } from './components/modules/InventoryView';
import { ProcurementView } from './components/modules/ProcurementView';
import { FinanceView } from './components/modules/FinanceView';
import { QualityView } from './components/modules/QualityView';
import { HrView } from './components/modules/HrView';
import { ReportsView } from './components/modules/ReportsView';
import { AiAssistantView } from './components/modules/AiAssistantView';
import { SettingsView } from './components/modules/SettingsView';

const MainLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab') as ActiveTab;
    const validTabs: ActiveTab[] = [
      'dashboard',
      'sales',
      'engineering',
      'production',
      'inventory',
      'procurement',
      'finance',
      'quality',
      'workforce',
      'reports',
      'ai',
      'settings',
    ];
    if (validTabs.includes(tabParam)) return tabParam;
    return 'dashboard';
  });
  const { isRtl } = useLanguage();
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <h2 className="text-lg font-bold">FACTORYFLOW ERP</h2>
          <p className="text-xs text-slate-400">تهيئة النظام الصناعي للعاشر من رمضان...</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView onNavigate={(tab) => setActiveTab(tab as ActiveTab)} />;
      case 'sales':
        return <SalesView />;
      case 'engineering':
        return <EngineeringView />;
      case 'production':
        return <ProductionView />;
      case 'inventory':
        return <InventoryView />;
      case 'procurement':
        return <ProcurementView />;
      case 'finance':
        return <FinanceView />;
      case 'quality':
        return <QualityView />;
      case 'workforce':
        return <HrView />;
      case 'reports':
        return <ReportsView />;
      case 'ai':
        return <AiAssistantView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView onNavigate={(tab) => setActiveTab(tab as ActiveTab)} />;
    }
  };

  return (
    <div className={`min-h-screen bg-slate-50 flex ${isRtl ? 'font-sans' : 'font-sans'}`}>
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar />
        <main className="flex-1 p-6 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <MainLayout />
      </AuthProvider>
    </LanguageProvider>
  );
}
