import React from 'react';
import { ArrowRight, Sparkles, Target, Heart, Users, Award, TrendingUp } from 'lucide-react';

interface HeroProps {
  onGetStarted: () => void;
}

export default function Hero({ onGetStarted }: HeroProps) {
  const stats = [
    { label: 'Active Users', value: '50K+', icon: Users },
    { label: 'Success Rate', value: '94%', icon: Award },
    { label: 'Plans Created', value: '100K+', icon: TrendingUp },
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Fitness Enthusiast',
      content: 'VitalPlan helped me achieve my muscle-building goals with personalized nutrition that actually works!',
      avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop'
    },
    {
      name: 'Michael Chen',
      role: 'Busy Professional',
      content: 'The AI recommendations are spot-on. My skin has never looked better since following my custom plan.',
      avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop'
    },
    {
      name: 'Emma Davis',
      role: 'Health Coach',
      content: 'I recommend VitalPlan to all my clients. The science-backed approach delivers real results.',
      avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop'
    }
  ];

  return (
    <div className="relative overflow-hidden">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-50">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-blue-500/10"></div>
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="sm:text-center lg:text-left">
                <div className="inline-flex items-center px-3 sm:px-4 py-2 rounded-full bg-emerald-100 text-emerald-800 text-xs sm:text-sm font-medium mb-4 sm:mb-6">
                  <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  AI-Powered Nutrition Science
                </div>
                
                <h1 className="text-3xl sm:text-4xl tracking-tight font-extrabold text-gray-900 md:text-5xl lg:text-6xl">
                  <span className="block xl:inline">Transform Your Health</span>{' '}
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-blue-600 xl:inline">
                    With Smart Nutrition
                  </span>
                </h1>
                
                <p className="mt-3 text-sm sm:text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  Get personalized diet plans powered by AI, scan foods for instant nutrition info, 
                  and shop premium supplements - all in one intelligent platform designed for your wellness journey.
                </p>
                
                <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row sm:justify-center lg:justify-start gap-3 sm:gap-4">
                  <button
                    onClick={onGetStarted}
                    className="group inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 border border-transparent text-sm sm:text-base font-medium rounded-2xl text-white bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                  >
                    Start Your Journey
                    <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                  
                  <button className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 border-2 border-gray-300 text-sm sm:text-base font-medium rounded-2xl text-gray-700 bg-white hover:bg-gray-50 hover:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-300">
                    Watch Demo
                  </button>
                </div>

                {/* Stats - Mobile Optimized */}
                <div className="mt-8 sm:mt-12 grid grid-cols-3 gap-2 sm:gap-4 max-w-lg mx-auto lg:mx-0">
                  {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                      <div key={index} className="text-center">
                        <div className="inline-flex items-center justify-center w-8 h-8 sm:w-12 sm:h-12 bg-white rounded-xl shadow-md mb-2">
                          <Icon className="w-4 h-4 sm:w-6 sm:h-6 text-emerald-600" />
                        </div>
                        <p className="text-sm sm:text-lg font-bold text-gray-900">{stat.value}</p>
                        <p className="text-xs text-gray-500">{stat.label}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </main>
          </div>
        </div>
        
        <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
          <div className="relative h-56 w-full sm:h-72 md:h-96 lg:w-full lg:h-full">
            <img
              className="h-full w-full object-cover rounded-l-3xl lg:rounded-l-none"
              src="https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800"
              alt="Healthy lifestyle"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-l-3xl lg:rounded-l-none"></div>
          </div>
        </div>
      </div>

      {/* Features Section - Mobile Optimized */}
      <div className="py-12 sm:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Everything You Need for Optimal Health</h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
              Comprehensive tools and insights to help you achieve your wellness goals
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div className="group text-center p-4 sm:p-6 rounded-2xl hover:bg-emerald-50 transition-all duration-300">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-emerald-100 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-600" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">AI-Powered Plans</h3>
              <p className="text-gray-600 text-sm">Personalized nutrition recommendations based on your unique goals and preferences</p>
            </div>

            <div className="group text-center p-4 sm:p-6 rounded-2xl hover:bg-blue-50 transition-all duration-300">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                <Target className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Food Scanner</h3>
              <p className="text-gray-600 text-sm">Instantly scan any food item to get detailed nutrition information and calorie counts</p>
            </div>

            <div className="group text-center p-4 sm:p-6 rounded-2xl hover:bg-purple-50 transition-all duration-300">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-purple-100 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Premium Marketplace</h3>
              <p className="text-gray-600 text-sm">Curated selection of high-quality supplements and organic foods from trusted brands</p>
            </div>

            <div className="group text-center p-4 sm:p-6 rounded-2xl hover:bg-orange-50 transition-all duration-300">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-orange-100 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Progress Tracking</h3>
              <p className="text-gray-600 text-sm">Monitor your health journey with detailed analytics and personalized insights</p>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Section - Mobile Optimized */}
      <div className="py-12 sm:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Trusted by Health Enthusiasts</h2>
            <p className="text-base sm:text-lg text-gray-600">See what our community has to say about their transformation</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center mb-4">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover mr-3 sm:mr-4"
                  />
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm sm:text-base">{testimonial.name}</h4>
                    <p className="text-xs sm:text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-700 italic text-sm sm:text-base">"{testimonial.content}"</p>
                <div className="flex text-yellow-400 mt-3">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-3 h-3 sm:w-4 sm:h-4 fill-current" viewBox="0 0 20 20">
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                    </svg>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section - Mobile Optimized */}
      <div className="py-12 sm:py-16 bg-gradient-to-r from-emerald-600 to-blue-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Ready to Transform Your Health?</h2>
          <p className="text-lg sm:text-xl text-emerald-100 mb-6 sm:mb-8">
            Join thousands of users who have already started their wellness journey with VitalPlan
          </p>
          <button
            onClick={onGetStarted}
            className="inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 border-2 border-white text-base sm:text-lg font-medium rounded-2xl text-emerald-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            Get Started Free
            <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}