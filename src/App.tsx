import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { Sidebar, NavigationTab } from './components/layout/Sidebar.js';
import { Navbar } from './components/layout/Navbar.js';
import { LoginPage } from './pages/LoginPage.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { PipelinePage } from './pages/PipelinePage.js';
import { CustomersPage } from './pages/CustomersPage.js';
import { ProductsPage } from './pages/ProductsPage.js';
import { SalesPage } from './pages/SalesPage.js';
import { UsersPage } from './pages/UsersPage.js';
import { NextContactsPage } from './pages/NextContactsPage.js';
import { CommissionsPage } from './pages/CommissionsPage.js';

function MainLayout() {
  const { user, loading, isAdmin, isViewer } = useAuth();
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // If viewer logs in or changes, ensure tab is dashboard
  useEffect(() => {
    if (isViewer) {
      setActiveTab('dashboard');
    }
  }, [isViewer]);

  // If not admin and on users tab, redirect to dashboard
  useEffect(() => {
    if (!isAdmin && activeTab === 'users') {
      setActiveTab('dashboard');
    }
  }, [isAdmin, activeTab]);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleQuickAction = (type: 'deal' | 'customer' | 'sale' | 'product') => {
    if (isViewer) return;
    switch (type) {
      case 'deal':
        setActiveTab('pipeline');
        break;
      case 'customer':
        setActiveTab('customers');
        break;
      case 'sale':
        setActiveTab('sales');
        break;
      case 'product':
        setActiveTab('products');
        break;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-brand-500 border-r-transparent"></div>
          <p className="mt-4 text-sm text-slate-400 font-medium">Iniciando sistema CRM...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 overflow-x-hidden">
      {/* Sidebar Navigation (Desktop static + Mobile Drawer) */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setIsMobileNavOpen(false);
        }}
        isMobileOpen={isMobileNavOpen}
        onMobileClose={() => setIsMobileNavOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          activeTab={activeTab}
          onQuickAction={handleQuickAction}
          onRefresh={handleRefresh}
          onOpenMobileNav={() => setIsMobileNavOpen(true)}
        />

        <main className="flex-1 p-3 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardPage key={refreshKey} onNavigate={(tab) => setActiveTab(tab)} />
          )}
          {!isViewer && activeTab === 'pipeline' && <PipelinePage key={refreshKey} />}
          {!isViewer && activeTab === 'customers' && <CustomersPage key={refreshKey} />}
          {!isViewer && activeTab === 'products' && <ProductsPage key={refreshKey} />}
          {!isViewer && activeTab === 'sales' && <SalesPage key={refreshKey} />}
          {isAdmin && activeTab === 'users' && <UsersPage key={refreshKey} />}
          {!isViewer && activeTab === 'next-contacts' && <NextContactsPage key={refreshKey} />}
          {!isViewer && activeTab === 'commissions' && <CommissionsPage key={refreshKey} />}
        </main>
      </div>
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}

export default App;
