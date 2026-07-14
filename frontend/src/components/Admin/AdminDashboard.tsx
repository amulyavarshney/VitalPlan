import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, Users, Plus, RefreshCw, Shield } from 'lucide-react';
import {
  adminAPI,
  getApiErrorMessage,
  type AdminMarketplaceItem,
  type AuthUser,
} from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

type Tab = 'products' | 'users';

const emptyProductForm = {
  sku: '',
  name: '',
  description: '',
  price: '',
  category: 'protein',
  brand: '',
  imageUrl: '',
  inStock: true,
};

export default function AdminDashboard() {
  const { spoofUser } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('products');
  const [products, setProducts] = useState<AdminMarketplaceItem[]>([]);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyProductForm);
  const [saving, setSaving] = useState(false);

  const loadProducts = useCallback(async () => {
    const items = await adminAPI.listMarketplaceItems();
    setProducts(items);
  }, []);

  const loadUsers = useCallback(async () => {
    const data = await adminAPI.getUsers();
    setUsers(data);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (tab === 'products') {
        await loadProducts();
      } else {
        await loadUsers();
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load admin data'));
    } finally {
      setLoading(false);
    }
  }, [tab, loadProducts, loadUsers]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleCreateProduct = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setInfo(null);
    try {
      await adminAPI.createMarketplaceItem({
        sku: form.sku.trim(),
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        category: form.category,
        brand: form.brand.trim(),
        imageUrl: form.imageUrl.trim() || undefined,
        inStock: form.inStock,
        features: [],
      });
      setForm(emptyProductForm);
      setShowForm(false);
      setInfo('Product created');
      await loadProducts();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to create product'));
    } finally {
      setSaving(false);
    }
  };

  const toggleProductActive = async (item: AdminMarketplaceItem) => {
    setError(null);
    try {
      if (item.isActive) {
        await adminAPI.deactivateMarketplaceItem(item.id);
        setInfo(`Deactivated ${item.name}`);
      } else {
        await adminAPI.updateMarketplaceItem(item.id, { isActive: true, inStock: true });
        setInfo(`Reactivated ${item.name}`);
      }
      await loadProducts();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to update product'));
    }
  };

  const toggleStock = async (item: AdminMarketplaceItem) => {
    setError(null);
    try {
      await adminAPI.updateMarketplaceItem(item.id, { inStock: !item.inStock });
      await loadProducts();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to update stock'));
    }
  };

  const toggleUserActive = async (user: AuthUser) => {
    setError(null);
    try {
      await adminAPI.updateUser(user.id, { isActive: !user.isActive });
      setInfo(`${user.isActive ? 'Deactivated' : 'Activated'} ${user.email}`);
      await loadUsers();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to update user'));
    }
  };

  const verifyUser = async (user: AuthUser) => {
    setError(null);
    try {
      await adminAPI.updateUser(user.id, { isVerified: true });
      setInfo(`Verified ${user.email}`);
      await loadUsers();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to verify user'));
    }
  };

  const impersonateUser = async (user: AuthUser) => {
    setError(null);
    try {
      await spoofUser(user.email);
      navigate('/profile');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to impersonate user'));
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 inline-flex items-center gap-2">
            <Shield className="w-6 h-6 text-emerald-600" />
            Admin
          </h1>
          <p className="text-gray-600 text-sm mt-1">Manage marketplace products and user accounts.</p>
        </div>
        <Link to="/marketplace" className="text-sm text-emerald-600 hover:underline">
          View storefront
        </Link>
      </div>

      <div className="inline-flex rounded-xl border border-gray-200 bg-white p-1 mb-6">
        <button
          type="button"
          onClick={() => setTab('products')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
            tab === 'products' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600'
          }`}
        >
          <Package className="w-4 h-4" />
          Products
        </button>
        <button
          type="button"
          onClick={() => setTab('users')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
            tab === 'users' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600'
          }`}
        >
          <Users className="w-4 h-4" />
          Users
        </button>
      </div>

      {(error || info) && (
        <div className="mb-4 space-y-2">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>
          )}
          {info && (
            <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
              {info}
            </p>
          )}
        </div>
      )}

      {tab === 'products' ? (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Marketplace catalog</h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={refresh}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                type="button"
                onClick={() => setShowForm((v) => !v)}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm text-white bg-emerald-600 rounded-xl hover:bg-emerald-700"
              >
                <Plus className="w-4 h-4" />
                Add product
              </button>
            </div>
          </div>

          {showForm && (
            <form onSubmit={handleCreateProduct} className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6 p-4 border border-gray-200 rounded-xl">
              <input
                required
                placeholder="SKU"
                value={form.sku}
                onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-xl"
              />
              <input
                required
                placeholder="Name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-xl"
              />
              <input
                required
                placeholder="Brand"
                value={form.brand}
                onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-xl"
              />
              <input
                required
                type="number"
                min="0.01"
                step="0.01"
                placeholder="Price"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-xl"
              />
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-xl"
              >
                <option value="protein">protein</option>
                <option value="vitamins">vitamins</option>
                <option value="supplements">supplements</option>
                <option value="snacks">snacks</option>
                <option value="other">other</option>
              </select>
              <input
                placeholder="Image URL (optional)"
                value={form.imageUrl}
                onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-xl"
              />
              <textarea
                required
                placeholder="Description"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="md:col-span-2 px-3 py-2 border border-gray-300 rounded-xl"
                rows={3}
              />
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.inStock}
                  onChange={(e) => setForm((f) => ({ ...f, inStock: e.target.checked }))}
                />
                In stock
              </label>
              <button
                type="submit"
                disabled={saving}
                className="md:col-span-2 py-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Create product'}
              </button>
            </form>
          )}

          {loading && <p className="text-sm text-gray-500">Loading products...</p>}
          <div className="space-y-3">
            {products.map((item) => (
              <div key={item.id} className="border border-gray-200 rounded-xl p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {item.name}{' '}
                      <span className="text-xs font-normal text-gray-500">({item.sku})</span>
                    </p>
                    <p className="text-sm text-gray-600">
                      {item.brand} · {item.category} · ${Number(item.price).toFixed(2)}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs ${
                          item.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {item.isActive ? 'active' : 'inactive'}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs ${
                          item.inStock ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.inStock ? 'in stock' : 'out of stock'}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => toggleStock(item)}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Toggle stock
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleProductActive(item)}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      {item.isActive ? 'Deactivate' : 'Reactivate'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Users</h2>
            <button
              type="button"
              onClick={refresh}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
          {loading && <p className="text-sm text-gray-500">Loading users...</p>}
          <div className="space-y-3">
            {users.map((user) => (
              <div key={user.id} className="border border-gray-200 rounded-xl p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{user.name}</p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {user.isAdmin && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-800">admin</span>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs ${
                          user.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {user.isActive ? 'active' : 'inactive'}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs ${
                          user.isVerified ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {user.isVerified ? 'verified' : 'unverified'}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {!user.isVerified && (
                      <button
                        type="button"
                        onClick={() => verifyUser(user)}
                        className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Mark verified
                      </button>
                    )}
                    {!user.isAdmin && user.isActive && (
                      <button
                        type="button"
                        onClick={() => impersonateUser(user)}
                        className="px-3 py-1.5 text-sm border border-amber-300 text-amber-800 rounded-lg hover:bg-amber-50"
                      >
                        Impersonate
                      </button>
                    )}
                    {!user.isAdmin && (
                      <button
                        type="button"
                        onClick={() => toggleUserActive(user)}
                        className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        {user.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
