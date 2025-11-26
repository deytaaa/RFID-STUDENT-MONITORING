import React, { useState } from 'react';
import AccessLogs from '../pages/AccessLogs';
import ExitLogs from '../pages/ExitLogs';
import { Download } from 'lucide-react';
import './Logs.css';

const Logs = ({ user }) => {
  const [activeTab, setActiveTab] = useState('entry');
  const [exportPDFHandler, setExportPDFHandler] = useState(null);

  return (
    <div className="logs-tabs-container">
      <div className="logs-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="logs-tabs-header">
          <button
            className={`logs-tab-btn${activeTab === 'entry' ? ' active' : ''}`}
            onClick={() => setActiveTab('entry')}
          >
            Entry Logs
          </button>
          <button
            className={`logs-tab-btn${activeTab === 'exit' ? ' active' : ''}`}
            onClick={() => setActiveTab('exit')}
          >
            Exit Logs
          </button>
        </div>
        {(user && (user.role === 'superadmin' || user.accessLevel === 'superadmin')) && exportPDFHandler && (
          <button className="btn btn-primary" onClick={exportPDFHandler}>
            <Download size={16} /> Export PDF
          </button>
        )}
      </div>
      <div className="logs-tabs-content">
        {activeTab === 'entry' ? (
          <AccessLogs user={user} setExportPDFHandler={setExportPDFHandler} />
        ) : (
          <ExitLogs user={user} setExportPDFHandler={setExportPDFHandler} />
        )}
      </div>
    </div>
  );
};

export default Logs;
