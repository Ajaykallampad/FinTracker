import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Edit2, Trash2, Tag, Package } from 'lucide-react';

const CategoriesItems = () => {
    const [categories, setCategories] = useState([]);
    const [items, setItems] = useState([]);
    const [activeTab, setActiveTab] = useState('categories');

    // Category form
    const [categoryForm, setCategoryForm] = useState({ name: '' });
    const [showCategoryForm, setShowCategoryForm] = useState(false);

    // Item form
    const [itemForm, setItemForm] = useState({ name: '', category: '' });
    const [showItemForm, setShowItemForm] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [catRes, itemRes] = await Promise.all([
                api.get('categories/'),
                api.get('items/')
            ]);
            setCategories(catRes.data.results || catRes.data);
            setItems(itemRes.data.results || itemRes.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddCategory = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('categories/', categoryForm);
            setCategories([...categories, res.data]);
            setCategoryForm({ name: '' });
            setShowCategoryForm(false);
        } catch (err) {
            alert('Error creating category: ' + (err.response?.data?.name?.[0] || 'Unknown error'));
        }
    };

    const handleDeleteCategory = async (id) => {
        if (!confirm('Delete this category? Items under it will become orphaned.')) return;
        try {
            await api.delete(`categories/${id}/`);
            setCategories(categories.filter(c => c.id !== id));
        } catch (err) {
            alert('Error deleting category');
        }
    };

    const handleAddItem = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('items/', itemForm);
            setItems([...items, res.data]);
            setItemForm({ name: '', category: '' });
            setShowItemForm(false);
        } catch (err) {
            alert('Error creating item: ' + (err.response?.data?.name?.[0] || 'Unknown error'));
        }
    };

    const handleDeleteItem = async (id) => {
        if (!confirm('Delete this item?')) return;
        try {
            await api.delete(`items/${id}/`);
            setItems(items.filter(i => i.id !== id));
        } catch (err) {
            alert('Error deleting item');
        }
    };

    return (
        <div>
            <h2 style={{ marginBottom: '2rem' }}>Categories & Items Management</h2>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                <button
                    onClick={() => setActiveTab('categories')}
                    style={{
                        ...tabStyle,
                        background: activeTab === 'categories' ? 'var(--primary)' : 'var(--bg-secondary)',
                    }}
                >
                    <Tag size={18} /> Categories
                </button>
                <button
                    onClick={() => setActiveTab('items')}
                    style={{
                        ...tabStyle,
                        background: activeTab === 'items' ? 'var(--primary)' : 'var(--bg-secondary)',
                    }}
                >
                    <Package size={18} /> Items
                </button>
            </div>

            {activeTab === 'categories' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                        <h3>Categories</h3>
                        <button onClick={() => setShowCategoryForm(!showCategoryForm)} style={buttonStyle}>
                            <Plus size={18} /> Add Category
                        </button>
                    </div>

                    {showCategoryForm && (
                        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                            <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: '1rem', alignItems: 'end' }}>
                                <div style={{ flex: 1 }}>
                                    <label>Category Name</label>
                                    <input
                                        type="text"
                                        value={categoryForm.name}
                                        onChange={e => setCategoryForm({ name: e.target.value })}
                                        style={inputStyle}
                                        placeholder="e.g., Food, Entertainment"
                                        required
                                    />
                                </div>
                                <button type="submit" style={buttonStyle}>Create</button>
                            </form>
                        </div>
                    )}

                    <div className="glass-panel" style={{ overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: 'var(--bg-tertiary)' }}>
                                <tr>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Name</th>
                                    <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {categories.map(cat => (
                                    <tr key={cat.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '1rem' }}>{cat.name}</td>
                                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                                            <button
                                                onClick={() => handleDeleteCategory(cat.id)}
                                                style={{ ...iconButtonStyle, color: '#ef4444' }}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {categories.length === 0 && (
                            <div style={{ padding: '3rem', textAlign: 'center', opacity: 0.7 }}>
                                No categories yet. Create one to get started.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'items' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                        <h3>Items</h3>
                        <button onClick={() => setShowItemForm(!showItemForm)} style={buttonStyle}>
                            <Plus size={18} /> Add Item
                        </button>
                    </div>

                    {showItemForm && (
                        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                            <form onSubmit={handleAddItem} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
                                <div>
                                    <label>Item Name</label>
                                    <input
                                        type="text"
                                        value={itemForm.name}
                                        onChange={e => setItemForm({ ...itemForm, name: e.target.value })}
                                        style={inputStyle}
                                        placeholder="e.g., Milk, Cinema"
                                        required
                                    />
                                </div>
                                <div>
                                    <label>Category</label>
                                    <select
                                        value={itemForm.category}
                                        onChange={e => setItemForm({ ...itemForm, category: e.target.value })}
                                        style={inputStyle}
                                        required
                                    >
                                        <option value="">Select Category</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <button type="submit" style={buttonStyle}>Create</button>
                            </form>
                        </div>
                    )}

                    <div className="glass-panel" style={{ overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: 'var(--bg-tertiary)' }}>
                                <tr>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Name</th>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Category</th>
                                    <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map(item => (
                                    <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '1rem' }}>{item.name}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                padding: '0.3rem 0.8rem',
                                                background: 'rgba(59, 130, 246, 0.2)',
                                                color: '#60a5fa',
                                                borderRadius: '20px',
                                                fontSize: '0.8rem'
                                            }}>
                                                {item.category_name}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                                            <button
                                                onClick={() => handleDeleteItem(item.id)}
                                                style={{ ...iconButtonStyle, color: '#ef4444' }}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {items.length === 0 && (
                            <div style={{ padding: '3rem', textAlign: 'center', opacity: 0.7 }}>
                                No items yet. Create categories first, then add items.
                            </div>
                        )}
                    </div>
                </div>
            )}
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
    padding: '0.8rem 1.5rem',
    background: 'var(--primary)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontWeight: '500'
};

const tabStyle = {
    padding: '0.8rem 1.5rem',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: 'white',
    fontWeight: '500'
};

const iconButtonStyle = {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '0.5rem'
};

export default CategoriesItems;
