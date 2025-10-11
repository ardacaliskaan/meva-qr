'use client'
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coffee, Utensils, ChefHat, Heart } from 'lucide-react';

const MevaLoadingScreen = ({ onComplete, tableNumber }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const steps = [
    { icon: Coffee, text: "Meva Cafe'ye Hoş Geldiniz", duration: 1200 },
    { icon: Utensils, text: "Menümüz hazırlanıyor", duration: 1000 },
    { icon: ChefHat, text: `Masa ${tableNumber} için menü yükleniyor`, duration: 800 }
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        setIsComplete(true);
        setTimeout(() => {
          onComplete();
        }, 500);
      }
    }, steps[currentStep].duration);

    return () => clearTimeout(timer);
  }, [currentStep, onComplete, tableNumber]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 flex items-center justify-center z-50">
      <div className="text-center px-6">
        {/* Logo Area */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-8"
        >
          <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
            <Coffee className="w-12 h-12 text-white" />
          </div>
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent"
          >
            MEVA CAFE
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-amber-600 font-medium mt-2"
          >
            Lezzet Durağınız
          </motion.p>
        </motion.div>

        {/* Loading Steps */}
        <div className="space-y-8">
          <AnimatePresence mode="wait">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30, scale: 0.9 }}
                  animate={{ 
                    opacity: currentStep >= index ? 1 : 0.3,
                    y: currentStep >= index ? 0 : 30,
                    scale: currentStep === index ? 1 : 0.9
                  }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="flex flex-col items-center"
                >
                  <div className={`
                    w-16 h-16 rounded-full flex items-center justify-center mb-3 transition-all duration-500
                    ${currentStep >= index 
                      ? 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg transform scale-110' 
                      : 'bg-gray-200'
                    }
                  `}>
                    <Icon className={`w-8 h-8 ${currentStep >= index ? 'text-white' : 'text-gray-400'}`} />
                  </div>
                  <p className={`
                    text-lg font-medium transition-all duration-500
                    ${currentStep >= index ? 'text-amber-700' : 'text-gray-400'}
                  `}>
                    {step.text}
                  </p>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Progress Bar */}
        <motion.div 
          className="mt-8 w-64 h-2 bg-gray-200 rounded-full mx-auto overflow-hidden"
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
          />
        </motion.div>

        {/* Decorative Elements */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="mt-6 flex justify-center space-x-2"
        >
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity, 
                delay: i * 0.2 
              }}
              className="w-2 h-2 bg-amber-400 rounded-full"
            />
          ))}
        </motion.div>

        {/* Meva Cafe Tagline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.8 }}
          className="mt-6 flex items-center justify-center text-amber-600"
        >
          <Heart className="w-4 h-4 mr-2" />
          <span className="text-sm font-medium">Sevgiyle Hazırlanmış</span>
          <Heart className="w-4 h-4 ml-2" />
        </motion.div>
      </div>
    </div>
  );
};

export default MevaLoadingScreen;