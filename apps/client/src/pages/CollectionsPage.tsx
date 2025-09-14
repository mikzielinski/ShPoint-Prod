import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { getCollections, createCollection, type Collection } from '../lib/api';

export default function CollectionsPage() {
  const { auth } = useAuth();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
    } catch (err) {
      setError('Failed to load collections');
      console.error('Error loading collections:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectionTitle.trim()) return;

    try {
      const { collection } = await createCollection(newCollectionTitle.trim());
      setCollections(prev => [collection, ...prev]);
      setNewCollectionTitle('');
    } catch (err) {
      setError('Failed to create collection');
      console.error('Error creating collection:', err);
    }
  };

  if (auth.status === 'loading') {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (auth.status === 'anonymous') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Collections</h1>
        <p className="text-gray-600 mb-4">Please log in to manage your collections.</p>
        <a 
          href="/auth/google" 
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Login with Google
        </a>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Collections</h1>
        <button
          onClick={() => document.getElementById('create-collection-modal')?.showModal()}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          New Collection
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : collections.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">No collections yet</h2>
          <p className="text-gray-600 mb-4">Create your first collection to start tracking your miniatures.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((collection) => (
            <div key={collection.id} className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-2">
                {collection.title || 'Untitled Collection'}
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                {collection.items.length} items
              </p>
              <div className="flex gap-2">
                <button className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm">
                  View
                </button>
                <button className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm">
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Collection Modal */}
      <dialog id="create-collection-modal" className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4">Create New Collection</h3>
          <form onSubmit={handleCreateCollection}>
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text">Collection Name</span>
              </label>
              <input
                type="text"
                value={newCollectionTitle}
                onChange={(e) => setNewCollectionTitle(e.target.value)}
                placeholder="e.g., My Painted Minis, Wishlist"
                className="input input-bordered w-full"
                required
              />
            </div>
            <div className="modal-action">
              <button
                type="button"
                onClick={() => document.getElementById('create-collection-modal')?.close()}
                className="btn btn-ghost"
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Create
              </button>
            </div>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </div>
  );
}
