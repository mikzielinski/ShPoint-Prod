import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { getCollections, createCollection } from '../lib/api';
export default function CollectionsPage() {
    const { auth } = useAuth();
    const [collections, setCollections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newCollectionTitle, setNewCollectionTitle] = useState('');
    useEffect(() => {
        if (auth.status === 'authenticated') {
            loadCollections();
        }
    }, [auth.status]);
    const loadCollections = async () => {
        try {
            setLoading(true);
            const data = await getCollections();
            setCollections(data);
        }
        catch (err) {
            setError('Failed to load collections');
            console.error('Error loading collections:', err);
        }
        finally {
            setLoading(false);
        }
    };
    const handleCreateCollection = async (e) => {
        e.preventDefault();
        if (!newCollectionTitle.trim())
            return;
        try {
            const { collection } = await createCollection(newCollectionTitle.trim());
            setCollections(prev => [collection, ...prev]);
            setNewCollectionTitle('');
        }
        catch (err) {
            setError('Failed to create collection');
            console.error('Error creating collection:', err);
        }
    };
    if (auth.status === 'loading') {
        return _jsx("div", { className: "flex justify-center items-center min-h-screen", children: "Loading..." });
    }
    if (auth.status === 'anonymous') {
        return (_jsxs("div", { className: "flex flex-col items-center justify-center min-h-screen", children: [_jsx("h1", { className: "text-2xl font-bold mb-4", children: "Collections" }), _jsx("p", { className: "text-gray-600 mb-4", children: "Please log in to manage your collections." }), _jsx("a", { href: "/auth/google", className: "bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded", children: "Login with Google" })] }));
    }
    return (_jsxs("div", { className: "container mx-auto px-4 py-8", children: [_jsxs("div", { className: "flex justify-between items-center mb-8", children: [_jsx("h1", { className: "text-3xl font-bold", children: "My Collections" }), _jsx("button", { onClick: () => document.getElementById('create-collection-modal')?.showModal(), className: "bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded", children: "New Collection" })] }), error && (_jsx("div", { className: "bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4", children: error })), loading ? (_jsx("div", { className: "flex justify-center items-center py-8", children: _jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" }) })) : collections.length === 0 ? (_jsxs("div", { className: "text-center py-12", children: [_jsx("h2", { className: "text-xl font-semibold mb-2", children: "No collections yet" }), _jsx("p", { className: "text-gray-600 mb-4", children: "Create your first collection to start tracking your miniatures." })] })) : (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: collections.map((collection) => (_jsxs("div", { className: "bg-white rounded-lg shadow-md p-6", children: [_jsx("h3", { className: "text-lg font-semibold mb-2", children: collection.title || 'Untitled Collection' }), _jsxs("p", { className: "text-gray-600 text-sm mb-4", children: [collection.items.length, " items"] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { className: "bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm", children: "View" }), _jsx("button", { className: "bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm", children: "Edit" })] })] }, collection.id))) })), _jsxs("dialog", { id: "create-collection-modal", className: "modal", children: [_jsxs("div", { className: "modal-box", children: [_jsx("h3", { className: "font-bold text-lg mb-4", children: "Create New Collection" }), _jsxs("form", { onSubmit: handleCreateCollection, children: [_jsxs("div", { className: "form-control mb-4", children: [_jsx("label", { className: "label", children: _jsx("span", { className: "label-text", children: "Collection Name" }) }), _jsx("input", { type: "text", value: newCollectionTitle, onChange: (e) => setNewCollectionTitle(e.target.value), placeholder: "e.g., My Painted Minis, Wishlist", className: "input input-bordered w-full", required: true })] }), _jsxs("div", { className: "modal-action", children: [_jsx("button", { type: "button", onClick: () => document.getElementById('create-collection-modal')?.close(), className: "btn btn-ghost", children: "Cancel" }), _jsx("button", { type: "submit", className: "btn btn-primary", children: "Create" })] })] })] }), _jsx("form", { method: "dialog", className: "modal-backdrop", children: _jsx("button", { children: "close" }) })] })] }));
}
