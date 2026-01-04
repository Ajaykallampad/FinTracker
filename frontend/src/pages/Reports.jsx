import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LabelList } from 'recharts';
import { Calendar, Filter } from 'lucide-react';

const Reports = () => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    // State for monthly bar chart
    const [barChartYear, setBarChartYear] = useState(currentYear);
    const [barChartData, setBarChartData] = useState([]);

    // State for category pie chart
    const [pieChartYear, setPieChartYear] = useState(currentYear);
    const [pieChartMonth, setPieChartMonth] = useState(currentMonth);
    const [pieChartData, setPieChartData] = useState([]);

    // State for tabular report
    const [startDate, setStartDate] = useState(new Date(currentYear, currentMonth - 1, 1).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [groupBy, setGroupBy] = useState('daily');
    const [tabularData, setTabularData] = useState(null);

    const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6'];

    // Fetch monthly bar chart data
    useEffect(() => {
        api.get(`daily-expenses/monthly_bar_chart/?year=${barChartYear}`)
            .then(res => setBarChartData(res.data))
            .catch(err => console.error(err));
    }, [barChartYear]);

    // Fetch category pie chart data
    useEffect(() => {
        api.get(`daily-expenses/category_pie_chart/?year=${pieChartYear}&month=${pieChartMonth}`)
            .then(res => setPieChartData(res.data))
            .catch(err => console.error(err));
    }, [pieChartYear, pieChartMonth]);

    // Fetch tabular report data
    const fetchTabularReport = () => {
        api.get(`daily-expenses/tabular_report/?start_date=${startDate}&end_date=${endDate}&group_by=${groupBy}`)
            .then(res => setTabularData(res.data))
            .catch(err => {
                console.error(err);
                alert('Error fetching report: ' + (err.response?.data?.error || 'Unknown error'));
            });
    };

    useEffect(() => {
        if (startDate && endDate) {
            fetchTabularReport();
        }
    }, [startDate, endDate, groupBy]);

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    return (
        <div>
            <h2 style={{ marginBottom: '2rem' }}>Financial Reports & Analytics</h2>

            {/* 1️⃣ Monthly Expense Bar Chart */}
            <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3>Monthly Expense Trend</h3>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <label style={{ fontSize: '0.9rem', opacity: 0.8 }}>Year:</label>
                        <select
                            value={barChartYear}
                            onChange={(e) => setBarChartYear(parseInt(e.target.value))}
                            style={selectStyle}
                        >
                            {[...Array(5)].map((_, i) => {
                                const year = currentYear - 2 + i;
                                return <option key={year} value={year}>{year}</option>;
                            })}
                        </select>
                    </div>
                </div>
                <div style={{ height: '350px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barChartData}>
                            <XAxis
                                dataKey="month"
                                stroke="rgba(255,255,255,0.5)"
                                tick={{ fontSize: 12 }}
                            />
                            <YAxis stroke="rgba(255,255,255,0.5)" />
                            <Tooltip
                                contentStyle={{
                                    background: 'var(--bg-secondary)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                    color: 'white'
                                }}
                                formatter={(value) => [`₹${value.toFixed(2)}`, 'Total']}
                            />
                            <Bar dataKey="total" fill="var(--primary)" radius={[8, 8, 0, 0]}>
                                <LabelList
                                    dataKey="total"
                                    position="top"
                                    formatter={(value) => value > 0 ? `₹${value.toFixed(0)}` : ''}
                                    style={{ fill: 'white', fontSize: '11px', fontWeight: '500' }}
                                />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* 2️⃣ Category-Wise Pie Chart */}
            <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3>Category-Wise Breakdown</h3>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <label style={{ fontSize: '0.9rem', opacity: 0.8 }}>Month:</label>
                        <select
                            value={pieChartMonth}
                            onChange={(e) => setPieChartMonth(parseInt(e.target.value))}
                            style={selectStyle}
                        >
                            {months.map((month, idx) => (
                                <option key={idx} value={idx + 1}>{month}</option>
                            ))}
                        </select>
                        <select
                            value={pieChartYear}
                            onChange={(e) => setPieChartYear(parseInt(e.target.value))}
                            style={selectStyle}
                        >
                            {[...Array(5)].map((_, i) => {
                                const year = currentYear - 2 + i;
                                return <option key={year} value={year}>{year}</option>;
                            })}
                        </select>
                    </div>
                </div>
                {pieChartData.length > 0 ? (
                    <div style={{ height: '350px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieChartData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ category, total, percent }) => {
                                        if (percent < 0.05) return ''; // Don't show label for very small slices
                                        return `${category}\n₹${total.toFixed(0)} (${(percent * 100).toFixed(0)}%)`;
                                    }}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="total"
                                >
                                    {pieChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        background: 'var(--bg-secondary)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '8px',
                                        color: 'white'
                                    }}
                                    formatter={(value) => `₹${value.toFixed(2)}`}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div style={{ padding: '3rem', textAlign: 'center', opacity: 0.7 }}>
                        No expenses recorded for {months[pieChartMonth - 1]} {pieChartYear}
                    </div>
                )}
            </div>

            {/* 3️⃣ Advanced Tabular Report */}
            <div className="glass-panel" style={{ padding: '2rem' }}>
                <h3 style={{ marginBottom: '1.5rem' }}>Advanced Tabular Report</h3>

                {/* Filters */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem',
                    marginBottom: '2rem',
                    padding: '1.5rem',
                    background: 'var(--bg-secondary)',
                    borderRadius: '12px'
                }}>
                    <div>
                        <label style={{ fontSize: '0.85rem', opacity: 0.8, marginBottom: '0.5rem', display: 'block' }}>
                            Start Date
                        </label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            style={inputStyle}
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: '0.85rem', opacity: 0.8, marginBottom: '0.5rem', display: 'block' }}>
                            End Date
                        </label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            style={inputStyle}
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: '0.85rem', opacity: 0.8, marginBottom: '0.5rem', display: 'block' }}>
                            Group By
                        </label>
                        <select
                            value={groupBy}
                            onChange={(e) => setGroupBy(e.target.value)}
                            style={inputStyle}
                        >
                            <option value="daily">Daily</option>
                            <option value="monthly">Monthly</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                {tabularData && tabularData.rows.length > 0 ? (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead style={{ background: 'var(--bg-tertiary)' }}>
                                <tr>
                                    {tabularData.columns.map((col, idx) => (
                                        <th key={idx} style={{
                                            padding: '1rem',
                                            fontWeight: idx === tabularData.columns.length - 1 ? 'bold' : 'normal',
                                            borderRight: idx === 0 ? '2px solid rgba(255,255,255,0.1)' : 'none'
                                        }}>
                                            {col}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {tabularData.rows.map((row, rowIdx) => (
                                    <tr key={rowIdx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{
                                            padding: '1rem',
                                            fontWeight: '500',
                                            borderRight: '2px solid rgba(255,255,255,0.1)'
                                        }}>
                                            {row.date || row.month}
                                        </td>
                                        {tabularData.columns.slice(1, -1).map((col, colIdx) => (
                                            <td key={colIdx} style={{
                                                padding: '1rem',
                                                color: row[col] > 0 ? 'white' : 'rgba(255,255,255,0.3)'
                                            }}>
                                                ₹{(row[col] || 0).toFixed(2)}
                                            </td>
                                        ))}
                                        <td style={{
                                            padding: '1rem',
                                            fontWeight: 'bold',
                                            color: 'var(--primary)',
                                            fontSize: '1.05rem'
                                        }}>
                                            ₹{row.total.toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div style={{ padding: '3rem', textAlign: 'center', opacity: 0.7 }}>
                        {tabularData ? 'No data available for selected date range' : 'Loading...'}
                    </div>
                )}
            </div>
        </div>
    );
};

const inputStyle = {
    width: '100%',
    padding: '0.7rem',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'var(--bg-primary)',
    color: 'white',
    fontSize: '0.9rem'
};

const selectStyle = {
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'var(--bg-primary)',
    color: 'white',
    fontSize: '0.9rem',
    cursor: 'pointer'
};

export default Reports;
