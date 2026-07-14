import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Menu, User, ShoppingCart, Heart, Scan, Store, X, LogIn, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface HeaderProps {
  cartItemsCount?: number;
}

const baseNavItems = [
  { to: '/', label: 'Home', icon: Heart, end: true },
  { to: '/profile', label: 'Profile', icon: User },
  { to: '/plans', label: 'Diet Plans', icon: Heart },
  { to: '/marketplace', label: 'Marketplace', icon: Store },
  { to: '/scanner', label: 'Scanner', icon: Scan },
  { to: '/orders', label: 'Orders', icon: ShoppingCart },
];

export default function Header({ cartItemsCount = 0 }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = user?.isAdmin
    ? [...baseNavItems, { to: '/admin', label: 'Admin', icon: Shield }]
    : baseNavItems;

  const linkClass = (isActive: boolean) =>
    `inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
      isActive ? 'text-emerald-600 bg-emerald-50' : 'text-gray-600 hover:text-emerald-600 hover:bg-gray-50'
    }`;

  return (
    <>
      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50 safe-top">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <NavLink to="/" className="flex-shrink-0 flex items-center">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Heart className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
              </div>
              <span className="ml-2 text-lg sm:text-xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                VitalPlan
              </span>
            </NavLink>

            <nav className="hidden lg:flex items-center space-x-6">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) => linkClass(isActive)}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.label}
                    {item.to === '/orders' && cartItemsCount > 0 && (
                      <span className="ml-2 bg-emerald-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {cartItemsCount}
                      </span>
                    )}
                  </NavLink>
                );
              })}
              {isAuthenticated ? (
                <button
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-emerald-600"
                  title={user?.email}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign out
                </button>
              ) : (
                <NavLink
                  to="/login"
                  className={({ isActive }) =>
                    isActive || location.pathname === '/register'
                      ? linkClass(true)
                      : 'inline-flex items-center px-3 py-2 text-sm font-medium text-emerald-600 bg-emerald-50 rounded-md'
                  }
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign in
                </NavLink>
              )}
            </nav>

            <div className="lg:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-emerald-600 hover:bg-gray-50"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {isMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setIsMenuOpen(false)}>
          <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <span className="text-lg font-semibold text-gray-900">Menu</span>
              <button onClick={() => setIsMenuOpen(false)} className="p-2 rounded-md text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="py-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setIsMenuOpen(false)}
                    className={({ isActive }) =>
                      `w-full flex items-center px-6 py-4 text-base font-medium transition-colors ${
                        isActive
                          ? 'text-emerald-600 bg-emerald-50 border-r-2 border-emerald-600'
                          : 'text-gray-600 hover:text-emerald-600 hover:bg-gray-50'
                      }`
                    }
                  >
                    <Icon className="w-6 h-6 mr-4" />
                    {item.label}
                    {item.to === '/orders' && cartItemsCount > 0 && (
                      <span className="ml-auto bg-emerald-500 text-white text-sm rounded-full h-6 w-6 flex items-center justify-center">
                        {cartItemsCount}
                      </span>
                    )}
                  </NavLink>
                );
              })}
              <button
                onClick={() => {
                  if (isAuthenticated) {
                    logout();
                    navigate('/');
                  } else {
                    navigate('/login');
                  }
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center px-6 py-4 text-base font-medium text-gray-600 hover:text-emerald-600 hover:bg-gray-50"
              >
                {isAuthenticated ? (
                  <>
                    <LogOut className="w-6 h-6 mr-4" />
                    Sign out
                  </>
                ) : (
                  <>
                    <LogIn className="w-6 h-6 mr-4" />
                    Sign in
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
