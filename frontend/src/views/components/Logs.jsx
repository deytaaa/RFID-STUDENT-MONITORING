import React, { useState } from 'react';
import AccessLogs from '../pages/AccessLogs';
import ExitLogs from '../pages/ExitLogs';
import './Logs.css';

const Logs = ({ user }) => {
  const [activeTab, setActiveTab] = useState('entry');

  return (
    <div className="logs-tabs-container">
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
      <div className="logs-tabs-content">
        {activeTab === 'entry' ? <AccessLogs user={user} /> : <ExitLogs user={user} />}
      </div>
    </div>
  );
};

export default Logs;
