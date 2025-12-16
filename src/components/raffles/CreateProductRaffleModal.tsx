import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { ProductRaffle } from '../../types';

interface CreateProductRaffleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (raffle: Omit<ProductRaffle, 'id' | 'createdAt' | 'updatedAt'>) => void;
  productRaffle?: ProductRaffle;
  isLoading?: boolean;
}

const CreateProductRaffleModal: React.FC<CreateProductRaffleModalProps> = ({
  isOpen,
  onClose,
  onSave,
  productRaffle,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    product: string;
    pointsRequired: number | '';
    maxParticipants: number | '';
    drawDate: string;
    registrationStartDate: string;
    registrationEndDate: string;
    isActive: boolean;
    isRegistrationOpen: boolean;
  }>({
    name: '',
    description: '',
    product: '',
    pointsRequired: '',
    maxParticipants: 100,
    drawDate: '',
    registrationStartDate: '',
    registrationEndDate: '',
    isActive: true,
    isRegistrationOpen: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (productRaffle) {
      const existingPoints = (productRaffle as any)?.pointsRequired;
      setFormData({
        name: productRaffle.name,
        description: productRaffle.description,
        product: productRaffle.product,
        pointsRequired: existingPoints != null && existingPoints > 0 ? existingPoints : '',
        maxParticipants: productRaffle.maxParticipants,
        drawDate: new Date(productRaffle.drawDate).toISOString().split('T')[0],
        registrationStartDate: new Date(productRaffle.registrationStartDate).toISOString().split('T')[0],
        registrationEndDate: new Date(productRaffle.registrationEndDate).toISOString().split('T')[0],
        isActive: productRaffle.isActive,
        isRegistrationOpen: productRaffle.isRegistrationOpen
      });
    } else {
      // Reset form for new raffle
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);

      setFormData({
        name: '',
        description: '',
        product: '',
        pointsRequired: '',
        maxParticipants: 100,
        drawDate: nextWeek.toISOString().split('T')[0],
        registrationStartDate: today.toISOString().split('T')[0],
        registrationEndDate: tomorrow.toISOString().split('T')[0],
        isActive: true,
        isRegistrationOpen: true
      });
    }
    setErrors({});
  }, [productRaffle, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es requerida';
    }

    if (!formData.product.trim()) {
      newErrors.product = 'El producto es requerido';
    }

    const maxPart = typeof formData.maxParticipants === 'number' ? formData.maxParticipants : Number(formData.maxParticipants);
    if (!maxPart || maxPart <= 0) {
      newErrors.maxParticipants = 'El número máximo de participantes debe ser mayor a 0';
    }

    const pointsReq = typeof formData.pointsRequired === 'number' ? formData.pointsRequired : Number(formData.pointsRequired || 0);
    if (formData.pointsRequired === '' || formData.pointsRequired === null || formData.pointsRequired === undefined) {
      newErrors.pointsRequired = 'Los puntos requeridos son obligatorios';
    } else if (pointsReq < 0) {
      newErrors.pointsRequired = 'Los puntos requeridos no pueden ser negativos';
    } else if (pointsReq === 0) {
      newErrors.pointsRequired = 'Los puntos requeridos deben ser mayor a 0';
    }

    if (!formData.drawDate) {
      newErrors.drawDate = 'La fecha del sorteo es requerida';
    }

    if (!formData.registrationStartDate) {
      newErrors.registrationStartDate = 'La fecha de inicio de registro es requerida';
    }

    if (!formData.registrationEndDate) {
      newErrors.registrationEndDate = 'La fecha de fin de registro es requerida';
    }

    const startDate = new Date(formData.registrationStartDate);
    const endDate = new Date(formData.registrationEndDate);
    const drawDate = new Date(formData.drawDate);

    if (endDate <= startDate) {
      newErrors.registrationEndDate = 'La fecha de fin debe ser posterior a la fecha de inicio';
    }

    if (drawDate <= endDate) {
      newErrors.drawDate = 'La fecha del sorteo debe ser posterior a la fecha de fin de registro';
    }

    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const newRaffle: Omit<ProductRaffle, 'id' | 'createdAt' | 'updatedAt'> = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      product: formData.product.trim(),
      productValue: 0, // Campo requerido por el tipo pero no se usa
      pointsRequired: typeof formData.pointsRequired === 'number' ? formData.pointsRequired : Number(formData.pointsRequired || 0),
      maxParticipants: typeof formData.maxParticipants === 'number' ? formData.maxParticipants : Number(formData.maxParticipants || 100),
      currentParticipants: 0,
      participants: [],
      winner: undefined,
      prizeDistribution: {
        specificPositions: {
          firstPlace: 100,
          secondPlace: 0,
          thirdPlace: 0
        },
        prizeRanges: []
      },
      drawDate: new Date(formData.drawDate).toISOString(),
      registrationStartDate: new Date(formData.registrationStartDate).toISOString(),
      registrationEndDate: new Date(formData.registrationEndDate).toISOString(),
      isActive: formData.isActive,
      isCompleted: false,
      isRegistrationOpen: formData.isRegistrationOpen,
      isDrawn: false,
      imageFile: imageFile || undefined,
    };
    onSave(newRaffle);
    // No cerrar el modal aquí - el padre lo cerrará después de guardar exitosamente
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    // Para campos numéricos, mantener el valor como está (puede ser string vacío)
    let finalValue: any = value;
    if (type === 'number') {
      // Si está vacío, mantener como string vacío para que no muestre "0"
      if (value === '' || value === null) {
        finalValue = '';
      } else {
        // Convertir a número
        const num = Number(value);
        finalValue = isNaN(num) ? '' : num;
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: finalValue
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {productRaffle ? 'Editar Sorteo de Producto' : 'Crear Sorteo de Producto'}
          </h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Imagen opcional */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Imagen del sorteo (opcional)
            </label>
            <input
              type="file"
              accept="image/*"
              disabled={isLoading}
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setImageFile(file);
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (ev) => setImagePreview(String(ev.target?.result || ''));
                  reader.readAsDataURL(file);
                } else {
                  setImagePreview(null);
                }
              }}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {imagePreview && (
              <div className="mt-3">
                <img src={imagePreview} alt="preview" className="h-32 w-auto rounded-md object-cover border" />
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Sorteo *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                disabled={isLoading}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ej: Sorteo iPhone 15 Pro Max"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Producto *
              </label>
              <input
                type="text"
                name="product"
                value={formData.product}
                onChange={handleInputChange}
                disabled={isLoading}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                  errors.product ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ej: iPhone 15 Pro Max 256GB"
              />
              {errors.product && <p className="text-red-500 text-sm mt-1">{errors.product}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              disabled={isLoading}
              rows={3}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Describe el producto y las condiciones del sorteo"
            />
            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Máximo de Participantes *
              </label>
              <input
                type="number"
                name="maxParticipants"
                value={formData.maxParticipants || ''}
                onChange={handleInputChange}
                disabled={isLoading}
                min="1"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                  errors.maxParticipants ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="100"
              />
              {errors.maxParticipants && <p className="text-red-500 text-sm mt-1">{errors.maxParticipants}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Puntos requeridos por participación *
              </label>
              <input
                type="number"
                name="pointsRequired"
                value={formData.pointsRequired || ''}
                onChange={handleInputChange}
                disabled={isLoading}
                min="0"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                  errors.pointsRequired ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ej: 150"
              />
              {errors.pointsRequired && <p className="text-red-500 text-sm mt-1">{errors.pointsRequired}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Inicio de Registro *
              </label>
              <input
                type="date"
                name="registrationStartDate"
                value={formData.registrationStartDate}
                onChange={handleInputChange}
                disabled={isLoading}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                  errors.registrationStartDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.registrationStartDate && <p className="text-red-500 text-sm mt-1">{errors.registrationStartDate}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fin de Registro *
              </label>
              <input
                type="date"
                name="registrationEndDate"
                value={formData.registrationEndDate}
                onChange={handleInputChange}
                disabled={isLoading}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                  errors.registrationEndDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.registrationEndDate && <p className="text-red-500 text-sm mt-1">{errors.registrationEndDate}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha del Sorteo *
              </label>
              <input
                type="date"
                name="drawDate"
                value={formData.drawDate}
                onChange={handleInputChange}
                disabled={isLoading}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                  errors.drawDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.drawDate && <p className="text-red-500 text-sm mt-1">{errors.drawDate}</p>}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isLoading && (
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              <span>{isLoading ? 'Guardando...' : `${productRaffle ? 'Actualizar' : 'Crear'} Sorteo`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProductRaffleModal;
