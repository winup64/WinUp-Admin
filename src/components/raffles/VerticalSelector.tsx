import React, { useState, useEffect, useRef } from 'react';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

interface VerticalSelectorProps {
  items: string[];
  selectedItem: string;
  onSelect: (item: string) => void;
  isSpinning?: boolean;
  onSpinComplete?: () => void;
  className?: string;
  itemHeight?: number;
  visibleItems?: number;
  timeRemaining?: number;
}

const VerticalSelector: React.FC<VerticalSelectorProps> = ({
  items,
  selectedItem,
  onSelect,
  isSpinning = false,
  onSpinComplete,
  className = '',
  itemHeight = 80,
  visibleItems = 5,
  timeRemaining
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [spinSpeed, setSpinSpeed] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  // Encontrar el índice del elemento seleccionado
  useEffect(() => {
    const index = items.findIndex(item => item === selectedItem);
    if (index !== -1) {
      setCurrentIndex(index);
    }
  }, [selectedItem, items]);

  // Efecto de animación cuando está girando
  useEffect(() => {
    if (isSpinning) {
      setIsAnimating(true);
      setSpinSpeed(120); // Velocidad inicial ágil (120ms)
      
      // Simular el giro con velocidad variable optimizada
      const spinInterval = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % items.length);
      }, spinSpeed);

      // Ralentizar gradualmente
      const speedInterval = setInterval(() => {
        setSpinSpeed(prev => Math.min(prev + 20, 350)); // Ralentizar hasta 350ms
      }, 100); // Cada 100ms

      // Detener después de 12 segundos exactos
      const stopTimeout = setTimeout(() => {
        clearInterval(spinInterval);
        clearInterval(speedInterval);
        setIsAnimating(false);
        onSpinComplete?.();
      }, 12000); // 12 segundos exactos

      return () => {
        clearInterval(spinInterval);
        clearInterval(speedInterval);
        clearTimeout(stopTimeout);
      };
    }
  }, [isSpinning, items.length, onSpinComplete, spinSpeed]);

  // Manejar clic en un elemento
  const handleItemClick = (index: number) => {
    if (!isAnimating) {
      setCurrentIndex(index);
      onSelect(items[index]);
    }
  };

  // Calcular el offset para centrar el elemento seleccionado
  const centerIndex = Math.floor(visibleItems / 2);
  const offset = (currentIndex - centerIndex) * itemHeight;

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden rounded-xl bg-white shadow-xl ${className}`}
      style={{ height: itemHeight * visibleItems, border: '3px solid #F59E0B' }}
    >
      {/* Línea indicadora superior */}
      <div className="absolute top-1/2 left-0 right-0 border-t-4 border-amber-500 z-10 transform -translate-y-[42px] opacity-50" />
      
      {/* Área de selección central con fondo dorado */}
      <div className="absolute top-1/2 left-0 right-0 h-20 bg-gradient-to-r from-amber-50 via-yellow-100 to-amber-50 z-5 transform -translate-y-10 border-y-4 border-amber-500 shadow-inner" />
      
      {/* Línea indicadora inferior */}
      <div className="absolute top-1/2 left-0 right-0 border-t-4 border-amber-500 z-10 transform translate-y-[38px] opacity-50" />
      
      {/* Contenedor de elementos */}
      <div 
        className="relative transition-transform duration-300 ease-out"
        style={{ 
          transform: `translateY(${-offset}px)`,
          transition: isAnimating ? 'none' : 'transform 0.3s ease-out'
        }}
      >
        {items.map((item, index) => {
          const distance = Math.abs(index - currentIndex);
          const isCenter = index === currentIndex;
          
          // Calcular opacidad basado en la distancia
          let opacity = 1;
          if (distance === 0) {
            opacity = 1;
          } else if (distance === 1) {
            opacity = 0.6;
          } else if (distance === 2) {
            opacity = 0.3;
          } else {
            opacity = 0.15;
          }

          return (
            <div
              key={`${item}-${index}`}
              className="flex items-center justify-center cursor-pointer transition-all duration-200"
              style={{ 
                height: itemHeight,
                opacity
              }}
              onClick={() => handleItemClick(index)}
            >
              <span className={`text-center px-6 py-3 transition-all duration-200 ${
                isCenter 
                  ? 'text-amber-900 font-bold text-2xl' 
                  : 'text-gray-600 text-lg font-medium'
              }`}>
                {item}
              </span>
            </div>
          );
        })}
      </div>

      {/* Contador de tiempo en esquina superior izquierda */}
      {isAnimating && timeRemaining !== undefined && (
        <div className="absolute top-4 left-4 z-30">
          <div className={`rounded-full px-5 py-2 shadow-lg transition-all duration-300 ${
            timeRemaining <= 4 
              ? 'bg-red-600 animate-pulse' 
              : timeRemaining <= 8 
                ? 'bg-yellow-600' 
                : 'bg-green-600'
          }`}>
            <div className="flex items-center space-x-2">
              <span className="text-white text-xs font-bold">⏱️</span>
              <span className="text-white text-2xl font-black">{timeRemaining}</span>
              <span className="text-white text-xs font-semibold">seg</span>
            </div>
          </div>
        </div>
      )}

      {/* Indicador de sorteo en progreso */}
      {isAnimating && (
        <div className="absolute top-4 right-4 z-30">
          <div className="flex items-center space-x-2 bg-amber-600 rounded-full px-4 py-2 shadow-lg">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-white text-sm font-semibold">Sorteando...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerticalSelector;
