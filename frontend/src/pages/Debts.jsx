import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const Debts = () => {
    // State management
    const [debts, setDebts] = useState([]);
    const [persons, setPersons] = useState([]);
    const [selectedPerson, setSelectedPerson] = useState('');
    const [summary, setSummary] = useState(null);
    const [selectedType, setSelectedType] = useState('ALL');
    const [showSettlementModal, setShowSettlementModal] = useState(false);
    const [selectedDebt, setSelectedDebt] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);

    // Fetch data on mount and when filter changes
    useEffect(() => {
        fetchAllData();
    }, [selectedPerson]);

    const fetchAllData = async () => {
        try {
            const personParam = selectedPerson ? `?person=${selectedPerson}` : '';

            const [debtsRes, personsRes, summaryRes] = await Promise.all([
                api.get(`debts/${personParam}`),
                api.get('debts/persons/'),
                api.get(`debts/summary/${personParam}`)
            ]);

            setDebts(debtsRes.data.results || []);
            setPersons(personsRes.data.persons || []);
            setSummary(summaryRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    // Filter debts
    const pendingDebts = debts.filter(d => {
        if (d.status !== 'PENDING') return false;
        if (selectedType !== 'ALL' && d.type !== selectedType) return false;
        return true;
    });
    const closedDebts = debts.filter(d => d.status === 'CLOSED');

    // Group closed debts by month
    const closedGrouped = closedDebts.reduce((acc, debt) => {
        if (debt.closed_at) {
            const date = new Date(debt.closed_at);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const monthDisplay = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

            if (!acc[monthKey]) {
                acc[monthKey] = { monthDisplay, debts: [] };
            }
            acc[monthKey].debts.push(debt);
        }
        return acc;
    }, {});

    const handleSettleClick = (debt) => {
        setSelectedDebt(debt);
        setShowSettlementModal(true);
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', height: '100%' }}>
            {/* Left Panel */}
            <div style={{ overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ margin: 0 }}>Debt & Borrow Manager</h2>
                    <button onClick={() => setShowAddModal(true)} className="btn-primary">
                        + Add New
                    </button>
                </div>

                {/* Filters */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div>
                        <label style={{ fontSize: '0.9rem', marginBottom: '0.5rem', display: 'block', opacity: 0.8 }}>
                            Filter by Person
                        </label>
                        <select
                            value={selectedPerson}
                            onChange={(e) => setSelectedPerson(e.target.value)}
                            style={dropdownStyle}
                        >
                            <option value="">All Persons</option>
                            {persons.map(person => (
                                <option key={person} value={person}>{person}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label style={{ fontSize: '0.9rem', marginBottom: '0.5rem', display: 'block', opacity: 0.8 }}>
                            Category
                        </label>
                        <select
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value)}
                            style={dropdownStyle}
                        >
                            <option value="ALL">All Transactions</option>
                            <option value="BORROWED">Borrowed (Pending)</option>
                            <option value="GIVEN">Given (Pending)</option>
                        </select>
                    </div>
                </div>

                {/* Pending Transactions */}
                <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                    <h3 style={{ marginTop: 0, color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        ⏳ {selectedType === 'ALL' ? 'Pending Transactions' : selectedType === 'BORROWED' ? 'Pending Borrowed' : 'Pending Given'}
                        <span style={{ fontSize: '0.9rem', opacity: 0.7 }}>({pendingDebts.length})</span>
                    </h3>

                    {pendingDebts.length === 0 ? (
                        <p style={{ opacity: 0.6, textAlign: 'center', padding: '2rem' }}>No pending debts</p>
                    ) : (
                        pendingDebts.map(debt => (
                            <PendingDebtCard
                                key={debt.id}
                                debt={debt}
                                onSettle={handleSettleClick}
                            />
                        ))
                    )}
                </div>

                {/* Closed Deals */}
                <h3 style={{ marginBottom: '1rem' }}>✅ Closed Deals</h3>
                {Object.keys(closedGrouped).length === 0 ? (
                    <p style={{ opacity: 0.6, textAlign: 'center', padding: '2rem' }}>No closed debts</p>
                ) : (
                    Object.keys(closedGrouped).sort().reverse().map(monthKey => {
                        const group = closedGrouped[monthKey];
                        return (
                            <div key={monthKey} style={{ marginBottom: '1.5rem' }}>
                                <h4 style={{
                                    color: 'var(--text-secondary)',
                                    borderBottom: '1px solid var(--bg-tertiary)',
                                    paddingBottom: '0.5rem',
                                    marginBottom: '1rem'
                                }}>
                                    {group.monthDisplay}
                                </h4>
                                {group.debts.map(debt => (
                                    <ClosedDebtCard key={debt.id} debt={debt} />
                                ))}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Right Panel - Summary */}
            <div>
                <div className="glass-panel" style={{ padding: '1.5rem', position: 'sticky', top: '2rem' }}>
                    <h3 style={{ marginTop: 0 }}>📊 Summary</h3>

                    {summary && <SummaryPanel summary={summary} />}
                </div>
            </div>

            {/* Modals */}
            {showSettlementModal && selectedDebt && (
                <SettlementModal
                    debt={selectedDebt}
                    onClose={() => {
                        setShowSettlementModal(false);
                        setSelectedDebt(null);
                    }}
                    onSuccess={() => {
                        setShowSettlementModal(false);
                        setSelectedDebt(null);
                        fetchAllData();
                    }}
                />
            )}

            {showAddModal && (
                <AddDebtModal
                    onClose={() => setShowAddModal(false)}
                    onSuccess={() => {
                        setShowAddModal(false);
                        fetchAllData();
                    }}
                />
            )}
        </div>
    );
};

// PendingDebtCard Component
const PendingDebtCard = ({ debt, onSettle }) => {
    const settledPercentage = (debt.amount_settled / debt.amount) * 100;
    const isBorrowed = debt.type === 'BORROWED';

    return (
        <div style={{
            ...cardStyle,
            borderLeft: `4px solid ${isBorrowed ? 'var(--danger)' : 'var(--success)'}`
        }}>
            <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{debt.person_name}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                            <span style={{
                                padding: '0.2rem 0.5rem',
                                borderRadius: '4px',
                                background: isBorrowed ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                                color: isBorrowed ? 'var(--danger)' : 'var(--success)',
                                fontWeight: '500'
                            }}>
                                {isBorrowed ? 'BORROWED' : 'GIVEN'}
                            </span>
                            <span style={{ marginLeft: '0.5rem' }}>
                                • {debt.days_pending} days pending
                            </span>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: isBorrowed ? 'var(--danger)' : 'var(--success)' }}>
                            ₹{parseFloat(debt.outstanding_amount).toFixed(2)}
                        </div>
                        <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>outstanding</div>
                    </div>
                </div>

                <div style={{ marginTop: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                        <span>Settled: ₹{parseFloat(debt.amount_settled).toFixed(2)}</span>
                        <span>Total: ₹{parseFloat(debt.amount).toFixed(2)}</span>
                    </div>
                    <div style={{
                        height: '8px',
                        background: 'var(--bg-tertiary)',
                        borderRadius: '4px',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            width: `${settledPercentage}%`,
                            height: '100%',
                            background: `linear-gradient(90deg, ${isBorrowed ? 'var(--danger)' : 'var(--success)'}, ${isBorrowed ? '#fca5a5' : '#86efac'})`,
                            transition: 'width 0.3s ease'
                        }} />
                    </div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '0.2rem' }}>
                        {settledPercentage.toFixed(1)}% settled
                    </div>
                </div>

                <button
                    onClick={() => onSettle(debt)}
                    style={{
                        ...settleBtnStyle,
                        marginTop: '1rem'
                    }}
                >
                    💰 Settle Payment
                </button>
            </div>
        </div>
    );
};

// ClosedDebtCard Component
const ClosedDebtCard = ({ debt }) => {
    const isBorrowed = debt.type === 'BORROWED';

    return (
        <div style={{ ...cardStyle, opacity: 0.7, marginBottom: '0.8rem' }}>
            <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ fontWeight: '500' }}>{debt.person_name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            {isBorrowed ? 'Borrowed' : 'Given'}
                        </div>
                    </div>
                    <div style={{ fontWeight: 'bold', color: isBorrowed ? 'var(--danger)' : 'var(--success)' }}>
                        ₹{parseFloat(debt.amount).toFixed(2)}
                    </div>
                </div>
            </div>
        </div>
    );
};

// SummaryPanel Component
const SummaryPanel = ({ summary }) => {
    const COLORS = {
        borrowedPending: '#ef4444',
        borrowedSettled: '#fca5a5',
        givenPending: '#10b981',
        givenSettled: '#86efac'
    };

    const chartData = [
        { name: 'Borrowed (Pending)', value: summary.borrowed_breakdown.pending, fill: COLORS.borrowedPending },
        { name: 'Borrowed (Settled)', value: summary.borrowed_breakdown.settled, fill: COLORS.borrowedSettled },
        { name: 'Given (Pending)', value: summary.given_breakdown.pending, fill: COLORS.givenPending },
        { name: 'Given (Settled)', value: summary.given_breakdown.settled, fill: COLORS.givenSettled }
    ].filter(item => item.value > 0);

    return (
        <>
            {/* Chart */}
            {chartData.length > 0 && (
                <div style={{ height: '250px', marginBottom: '1.5rem' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={80}
                                paddingAngle={2}
                                dataKey="value"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    background: 'var(--bg-secondary)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                    color: 'white'
                                }}
                                formatter={(value) => `₹${parseFloat(value).toFixed(2)}`}
                            />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Stats */}
            <div style={{ display: 'grid', gap: '1rem' }}>
                <StatCard
                    label="Total Borrowed"
                    value={summary.total_borrowed}
                    color="var(--danger)"
                />
                <StatCard
                    label="Total Given"
                    value={summary.total_given}
                    color="var(--success)"
                />
                <div style={{ borderTop: '1px solid var(--bg-tertiary)', paddingTop: '1rem' }}>
                    <StatCard
                        label="Outstanding"
                        value={summary.total_outstanding}
                        color="var(--warning)"
                        highlight
                    />
                </div>
                <StatCard
                    label="Total Settled"
                    value={summary.total_settled}
                    color="var(--text-secondary)"
                />
            </div>
        </>
    );
};

const StatCard = ({ label, value, color, highlight }) => (
    <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: highlight ? '0.75rem' : '0.5rem',
        background: highlight ? 'var(--bg-secondary)' : 'transparent',
        borderRadius: '8px'
    }}>
        <span style={{ opacity: 0.8 }}>{label}:</span>
        <span style={{ fontWeight: 'bold', color, fontSize: highlight ? '1.2rem' : '1rem' }}>
            ₹{parseFloat(value).toFixed(2)}
        </span>
    </div>
);

// SettlementModal Component
const SettlementModal = ({ debt, onClose, onSuccess }) => {
    const [amount, setAmount] = useState('');
    const [notes, setNotes] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const settlementAmount = parseFloat(amount);
        if (isNaN(settlementAmount) || settlementAmount <= 0) {
            setError('Please enter a valid amount');
            return;
        }

        if (settlementAmount > parseFloat(debt.outstanding_amount)) {
            setError(`Amount cannot exceed outstanding balance of ₹${debt.outstanding_amount}`);
            return;
        }

        setLoading(true);
        try {
            await api.post(`debts/${debt.id}/settle/`, {
                amount: settlementAmount,
                notes: notes
            });
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to settle debt');
            setLoading(false);
        }
    };

    return (
        <div style={modalOverlayStyle} onClick={onClose}>
            <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
                <h3 style={{ marginTop: 0 }}>Settle Payment</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                    <strong>{debt.person_name}</strong><br />
                    Outstanding: <strong style={{ color: 'var(--warning)' }}>₹{parseFloat(debt.outstanding_amount).toFixed(2)}</strong>
                </p>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                            Settlement Amount *
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            max={debt.outstanding_amount}
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            style={inputStyle}
                            placeholder="Enter amount"
                            autoFocus
                            required
                        />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                            Notes (optional)
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                            placeholder="Add notes about this payment..."
                        />
                    </div>

                    {error && (
                        <div style={{
                            padding: '0.75rem',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid var(--danger)',
                            borderRadius: '8px',
                            color: 'var(--danger)',
                            marginBottom: '1rem',
                            fontSize: '0.9rem'
                        }}>
                            {error}
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={cancelBtnStyle}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            style={submitBtnStyle}
                            disabled={loading}
                        >
                            {loading ? 'Processing...' : 'Settle Payment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// AddDebtModal Component
const AddDebtModal = ({ onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        person_name: '',
        amount: '',
        type: 'BORROWED',
        due_date: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.person_name || !formData.amount) {
            setError('Person name and amount are required');
            return;
        }

        setLoading(true);
        try {
            await api.post('debts/', formData);
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create debt entry');
            setLoading(false);
        }
    };

    return (
        <div style={modalOverlayStyle} onClick={onClose}>
            <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
                <h3 style={{ marginTop: 0 }}>Add New Debt Entry</h3>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                            Person Name *
                        </label>
                        <input
                            type="text"
                            value={formData.person_name}
                            onChange={(e) => setFormData({ ...formData, person_name: e.target.value })}
                            style={inputStyle}
                            placeholder="Enter person name"
                            autoFocus
                            required
                        />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                            Amount *
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            style={inputStyle}
                            placeholder="Enter amount"
                            required
                        />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                            Type *
                        </label>
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            style={inputStyle}
                            required
                        >
                            <option value="BORROWED">Borrowed (I owe them)</option>
                            <option value="GIVEN">Given (They owe me)</option>
                        </select>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                            Due Date (optional)
                        </label>
                        <input
                            type="date"
                            value={formData.due_date}
                            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                            style={inputStyle}
                        />
                    </div>

                    {error && (
                        <div style={{
                            padding: '0.75rem',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid var(--danger)',
                            borderRadius: '8px',
                            color: 'var(--danger)',
                            marginBottom: '1rem',
                            fontSize: '0.9rem'
                        }}>
                            {error}
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={cancelBtnStyle}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            style={submitBtnStyle}
                            disabled={loading}
                        >
                            {loading ? 'Creating...' : 'Create Entry'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Styles
const cardStyle = {
    padding: '1.25rem',
    background: 'var(--bg-secondary)',
    borderRadius: '12px',
    marginBottom: '1rem',
    transition: 'transform 0.2s, box-shadow 0.2s',
    cursor: 'pointer'
};

const dropdownStyle = {
    width: '100%',
    padding: '0.75rem',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'var(--bg-secondary)',
    color: 'white',
    fontSize: '0.95rem',
    cursor: 'pointer'
};

const settleBtnStyle = {
    padding: '0.6rem 1.2rem',
    background: 'var(--accent)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '0.9rem',
    transition: 'transform 0.2s, opacity 0.2s'
};

const modalOverlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
};

const modalContentStyle = {
    background: 'var(--bg-primary)',
    padding: '2rem',
    borderRadius: '16px',
    maxWidth: '500px',
    width: '90%',
    maxHeight: '90vh',
    overflowY: 'auto',
    border: '1px solid rgba(255,255,255,0.1)'
};

const inputStyle = {
    width: '100%',
    padding: '0.75rem',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'var(--bg-secondary)',
    color: 'white',
    fontSize: '0.95rem',
    fontFamily: 'inherit'
};

const cancelBtnStyle = {
    padding: '0.75rem 1.5rem',
    background: 'transparent',
    color: 'white',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.95rem'
};

const submitBtnStyle = {
    padding: '0.75rem 1.5rem',
    background: 'var(--accent)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '0.95rem'
};

export default Debts;
