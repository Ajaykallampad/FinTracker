import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
    ChevronDown,
    ChevronUp,
    CheckCircle,
    Clock,
    Calendar,
    Plus,
    X,
    TrendingUp,
    CreditCard
} from 'lucide-react';

const EMIs = () => {
    const [emis, setEmis] = useState([]);
    const [expanded, setExpanded] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        title: '',
        start_date: '',
        end_date: '',
        total_installments: '',
        installment_amount: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get('emis/');
            setEmis(res.data.results || res.data);
        } catch (err) {
            console.error('Failed to fetch EMIs', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateEMI = async (e) => {
        e.preventDefault();
        setError('');

        const start = new Date(formData.start_date);
        const end = new Date(formData.end_date);

        if (start >= end) {
            setError('Start date must be before end date.');
            return;
        }

        try {
            await api.post('emis/', formData);
            setShowAddModal(false);
            setFormData({
                title: '',
                start_date: '',
                end_date: '',
                total_installments: '',
                installment_amount: ''
            });
            fetchData();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create EMI');
        }
    };

    const handlePay = async (instId) => {
        try {
            await api.post(`installments/${instId}/mark_paid/`);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to mark as paid');
        }
    };

    if (loading && emis.length === 0) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading EMIs...</div>;

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: '800', background: 'linear-gradient(45deg, var(--primary), #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    EMI Tracker
                </h2>
                <button
                    onClick={() => setShowAddModal(true)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 1.25rem',
                        background: 'var(--primary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                >
                    <Plus size={18} /> Add New EMI
                </button>
            </div>

            <div style={{ display: 'grid', gap: '1.5rem' }}>
                {emis.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem', opacity: 0.5 }}>
                        <CreditCard size={48} style={{ marginBottom: '1rem' }} />
                        <p>No active EMIs tracking. Click "Add New EMI" to get started.</p>
                    </div>
                ) : emis.map(emi => (
                    <EMICard
                        key={emi.id}
                        emi={emi}
                        isExpanded={expanded === emi.id}
                        onToggle={() => setExpanded(expanded === emi.id ? null : emi.id)}
                        onPay={handlePay}
                    />
                ))}
            </div>

            {showAddModal && (
                <AddEMIModal
                    formData={formData}
                    setFormData={setFormData}
                    onSubmit={handleCreateEMI}
                    onClose={() => setShowAddModal(false)}
                    error={error}
                />
            )}
        </div>
    );
};

const EMICard = ({ emi, isExpanded, onToggle, onPay }) => {
    const paidCount = emi.installments.filter(i => i.status === 'PAID').count || emi.installments.filter(i => i.status === 'PAID').length;
    const isCompleted = emi.status === 'COMPLETED';

    return (
        <div className="glass-panel" style={{
            padding: '1.5rem',
            borderRadius: '20px',
            border: isCompleted ? '1px solid var(--success-transparent)' : '1px solid rgba(255,255,255,0.1)',
            transition: 'all 0.3s ease',
            opacity: isCompleted ? 0.8 : 1
        }}>
            <div
                style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '2rem', alignItems: 'center', cursor: 'pointer' }}
                onClick={onToggle}
            >
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{emi.title}</h3>
                        {isCompleted && (
                            <span style={{ background: 'var(--success-transparent)', color: 'var(--success)', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                COMPLETED
                            </span>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <Calendar size={14} /> {emi.start_date} to {emi.end_date}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <TrendingUp size={14} /> ₹{parseFloat(emi.installment_amount).toLocaleString()} × {emi.total_installments}
                        </span>
                    </div>
                </div>

                <div style={{ textAlign: 'right', minWidth: '200px' }}>
                    <div style={{ marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '1.1rem', fontWeight: '700' }}>₹{parseFloat(emi.remaining_amount).toLocaleString()}</span>
                        <span style={{ fontSize: '0.8rem', opacity: 0.6, marginLeft: '0.4rem' }}>remaining of ₹{parseFloat(emi.total_amount).toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.8rem', fontWeight: '600' }}>
                        <span>Progress: {paidCount}/{emi.total_installments} Paid</span>
                        <span>{emi.progress}%</span>
                    </div>
                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                        <div style={{
                            height: '100%',
                            width: `${emi.progress}%`,
                            background: isCompleted ? 'var(--success)' : 'linear-gradient(90deg, var(--primary), #818cf8)',
                            transition: 'width 1s ease-in-out'
                        }}></div>
                    </div>
                </div>

                <div style={{ color: 'var(--text-secondary)' }}>
                    {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                </div>
            </div>

            {isExpanded && (
                <div style={{ marginTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                        {/* Pending Installments */}
                        <div>
                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--warning)', marginTop: 0 }}>
                                <Clock size={18} /> Pending Installments
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {emi.installments.filter(i => i.status === 'PENDING').length === 0 ? (
                                    <p style={{ opacity: 0.5, fontSize: '0.9rem' }}>No pending installments.</p>
                                ) : emi.installments.filter(i => i.status === 'PENDING').map(inst => (
                                    <div key={inst.id} style={installmentStyle}>
                                        <div>
                                            <div style={{ fontWeight: 'bold' }}>₹{parseFloat(inst.amount).toLocaleString()}</div>
                                            <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>Due: {inst.due_date}</div>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onPay(inst.id); }}
                                            style={payBtnStyle}
                                        >
                                            Mark as Paid
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Completed Installments */}
                        <div>
                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)', marginTop: 0 }}>
                                <CheckCircle size={18} /> Completed
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {emi.installments.filter(i => i.status === 'PAID').length === 0 ? (
                                    <p style={{ opacity: 0.5, fontSize: '0.9rem' }}>No installments paid yet.</p>
                                ) : emi.installments.filter(i => i.status === 'PAID').reverse().map(inst => (
                                    <div key={inst.id} style={{ ...installmentStyle, background: 'rgba(16, 185, 129, 0.05)', borderColor: 'rgba(16, 185, 129, 0.1)' }}>
                                        <div>
                                            <div style={{ fontWeight: 'bold', color: 'var(--success)' }}>₹{parseFloat(inst.amount).toLocaleString()}</div>
                                            <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>Paid on: {inst.paid_date}</div>
                                        </div>
                                        <div style={{ color: 'var(--success)', fontWeight: 'bold', fontSize: '0.8rem' }}>PAID</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const AddEMIModal = ({ formData, setFormData, onSubmit, onClose, error }) => (
    <div style={modalOverlayStyle} onClick={onClose}>
        <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0 }}>Create New EMI Plan</h3>
                <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                    <X size={24} />
                </button>
            </div>

            {error && <div style={{ color: 'var(--danger)', background: 'var(--danger-transparent)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}

            <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                    <label style={labelStyle}>EMI Title</label>
                    <input
                        required
                        type="text"
                        placeholder="e.g., iPhone 15 Pro, Home Loan"
                        style={inputStyle}
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                    />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                        <label style={labelStyle}>Start Date</label>
                        <input
                            required
                            type="date"
                            style={inputStyle}
                            value={formData.start_date}
                            onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>End Date</label>
                        <input
                            required
                            type="date"
                            style={inputStyle}
                            value={formData.end_date}
                            onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                        />
                    </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                        <label style={labelStyle}>Installments Amount</label>
                        <input
                            required
                            type="number"
                            placeholder="₹"
                            style={inputStyle}
                            value={formData.installment_amount}
                            onChange={e => setFormData({ ...formData, installment_amount: e.target.value })}
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>No. of Installments</label>
                        <input
                            required
                            type="number"
                            min="1"
                            placeholder="e.g., 12"
                            style={inputStyle}
                            value={formData.total_installments}
                            onChange={e => setFormData({ ...formData, total_installments: e.target.value })}
                        />
                    </div>
                </div>

                <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', opacity: 0.7 }}>
                        <span>Total Payable Amount:</span>
                        <span style={{ fontWeight: 'bold' }}>
                            ₹{(parseFloat(formData.installment_amount || 0) * parseInt(formData.total_installments || 0)).toLocaleString()}
                        </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.5 }}>
                        * Installments will be automatically generated and evenly spaced between the start and end dates.
                    </p>
                </div>

                <button type="submit" style={submitBtnStyle}>Create EMI Plan</button>
            </form>
        </div>
    </div>
);

const installmentStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem 1rem',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.05)'
};

const payBtnStyle = {
    padding: '0.4rem 0.8rem',
    background: 'var(--primary)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.75rem',
    fontWeight: 'bold'
};

const modalOverlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
};

const modalContentStyle = {
    background: '#111',
    padding: '2rem',
    borderRadius: '24px',
    width: '90%',
    maxWidth: '500px',
    border: '1px solid rgba(255,255,255,0.1)',
    boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
};

const inputStyle = {
    width: '100%',
    padding: '0.75rem',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    color: 'white',
    fontSize: '0.9rem',
    marginTop: '0.4rem'
};

const labelStyle = {
    fontSize: '0.8rem',
    fontWeight: 'bold',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
};

const submitBtnStyle = {
    marginTop: '1.5rem',
    padding: '1rem',
    background: 'var(--primary)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '1rem',
    fontWeight: 'bold',
    cursor: 'pointer'
};

export default EMIs;

