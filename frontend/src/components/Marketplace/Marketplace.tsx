import { useEffect, useState } from 'react';
import { Search, Star, ShoppingCart, Heart, Package, Truck, Shield, Loader } from 'lucide-react';
import type { MarketplaceItem } from '../../types';
import { marketplaceAPI, getApiErrorMessage } from '../../services/api';

interface MarketplaceProps {
  onAddToCart: (items: any[]) => void;
}

const categories = [
  { id: 'all', name: 'All Products' },
  { id: 'supplements', name: 'Supplements' },
  { id: 'protein', name: 'Protein' },
  { id: 'vitamins', name: 'Vitamins' },
  { id: 'superfoods', name: 'Superfoods' },
  { id: 'organic-foods', name: 'Organic Foods' },
];

export default function Marketplace({ onAddToCart }: MarketplaceProps) {
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadItems = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await marketplaceAPI.getItems({
          category: selectedCategory === 'all' ? undefined : selectedCategory,
          search: searchTerm || undefined,
          sort_by: sortBy,
          limit: 50,
        });
        setItems(data.items || []);
      } catch (err) {
        setError(getApiErrorMessage(err, 'Failed to load marketplace items'));
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = window.setTimeout(loadItems, 250);
    return () => window.clearTimeout(timer);
  }, [selectedCategory, searchTerm, sortBy]);

  const toggleFavorite = (itemId: string) => {
    setFavorites((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 overflow-x-hidden">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Premium Health Marketplace</h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Discover high-quality supplements, superfoods, and organic products from trusted brands
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="flex items-center p-4 bg-emerald-50 rounded-xl min-w-0">
          <Shield className="w-8 h-8 text-emerald-600 mr-3 flex-shrink-0" />
          <div className="min-w-0">
            <div className="font-semibold text-gray-900">Quality Guaranteed</div>
            <div className="text-sm text-gray-600">Third-party tested products</div>
          </div>
        </div>
        <div className="flex items-center p-4 bg-blue-50 rounded-xl min-w-0">
          <Truck className="w-8 h-8 text-blue-600 mr-3 flex-shrink-0" />
          <div className="min-w-0">
            <div className="font-semibold text-gray-900">Fast Delivery</div>
            <div className="text-sm text-gray-600">Same-day available</div>
          </div>
        </div>
        <div className="flex items-center p-4 bg-purple-50 rounded-xl min-w-0">
          <Package className="w-8 h-8 text-purple-600 mr-3 flex-shrink-0" />
          <div className="min-w-0">
            <div className="font-semibold text-gray-900">Curated Selection</div>
            <div className="text-sm text-gray-600">Expert-reviewed products</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-8">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative min-w-0">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search products, brands, or ingredients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 min-w-0">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full sm:w-auto min-w-0 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full sm:w-auto min-w-0 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="featured">Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
              <option value="reviews">Most Reviews</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20 text-gray-600">
          <Loader className="w-6 h-6 animate-spin mr-2" />
          Loading products...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className="relative">
                  <img src={item.imageUrl} alt={item.name} className="w-full h-48 object-cover" />
                  <button
                    onClick={() => toggleFavorite(item.id)}
                    className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:bg-gray-50"
                  >
                    <Heart
                      className={`w-5 h-5 ${
                        favorites.includes(item.id) ? 'text-red-500 fill-current' : 'text-gray-400'
                      }`}
                    />
                  </button>
                  {item.originalPrice && (
                    <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      SALE
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <div className="text-sm text-emerald-600 font-medium mb-1">{item.brand}</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.name}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{item.description}</p>

                  <div className="flex items-center mb-4">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="ml-1 text-sm font-medium text-gray-900">{item.rating}</span>
                      <span className="ml-1 text-sm text-gray-500">({item.reviews})</span>
                    </div>
                    <div className="ml-auto text-sm text-gray-500">
                      {item.inStock ? 'In Stock' : 'Out of Stock'}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {item.features?.slice(0, 3).map((feature) => (
                      <span
                        key={feature}
                        className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-bold text-gray-900">${item.price}</span>
                      {item.originalPrice && (
                        <span className="ml-2 text-sm text-gray-500 line-through">
                          ${item.originalPrice}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() =>
                        onAddToCart([
                          {
                            id: item.id,
                            name: item.name,
                            price: item.price,
                            quantity: 1,
                            type: item.category === 'organic-foods' ? 'grocery' : 'supplement',
                          },
                        ])
                      }
                      disabled={!item.inStock}
                      className="inline-flex items-center px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 disabled:opacity-50 transition-colors"
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Add
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {items.length === 0 && !error && (
            <div className="text-center py-16 text-gray-600">No products found. Try another search.</div>
          )}
        </>
      )}
    </div>
  );
}
