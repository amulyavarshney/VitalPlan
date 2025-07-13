import React, { useState } from 'react';
import { Search, Filter, Star, ShoppingCart, Heart, Package, Truck, Shield } from 'lucide-react';
import type { MarketplaceItem } from '../../types';

interface MarketplaceProps {
  onAddToCart: (items: any[]) => void;
}

const mockMarketplaceItems: MarketplaceItem[] = [
  {
    id: 'market-1',
    name: 'Premium Whey Protein Isolate',
    description: 'Ultra-pure whey protein isolate with 25g protein per serving. Perfect for muscle building and recovery.',
    price: 49.99,
    originalPrice: 59.99,
    category: 'protein',
    brand: 'Optimum Nutrition',
    rating: 4.8,
    reviews: 3247,
    imageUrl: 'https://images.pexels.com/photos/4162449/pexels-photo-4162449.jpeg?auto=compress&cs=tinysrgb&w=400',
    inStock: true,
    features: ['25g Protein', 'Low Carb', 'Fast Absorption', 'Gluten Free', 'Third-Party Tested']
  },
  {
    id: 'market-2',
    name: 'Organic Spirulina Powder',
    description: 'Premium organic spirulina powder packed with nutrients, antioxidants, and complete proteins.',
    price: 24.99,
    category: 'superfoods',
    brand: 'Nutrex Hawaii',
    rating: 4.6,
    reviews: 1892,
    imageUrl: 'https://images.pexels.com/photos/4162451/pexels-photo-4162451.jpeg?auto=compress&cs=tinysrgb&w=400',
    inStock: true,
    features: ['Organic Certified', 'Complete Protein', 'Rich in Iron', 'Antioxidant Power', 'Vegan Friendly']
  },
  {
    id: 'market-3',
    name: 'Advanced Multivitamin Complex',
    description: 'Comprehensive multivitamin with 25+ essential vitamins and minerals for optimal health.',
    price: 34.99,
    originalPrice: 44.99,
    category: 'vitamins',
    brand: 'Garden of Life',
    rating: 4.7,
    reviews: 2156,
    imageUrl: 'https://images.pexels.com/photos/4162452/pexels-photo-4162452.jpeg?auto=compress&cs=tinysrgb&w=400',
    inStock: true,
    features: ['25+ Nutrients', 'Whole Food Based', 'Easy Absorption', 'Non-GMO', 'Vegetarian']
  },
  {
    id: 'market-4',
    name: 'Organic Quinoa Grain',
    description: 'Premium organic quinoa - a complete protein superfood perfect for healthy meals.',
    price: 12.99,
    category: 'organic-foods',
    brand: 'Ancient Harvest',
    rating: 4.5,
    reviews: 987,
    imageUrl: 'https://images.pexels.com/photos/4162453/pexels-photo-4162453.jpeg?auto=compress&cs=tinysrgb&w=400',
    inStock: true,
    features: ['Complete Protein', 'Gluten Free', 'High Fiber', 'Organic Certified', 'Versatile']
  },
  {
    id: 'market-5',
    name: 'Collagen Beauty Blend',
    description: 'Marine collagen peptides with hyaluronic acid and vitamin C for skin, hair, and nail health.',
    price: 39.99,
    category: 'supplements',
    brand: 'Vital Proteins',
    rating: 4.9,
    reviews: 4521,
    imageUrl: 'https://images.pexels.com/photos/4162454/pexels-photo-4162454.jpeg?auto=compress&cs=tinysrgb&w=400',
    inStock: true,
    features: ['Marine Collagen', 'Hyaluronic Acid', 'Vitamin C', 'Beauty Support', 'Unflavored']
  },
  {
    id: 'market-6',
    name: 'Organic Chia Seeds',
    description: 'Premium organic chia seeds rich in omega-3s, fiber, and plant-based protein.',
    price: 16.99,
    category: 'superfoods',
    brand: 'Spectrum Essentials',
    rating: 4.4,
    reviews: 1234,
    imageUrl: 'https://images.pexels.com/photos/4162455/pexels-photo-4162455.jpeg?auto=compress&cs=tinysrgb&w=400',
    inStock: true,
    features: ['Omega-3 Rich', 'High Fiber', 'Plant Protein', 'Organic', 'Versatile Use']
  },
  {
    id: 'market-7',
    name: 'Probiotic Complex 50 Billion',
    description: 'Advanced probiotic formula with 50 billion CFU and 12 strains for digestive and immune health.',
    price: 29.99,
    originalPrice: 39.99,
    category: 'supplements',
    brand: 'Renew Life',
    rating: 4.6,
    reviews: 2876,
    imageUrl: 'https://images.pexels.com/photos/4162456/pexels-photo-4162456.jpeg?auto=compress&cs=tinysrgb&w=400',
    inStock: true,
    features: ['50 Billion CFU', '12 Strains', 'Delayed Release', 'Shelf Stable', 'Gluten Free']
  },
  {
    id: 'market-8',
    name: 'Organic Matcha Powder',
    description: 'Ceremonial grade organic matcha powder rich in antioxidants and natural energy.',
    price: 28.99,
    category: 'superfoods',
    brand: 'Jade Leaf',
    rating: 4.8,
    reviews: 1567,
    imageUrl: 'https://images.pexels.com/photos/4162457/pexels-photo-4162457.jpeg?auto=compress&cs=tinysrgb&w=400',
    inStock: true,
    features: ['Ceremonial Grade', 'Organic', 'Antioxidant Rich', 'Natural Energy', 'Stone Ground']
  }
];

const categories = [
  { id: 'all', name: 'All Products', count: mockMarketplaceItems.length },
  { id: 'supplements', name: 'Supplements', count: mockMarketplaceItems.filter(item => item.category === 'supplements').length },
  { id: 'protein', name: 'Protein', count: mockMarketplaceItems.filter(item => item.category === 'protein').length },
  { id: 'vitamins', name: 'Vitamins', count: mockMarketplaceItems.filter(item => item.category === 'vitamins').length },
  { id: 'superfoods', name: 'Superfoods', count: mockMarketplaceItems.filter(item => item.category === 'superfoods').length },
  { id: 'organic-foods', name: 'Organic Foods', count: mockMarketplaceItems.filter(item => item.category === 'organic-foods').length }
];

export default function Marketplace({ onAddToCart }: MarketplaceProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [favorites, setFavorites] = useState<string[]>([]);

  const filteredItems = mockMarketplaceItems
    .filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.brand.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'rating':
          return b.rating - a.rating;
        case 'reviews':
          return b.reviews - a.reviews;
        default:
          return 0;
      }
    });

  const toggleFavorite = (itemId: string) => {
    setFavorites(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Premium Health Marketplace</h1>
        <p className="text-gray-600">Discover high-quality supplements, superfoods, and organic products from trusted brands</p>
      </div>

      {/* Trust Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="flex items-center p-4 bg-emerald-50 rounded-xl">
          <Shield className="w-8 h-8 text-emerald-600 mr-3" />
          <div>
            <div className="font-semibold text-gray-900">Quality Guaranteed</div>
            <div className="text-sm text-gray-600">Third-party tested products</div>
          </div>
        </div>
        <div className="flex items-center p-4 bg-blue-50 rounded-xl">
          <Truck className="w-8 h-8 text-blue-600 mr-3" />
          <div>
            <div className="font-semibold text-gray-900">Fast Shipping</div>
            <div className="text-sm text-gray-600">Free delivery over $50</div>
          </div>
        </div>
        <div className="flex items-center p-4 bg-purple-50 rounded-xl">
          <Package className="w-8 h-8 text-purple-600 mr-3" />
          <div>
            <div className="font-semibold text-gray-900">Easy Returns</div>
            <div className="text-sm text-gray-600">30-day money back guarantee</div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search products, brands, or ingredients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            />
          </div>
          
          <div className="flex gap-4">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            >
              <option value="featured">Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
              <option value="reviews">Most Reviews</option>
            </select>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 mt-4">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category.id
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.name} ({category.count})
            </button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-6">
        <p className="text-gray-600">
          Showing {filteredItems.length} of {mockMarketplaceItems.length} products
          {searchTerm && ` for "${searchTerm}"`}
        </p>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredItems.map(item => (
          <div key={item.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 group">
            <div className="relative">
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              
              {/* Discount Badge */}
              {item.originalPrice && (
                <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                  Save ${(item.originalPrice - item.price).toFixed(2)}
                </div>
              )}
              
              {/* Favorite Button */}
              <button
                onClick={() => toggleFavorite(item.id)}
                className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  favorites.includes(item.id)
                    ? 'bg-red-500 text-white'
                    : 'bg-white/80 text-gray-600 hover:bg-white'
                }`}
              >
                <Heart className={`w-4 h-4 ${favorites.includes(item.id) ? 'fill-current' : ''}`} />
              </button>

              {/* Stock Status */}
              <div className={`absolute bottom-3 left-3 px-2 py-1 rounded-full text-xs font-medium ${
                item.inStock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {item.inStock ? 'In Stock' : 'Out of Stock'}
              </div>
            </div>

            <div className="p-5">
              <div className="mb-2">
                <span className="text-xs text-gray-500 font-medium">{item.brand}</span>
              </div>
              
              <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{item.name}</h3>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>

              {/* Rating */}
              <div className="flex items-center mb-3">
                <div className="flex text-yellow-400 mr-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < Math.floor(item.rating) ? 'fill-current' : 'text-gray-300'}`} />
                  ))}
                </div>
                <span className="text-sm text-gray-600">
                  {item.rating} ({item.reviews.toLocaleString()})
                </span>
              </div>

              {/* Features */}
              <div className="flex flex-wrap gap-1 mb-4">
                {item.features.slice(0, 2).map((feature, index) => (
                  <span key={index} className="px-2 py-1 bg-emerald-50 text-emerald-700 text-xs rounded-full">
                    {feature}
                  </span>
                ))}
                {item.features.length > 2 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                    +{item.features.length - 2}
                  </span>
                )}
              </div>

              {/* Price */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-xl font-bold text-gray-900">${item.price}</span>
                  {item.originalPrice && (
                    <span className="text-sm text-gray-500 line-through ml-2">${item.originalPrice}</span>
                  )}
                </div>
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={() => onAddToCart([{
                  id: item.id,
                  name: item.name,
                  type: 'supplement',
                  price: item.price,
                  quantity: 1
                }])}
                disabled={!item.inStock}
                className={`w-full py-2 px-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center ${
                  item.inStock
                    ? 'bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                {item.inStock ? 'Add to Cart' : 'Out of Stock'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-600 mb-4">Try adjusting your search or filter criteria</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('all');
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-emerald-500 hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}