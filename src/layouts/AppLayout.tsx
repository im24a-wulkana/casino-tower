import React, { useState } from 'react';
import { Header } from '../components/HeaderNew';
import { Sidebar } from '../components/SidebarNew';
import { RightPanel } from '../components/RightPanel';
import { LiveBetsTicker } from '../components/LiveBetsTicker';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);

  return (
    <div className="app-shell">
      <div className="app-shell-header">
        <Header onSidebarToggle={() => setSidebarOpen(o => !o)} />
      </div>
      <div className="app-shell-body">
        <div className={`app-shell-sidebar ${sidebarOpen ? 'expanded' : 'collapsed'}`}>
          <Sidebar isOpen={sidebarOpen} />
        </div>
        <div className="app-shell-content">
          <div className="app-shell-main">
            {children}
          </div>
        </div>
        <div className={`app-shell-right-panel ${!rightPanelOpen ? 'closed' : ''}`}>
          <RightPanel onClose={() => setRightPanelOpen(false)} />
        </div>
      </div>
      <div className="app-shell-ticker">
        <LiveBetsTicker />
      </div>
    </div>
  );
}
