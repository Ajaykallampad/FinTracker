import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Wallet, CreditCard, BarChart3, Banknote, LogOut, Tag } from 'lucide-react';
// import styles from './Layout.module.css'; // Removed as we are using inline styles


const Layout = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { path: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
        { path: '/expenses', label: 'Expenses', icon: <Wallet size={20} /> },
        { path: '/categories-items', label: 'Categories & Items', icon: <Tag size={20} /> },
        { path: '/debts', label: 'Debts', icon: <Banknote size={20} /> },
        { path: '/emis', label: 'EMI Tracker', icon: <CreditCard size={20} /> },
        { path: '/reports', label: 'Reports', icon: <BarChart3 size={20} /> },
    ];

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            <aside style={{
                width: '260px',
                background: 'var(--bg-secondary)',
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                borderRight: '1px solid rgba(255,255,255,0.05)'
            }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '3rem', color: 'var(--primary)' }}>
                    FinTracker
                </h1>
                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            style={({ isActive }) => ({
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                padding: '1rem',
                                borderRadius: '12px',
                                textDecoration: 'none',
                                color: isActive ? 'white' : 'var(--text-secondary)',
                                background: isActive ? 'var(--primary)' : 'transparent',
                                transition: 'var(--transition)'
                            })}
                        >
                            {item.icon}
                            {item.label}
                        </NavLink>
                    ))}
                </nav>
                <button
                    onClick={handleLogout}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        padding: '1rem',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--danger)',
                        cursor: 'pointer',
                        fontSize: '1rem'
                    }}
                >
                    <LogOut size={20} /> Logout
                </button>
            </aside>
            <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
