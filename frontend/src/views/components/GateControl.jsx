import React, { useState } from 'react';
import ApiService from '../../services/ApiService.js';
import './GateControl.css';

const GateControl = () => {
  const [gateStatus, setGateStatus] = useState({ entry: 'closed', exit: 'closed' });
  const [error, setError] = useState(null);

  const handleGate = async (gate, action) => {
    setError(null);
    try {
      const result = await ApiService.post('/system/gate', { action, gate });
      if (result.success) {
        setGateStatus(prev => ({ ...prev, [gate]: action === 'open' ? 'opened' : 'closed' }));
      } else {
        setGateStatus(prev => ({ ...prev, [gate]: 'error' }));
        setError('Gate control failed');
      }
    } catch {
      setGateStatus(prev => ({ ...prev, [gate]: 'error' }));
      setError('Gate control failed');
    }
  };

  return (
    <div className="gate-control-page">
      <h2 style={{ marginBottom: 32, fontSize: '2rem', fontWeight: 700, textAlign: 'center' }}>Gate Control</h2>
      <div className="gate-control-cards">
        {/* Entry Gate Control */}
        <div className="card modern-card">
          <div className="card-header-modern">
            <h3 className="card-title-modern">Entry Gate</h3>
          </div>
          <div className="gate-btn-group">
            <button
              className="btn btn-success gate-btn-text"
              disabled={gateStatus.entry === 'opened'}
              onClick={() => handleGate('entry', 'open')}
            ><span className="gate-btn-label">{gateStatus.entry === 'opened' ? 'Opened' : 'Open Gate'}</span></button>
            <button
              className="btn btn-danger gate-btn-text"
              disabled={gateStatus.entry === 'closed'}
              onClick={() => handleGate('entry', 'close')}
            ><span className="gate-btn-label">{gateStatus.entry === 'closed' ? 'Closed' : 'Close Gate'}</span></button>
          </div>
        </div>
        {/* Exit Gate Control */}
        <div className="card modern-card">
          <div className="card-header-modern">
            <h3 className="card-title-modern">Exit Gate</h3>
          </div>
          <div className="gate-btn-group">
            <button
              className="btn btn-success gate-btn-text"
              disabled={gateStatus.exit === 'opened'}
              onClick={() => handleGate('exit', 'open')}
            ><span className="gate-btn-label">{gateStatus.exit === 'opened' ? 'Opened' : 'Open Gate'}</span></button>
            <button
              className="btn btn-danger gate-btn-text"
              disabled={gateStatus.exit === 'closed'}
              onClick={() => handleGate('exit', 'close')}
            ><span className="gate-btn-label">{gateStatus.exit === 'closed' ? 'Closed' : 'Close Gate'}</span></button>
          </div>
        </div>
      </div>
      <div style={{ textAlign: 'center', marginTop: '18px', fontWeight: 'bold', fontSize: '1.1rem' }}>
        {(gateStatus.entry === 'error' || gateStatus.exit === 'error') && <span style={{ color: '#f59e0b' }}>{error || 'Gate control failed'}</span>}
      </div>
    </div>
  );
};

export default GateControl;
