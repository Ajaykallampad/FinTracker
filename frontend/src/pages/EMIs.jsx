import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';

const EMIs = () => {
    const [emis, setEmis] = useState([]);
    const [expanded, setExpanded] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const res = await api.get('emis/');
        setEmis(res.data.results || res.data);
    };

    const handlePay = async (instId) => {
        if (!confirm('Mark installment as PAID?')) return;
        await api.patch(`installments/${instId}/`, {
            status: 'PAID',
            paid_date: new Date().toISOString().split('T')[0]
        });
        fetchData();
    };

    return (
        <div>
            <h2>EMI Tracker</h2>
            <div style={{ display: 'grid', gap: '1.5rem' }}>
                {emis.map(emi => (
                    <div key={emi.id} className="glass-panel" style={{ padding: '1.5rem' }}>
                        <div
                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                            onClick={() => setExpanded(expanded === emi.id ? null : emi.id)}
                        >
                            <div>
                                <h3 style={{ margin: 0 }}>{emi.title}</h3>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                                    {emi.total_months} Months • ${emi.monthly_amount}/mo
                                </div>
                            </div>
                            <div style={{ textAlign: 'right', minWidth: '150px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.8rem' }}>
                                    <span>Progress</span>
                                    <span>{emi.progress}%</span>
                                </div>
                                <div style={{ height: '8px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${emi.progress}%`, background: 'var(--success)' }}></div>
                                </div>
                            </div>
                            {expanded === emi.id ? <ChevronUp /> : <ChevronDown />}
                        </div>

                        {expanded === emi.id && (
                            <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--bg-tertiary)', paddingTop: '1rem' }}>
                                <h4>Installment Schedule</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
                                    {emi.installments.map(inst => (
                                        <div key={inst.id} style={{
                                            padding: '0.8rem',
                                            background: inst.status === 'PAID' ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-secondary)',
                                            border: inst.status === 'PAID' ? '1px solid var(--success)' : '1px solid var(--bg-tertiary)',
                                            borderRadius: '8px',
                                            opacity: inst.status === 'PAID' ? 0.6 : 1
                                        }}>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Due: {inst.due_date}</div>
                                            <div style={{ fontWeight: 'bold', margin: '0.3rem 0' }}>${inst.amount}</div>
                                            {inst.status === 'PAID' ? (
                                                <div style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem' }}>
                                                    <CheckCircle size={14} /> Paid
                                                </div>
                                            ) : (
                                                <button onClick={(e) => { e.stopPropagation(); handlePay(inst.id); }} style={payBtnStyle}>
                                                    Pay Now
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

const payBtnStyle = {
    width: '100%',
    padding: '0.4rem',
    background: 'var(--primary)',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.8rem'
};

export default EMIs;
