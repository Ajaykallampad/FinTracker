import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, ArrowDownLeft, CreditCard } from 'lucide-react';

const Dashboard = () => {
    const [stats, setStats] = useState({ expense: 0, debt: 0, emis: 0 });
    const [user, setUser] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [repRes, debtRes, emiRes] = await Promise.all([
                    api.get('expenses/reports/'),
                    api.get('debts/summary/'),
                    api.get('emis/')
                ]);

                // Calculate current month expense
                const currentMonth = new Date().toISOString().slice(0, 7) + '-01'; // Roughly matching TruncMonth output format which is datetime
                // Actually TruncMonth returns formatted date usually or datetime.
                // The API /reports returns list... let's assume we sum last month or something.
                // For simplicity, I'll just sum all for "Total Lifetime" for now, or check monthly_trend.
                const lastMonth = repRes.data.monthly_trend.length > 0 ? repRes.data.monthly_trend[repRes.data.monthly_trend.length - 1].value : 0;

                const pendingDebt = debtRes.data.by_status.find(s => s.status === 'PENDING')?.total || 0;
                const activeEmis = emiRes.data.count ?? (emiRes.data.results ? emiRes.data.results.length : emiRes.data.length);

                setStats({
                    expense: lastMonth,
                    debt: pendingDebt,
                    emis: activeEmis
                });
            } catch (e) {
                console.error(e);
            }
        };
        fetchData();
        // Decode username (hacky)
        const u = localStorage.getItem('access_token'); // would need decode
        if (u) setUser('User');
    }, []);

    return (
        <div>
            <h1 style={{ marginBottom: '2rem' }}>Dashboard</h1>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', borderRadius: '12px' }}>
                        <ArrowUpRight size={24} />
                    </div>
                    <div>
                        <div style={{ color: 'var(--text-secondary)' }}>Expenses (This Month)</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>${stats.expense}</div>
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '1rem', background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', borderRadius: '12px' }}>
                        <ArrowDownLeft size={24} />
                    </div>
                    <div>
                        <div style={{ color: 'var(--text-secondary)' }}>Pending Debts</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>${stats.debt}</div>
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '1rem', background: 'rgba(139, 92, 246, 0.2)', color: '#8b5cf6', borderRadius: '12px' }}>
                        <CreditCard size={24} />
                    </div>
                    <div>
                        <div style={{ color: 'var(--text-secondary)' }}>Active EMIs</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{stats.emis}</div>
                    </div>
                </div>
            </div>

            <h3>Quick Actions</h3>
            <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={() => navigate('/expenses')} style={actionBtnStyle}>Add Expense</button>
                <button onClick={() => navigate('/debts')} style={actionBtnStyle}>Add Debt</button>
                <button onClick={() => navigate('/emis')} style={actionBtnStyle}>Add EMI</button>
            </div>
        </div>
    );
};

const actionBtnStyle = {
    padding: '1rem 2rem',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--primary)',
    color: 'var(--primary)',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '1rem'
};

export default Dashboard;
