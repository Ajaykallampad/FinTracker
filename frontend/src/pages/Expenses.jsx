import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Trash2, Calendar } from 'lucide-react';

const Expenses = () => {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [dailyExpense, setDailyExpense] = useState(null);
    const [categories, setCategories] = useState([]);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    // Form state for adding items
    const [newExpenseItem, setNewExpenseItem] = useState({
        item_id: '',
        amount: ''
    });
    const [selectedCategory, setSelectedCategory] = useState('');

    useEffect(() => {
        fetchMasterData();
    }, []);

    useEffect(() => {
        if (selectedDate) {
            fetchDailyExpense();
        }
    }, [selectedDate]);

    const fetchMasterData = async () => {
        try {
            const [catRes, itemRes] = await Promise.all([
                api.get('categories/'),
                api.get('items/')
            ]);
            setCategories(catRes.data.results || catRes.data);
            setItems(itemRes.data.results || itemRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchDailyExpense = async () => {
        try {
            // Try to get existing daily expense for this date
            const res = await api.get(`daily-expenses/${selectedDate}/`);
            setDailyExpense(res.data);
        } catch (err) {
            if (err.response?.status === 404) {
                // Create a new daily expense for this date
                try {
                    const createRes = await api.post('daily-expenses/', { date: selectedDate });
                    setDailyExpense(createRes.data);
                } catch (createErr) {
                    console.error('Error creating daily expense:', createErr);
                }
            } else {
                console.error(err);
            }
        }
    };

    const handleAddExpenseItem = async (e) => {
        e.preventDefault();
        if (!dailyExpense) return;

        try {
            await api.post(`daily-expenses/${selectedDate}/add_item/`, {
                item: newExpenseItem.item_id,
                amount: newExpenseItem.amount
            });

            // Refresh the daily expense data
            await fetchDailyExpense();

            // Reset form
            setNewExpenseItem({ item_id: '', amount: '' });
            setSelectedCategory('');
        } catch (err) {
            alert('Error adding expense item: ' + (err.response?.data?.error || 'Unknown error'));
        }
    };

    const filteredItems = items.filter(i =>
        selectedCategory ? i.category == selectedCategory : true
    );

    // Calculate category totals
    const categoryTotals = {};
    if (dailyExpense?.expenses) {
        dailyExpense.expenses.forEach(exp => {
            const catName = exp.category_name || 'Unknown';
            categoryTotals[catName] = (categoryTotals[catName] || 0) + parseFloat(exp.amount);
        });
    }

    const totalAmount = dailyExpense?.expenses?.reduce((sum, exp) => sum + parseFloat(exp.amount), 0) || 0;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2>Daily Expense Tracker</h2>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <Calendar size={20} />
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={e => setSelectedDate(e.target.value)}
                        style={{
                            ...inputStyle,
                            marginTop: 0,
                            width: 'auto'
                        }}
                    />
                </div>
            </div>

            {/* Category Totals Summary */}
            {dailyExpense?.expenses?.length > 0 && (
                <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                    <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Category Summary</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        {Object.entries(categoryTotals).map(([category, total]) => (
                            <div
                                key={category}
                                style={{
                                    padding: '1rem',
                                    background: 'var(--bg-secondary)',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}
                            >
                                <div style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '0.3rem' }}>{category}</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                                    ₹{total.toFixed(2)}
                                </div>
                            </div>
                        ))}
                        <div
                            style={{
                                padding: '1rem',
                                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                                borderRadius: '8px',
                            }}
                        >
                            <div style={{ fontSize: '0.85rem', marginBottom: '0.3rem' }}>Total</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                                ₹{totalAmount.toFixed(2)}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Expense Item Form */}
            <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>Add Item</h3>
                <form onSubmit={handleAddExpenseItem} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div>
                        <label>Category (Filter)</label>
                        <select
                            value={selectedCategory}
                            onChange={e => {
                                setSelectedCategory(e.target.value);
                                setNewExpenseItem({ ...newExpenseItem, item_id: '' });
                            }}
                            style={inputStyle}
                        >
                            <option value="">All Categories</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label>Item *</label>
                        <select
                            value={newExpenseItem.item_id}
                            onChange={e => setNewExpenseItem({ ...newExpenseItem, item_id: e.target.value })}
                            style={inputStyle}
                            required
                        >
                            <option value="">Select Item</option>
                            {filteredItems.map(i => (
                                <option key={i.id} value={i.id}>
                                    {i.name} - {i.category_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label>Amount *</label>
                        <input
                            type="number"
                            step="0.01"
                            value={newExpenseItem.amount}
                            onChange={e => setNewExpenseItem({ ...newExpenseItem, amount: e.target.value })}
                            style={inputStyle}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        style={{
                            ...buttonStyle,
                            alignSelf: 'end',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <Plus size={18} /> Add Item
                    </button>
                </form>
            </div>

            {/* Expense Items List */}
            <div className="glass-panel" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <h3>Items for {selectedDate}</h3>
                </div>
                {dailyExpense?.expenses?.length > 0 ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ background: 'var(--bg-tertiary)' }}>
                            <tr>
                                <th style={{ padding: '1rem' }}>Item</th>
                                <th style={{ padding: '1rem' }}>Category</th>
                                <th style={{ padding: '1rem' }}>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dailyExpense.expenses.map(exp => (
                                <tr key={exp.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '1rem' }}>{exp.item_name}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            padding: '0.3rem 0.8rem',
                                            background: 'rgba(59, 130, 246, 0.2)',
                                            color: '#60a5fa',
                                            borderRadius: '20px',
                                            fontSize: '0.8rem'
                                        }}>
                                            {exp.category_name}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', fontWeight: 'bold' }}>₹{parseFloat(exp.amount).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div style={{ padding: '3rem', textAlign: 'center', opacity: 0.7 }}>
                        No expenses recorded for this date. Add items above to get started.
                    </div>
                )}
            </div>
        </div>
    );
};

const inputStyle = {
    width: '100%',
    padding: '0.8rem',
    borderRadius: '8px',
    border: '1px solid var(--bg-tertiary)',
    background: 'var(--bg-primary)',
    color: 'white',
    marginTop: '0.5rem'
};

const buttonStyle = {
    padding: '1rem',
    background: 'var(--primary)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '500'
};

export default Expenses;
