'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, CheckCircle } from 'lucide-react';

export default function DeviceCompatibility() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedPhone, setSelectedPhone] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);

  // Confetti effect
  useEffect(() => {
    if (showConfetti) {
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 10000 };

      function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
      }

      const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          clearInterval(interval);
          return;
        }

        const particleCount = 50 * (timeLeft / duration);
        
        // Create confetti particles
        const colors = ['#0EA5E9', '#3B82F6', '#1E90FF', '#0EA5E9', '#3B82F6'];
        for (let i = 0; i < particleCount; i++) {
          createConfetti(colors[Math.floor(Math.random() * colors.length)]);
        }
      }, 250);

      return () => clearInterval(interval);
    }
  }, [showConfetti]);

  const createConfetti = (color) => {
    const confetti = document.createElement('div');
    confetti.style.position = 'fixed';
    confetti.style.width = '10px';
    confetti.style.height = '10px';
    confetti.style.backgroundColor = color;
    confetti.style.left = Math.random() * 100 + '%';
    confetti.style.top = '-10px';
    confetti.style.opacity = '1';
    confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
    confetti.style.zIndex = '9999';
    confetti.style.pointerEvents = 'none';
    document.body.appendChild(confetti);

    const animation = confetti.animate([
      { 
        transform: `translateY(0) rotate(0deg)`,
        opacity: 1
      },
      { 
        transform: `translateY(${window.innerHeight + 10}px) rotate(${Math.random() * 720}deg)`,
        opacity: 0
      }
    ], {
      duration: Math.random() * 2000 + 2000,
      easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    });

    animation.onfinish = () => confetti.remove();
  };

  const handlePhoneSelect = (brand, model) => {
    setSelectedPhone({ brand, model });
    setShowConfetti(true);
    
    // Reset after 3 seconds
    setTimeout(() => {
      setShowConfetti(false);
    }, 3000);
  };

  const phones = {
    apple: {
      name: 'Apple iPhone',
      logo: '🍎',
      models: [
        'iPhone 15 Pro Max',
        'iPhone 15 Pro',
        'iPhone 15 Plus',
        'iPhone 15',
        'iPhone 14 Pro Max',
        'iPhone 14 Pro',
        'iPhone 14 Plus',
        'iPhone 14',
        'iPhone 13 Pro Max',
        'iPhone 13 Pro',
        'iPhone 13',
        'iPhone 13 mini',
        'iPhone 12 Pro Max',
        'iPhone 12 Pro',
        'iPhone 12',
        'iPhone 12 mini',
        'iPhone SE (2020)',
        'iPhone SE (2022)',
        'iPhone 11 Pro Max',
        'iPhone 11 Pro',
        'iPhone 11',
        'iPhone XS Max',
        'iPhone XS',
        'iPhone XR'
      ]
    },
    samsung: {
      name: 'Samsung Galaxy',
      logo: '📱',
      models: [
        'Galaxy S24 Ultra',
        'Galaxy S24+',
        'Galaxy S24',
        'Galaxy S23 Ultra',
        'Galaxy S23+',
        'Galaxy S23',
        'Galaxy S23 FE',
        'Galaxy S22 Ultra',
        'Galaxy S22+',
        'Galaxy S22',
        'Galaxy S21 Ultra 5G',
        'Galaxy S21+ 5G',
        'Galaxy S21 5G',
        'Galaxy S21 FE 5G',
        'Galaxy S20 Ultra',
        'Galaxy S20+',
        'Galaxy S20',
        'Galaxy S20 FE',
        'Galaxy Z Fold 5',
        'Galaxy Z Fold 4',
        'Galaxy Z Fold 3',
        'Galaxy Z Fold 2',
        'Galaxy Z Flip 5',
        'Galaxy Z Flip 4',
        'Galaxy Z Flip 3',
        'Galaxy Z Flip',
        'Galaxy Note 20 Ultra',
        'Galaxy Note 20'
      ]
    },
    google: {
      name: 'Google Pixel',
      logo: '🔵',
      models: [
        'Pixel 8 Pro',
        'Pixel 8',
        'Pixel 7 Pro',
        'Pixel 7',
        'Pixel 7a',
        'Pixel 6 Pro',
        'Pixel 6',
        'Pixel 6a',
        'Pixel 5',
        'Pixel 5a',
        'Pixel 4 XL',
        'Pixel 4',
        'Pixel 4a',
        'Pixel 3 XL',
        'Pixel 3',
        'Pixel 3a XL',
        'Pixel 3a'
      ]
    },
    motorola: {
      name: 'Motorola',
      logo: '📲',
      models: [
        'Razr 5G',
        'Razr 40 Ultra',
        'Razr 40',
        'Edge 40 Pro',
        'Edge 40',
        'Edge 30 Ultra',
        'Edge 30 Pro',
        'Edge 30',
        'Edge+',
        'Edge',
        'G52J 5G',
        'G53J 5G'
      ]
    },
    xiaomi: {
      name: 'Xiaomi',
      logo: '⚡',
      models: [
        'Xiaomi 14 Ultra',
        'Xiaomi 14 Pro',
        'Xiaomi 14',
        'Xiaomi 13 Ultra',
        'Xiaomi 13 Pro',
        'Xiaomi 13',
        'Xiaomi 13 Lite',
        'Xiaomi 12T Pro',
        'Xiaomi 12T',
        'Xiaomi 12 Pro',
        'Xiaomi 12',
        'Xiaomi 12 Lite',
        '13T Pro',
        '13T',
        '12 Lite',
        '11T Pro',
        '11T'
      ]
    },
    oppo: {
      name: 'Oppo',
      logo: '🟢',
      models: [
        'Find X5 Pro',
        'Find X5',
        'Find X3 Pro',
        'Find X3',
        'Find N2 Flip',
        'Reno 9A',
        'Reno 10 Pro+',
        'Reno 10 Pro',
        'Reno 10',
        'Reno 9 Pro+',
        'Reno 9 Pro',
        'Reno 8 Pro',
        'Reno 6 Pro 5G',
        'Reno 5A',
        'A55s 5G'
      ]
    },
    oneplus: {
      name: 'OnePlus',
      logo: '🔴',
      models: [
        'OnePlus 12',
        'OnePlus 11',
        'OnePlus 10 Pro',
        'OnePlus 10T',
        'OnePlus 9 Pro',
        'OnePlus 9',
        'OnePlus 8T',
        'OnePlus 8 Pro',
        'OnePlus 8'
      ]
    },
    huawei: {
      name: 'Huawei',
      logo: '🟠',
      models: [
        'P40 Pro',
        'P40',
        'Mate 40 Pro',
        'P50 Pro',
        'Pura 70 Ultra',
        'Pura 70 Pro',
        'Pura 70'
      ]
    },
    sony: {
      name: 'Sony',
      logo: '🎮',
      models: [
        'Xperia 1 V',
        'Xperia 1 IV',
        'Xperia 5 V',
        'Xperia 5 IV',
        'Xperia 10 V',
        'Xperia 10 IV',
        'Xperia 10 III Lite',
        'Xperia 1 III',
        'Xperia 5 III'
      ]
    },
    honor: {
      name: 'Honor',
      logo: '💫',
      models: [
        'Magic 6 Pro',
        'Magic 5 Pro',
        'Magic 4 Pro',
        '90 5G',
        'X9b',
        'X8b'
      ]
    },
    fairphone: {
      name: 'Fairphone',
      logo: '♻️',
      models: [
        'Fairphone 5',
        'Fairphone 4'
      ]
    },
    nothing: {
      name: 'Nothing',
      logo: '⚪',
      models: [
        'Nothing Phone (2a)',
        'Nothing Phone (2)',
        'Nothing Phone (1)'
      ]
    }
  };

  const brands = Object.keys(phones);

  const filterPhones = () => {
    let filtered = {};
    
    Object.keys(phones).forEach(brand => {
      if (selectedBrand !== 'all' && brand !== selectedBrand) return;
      
      const filteredModels = phones[brand].models.filter(model =>
        model.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      if (filteredModels.length > 0) {
        filtered[brand] = {
          ...phones[brand],
          models: filteredModels
        };
      }
    });
    
    return filtered;
  };

  const filteredPhones = filterPhones();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="bg-tufts-blue rounded-2xl shadow-lg p-8 md:p-12 mb-8 text-white">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">eSIM Compatible Phones</h1>
            <p className="text-xl text-blue-100 mb-6">
              Find your phone model and check if it supports eSIM technology. All devices listed below are eSIM compatible.
            </p>
            
            {/* Search Box */}
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search for phone model (e.g., iPhone 15, Galaxy S24)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white shadow-lg"
              />
            </div>

            {/* Brand Filter */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedBrand('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedBrand === 'all'
                    ? 'bg-white text-tufts-blue'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                All Brands
              </button>
              {brands.map(brand => (
                <button
                  key={brand}
                  onClick={() => setSelectedBrand(brand)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedBrand === brand
                      ? 'bg-white text-tufts-blue'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  {phones[brand].logo} {phones[brand].name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Success Modal */}
        {selectedPhone && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center transform animate-bounce-in">
              <div className="mb-4 flex justify-center">
                <CheckCircle className="w-20 h-20 text-green-500" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">🎉 You're Ready to Go!</h2>
              <p className="text-lg text-gray-600 mb-4">
                <strong>{selectedPhone.model}</strong> supports eSIM!
              </p>
              <p className="text-gray-500 mb-6">
                Your {selectedPhone.brand} is compatible with RoamJet eSIM plans. Get connected in minutes!
              </p>
              <div className="space-y-3">
                <Link
                  href="/esim-plans"
                  className="block w-full bg-tufts-blue text-white font-semibold px-6 py-3 rounded-lg hover:bg-cobalt-blue hover:shadow-lg transition-all"
                >
                  Browse eSIM Plans →
                </Link>
                <button
                  onClick={() => setSelectedPhone(null)}
                  className="block w-full bg-gray-100 text-gray-700 font-medium px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Check Another Device
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Phone Models List */}
        <div className="space-y-6">
          {Object.keys(filteredPhones).length > 0 ? (
            Object.keys(filteredPhones).map(brand => (
              <div key={brand} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center mb-4 pb-4 border-b border-gray-200">
                  <span className="text-3xl mr-3">{filteredPhones[brand].logo}</span>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{filteredPhones[brand].name}</h2>
                    <p className="text-sm text-gray-500">{filteredPhones[brand].models.length} compatible models</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {filteredPhones[brand].models.map((model, index) => (
                    <button
                      key={index}
                      onClick={() => handlePhoneSelect(filteredPhones[brand].name, model)}
                      className="bg-gray-50 hover:bg-blue-50 rounded-lg p-3 transition-all border border-gray-200 hover:border-blue-300 hover:shadow-md cursor-pointer text-left w-full"
                    >
                      <p className="text-sm font-medium text-gray-900">{model}</p>
                    </button>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <p className="text-gray-500 text-lg">No phones found matching your search.</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedBrand('all');
                }}
                className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>

        {/* Important Notes */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">⚠️ Important Requirements:</h3>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start">
              <span className="text-yellow-600 mr-2">•</span>
              <span><strong>Device must be carrier-unlocked</strong> to use eSIM from RoamJet</span>
            </li>
            <li className="flex items-start">
              <span className="text-yellow-600 mr-2">•</span>
              <span>iPhone requires <strong>iOS 12.1 or later</strong></span>
            </li>
            <li className="flex items-start">
              <span className="text-yellow-600 mr-2">•</span>
              <span>Android devices require <strong>Android 9.0 (Pie) or later</strong></span>
            </li>
            <li className="flex items-start">
              <span className="text-yellow-600 mr-2">•</span>
              <span>Some carriers may restrict eSIM functionality even on supported devices</span>
            </li>
          </ul>
        </div>

        {/* How to Check */}
        <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">How to Verify eSIM Support on Your Device</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                <span className="text-2xl mr-2">🍎</span> For iPhone
              </h4>
              <ol className="list-decimal pl-5 space-y-2 text-gray-700">
                <li>Open <strong>Settings</strong></li>
                <li>Tap on <strong>Cellular</strong> or <strong>Mobile Data</strong></li>
                <li>If you see <strong>"Add Cellular Plan"</strong> or <strong>"Add eSIM"</strong>, your device supports eSIM</li>
                <li>You can also dial <strong>*#06#</strong> - if you see an EID number, eSIM is supported</li>
              </ol>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                <span className="text-2xl mr-2">🤖</span> For Android
              </h4>
              <ol className="list-decimal pl-5 space-y-2 text-gray-700">
                <li>Open <strong>Settings</strong></li>
                <li>Go to <strong>Network & Internet</strong> or <strong>Connections</strong></li>
                <li>Tap on <strong>Mobile Network</strong> or <strong>SIM card manager</strong></li>
                <li>If you see <strong>"Add carrier"</strong> or <strong>"Add mobile plan"</strong>, your device supports eSIM</li>
                <li>You can also dial <strong>*#06#</strong> to check for an EID number</li>
              </ol>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8 text-center bg-tufts-blue rounded-lg p-8 text-white">
          <h3 className="text-2xl font-bold mb-4">Device Compatible? Get Connected Now!</h3>
          <p className="mb-6 text-lg">Browse our eSIM plans for 200+ countries worldwide</p>
          <Link
            href="/esim-plans"
            className="inline-block bg-white text-tufts-blue font-semibold px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors shadow-lg"
          >
            View eSIM Plans →
          </Link>
        </div>

        {/* Back to Home */}
        <div className="mt-8 text-center">
          <Link 
            href="/" 
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Home
          </Link>
        </div>
      </div>

      <style jsx>{`
        @keyframes bounce-in {
          0% {
            opacity: 0;
            transform: scale(0.3);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            transform: scale(1);
          }
        }
        .animate-bounce-in {
          animation: bounce-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
