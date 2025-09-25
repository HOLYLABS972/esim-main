'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  MapPin,
  Clock,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { useI18n } from '../../../src/contexts/I18nContext';

  // Available job positions
  const jobPositions = [
    {
      id: 1,
      title: 'Representante de Desarrollo de Ventas',
      location: 'Remoto',
      type: 'Tiempo Parcial',
      description: 'Estamos buscando un Representante de Desarrollo de Ventas motivado para unirse a nuestro equipo y ayudarnos a expandir nuestro alcance global. Gana 17% de comisión en cada transacción basada en tus habilidades. Sé tu propio jefe con un contrato de 1 año.',
      requirements: [
        '1 año de experiencia en ventas',
        'Estructura de comisión de ingresos 17%',
        'Compromiso de contrato de 1 año',
        'Excelentes habilidades de comunicación',
        'Autodirigido y orientado a resultados'
      ],
    }
  ];

const JobsPage = () => {
  const { locale } = useI18n();

  const getLocalizedUrl = (path) => {
    const languageMap = {
      'en': '',
      'ar': '/arabic',
      'fr': '/french',
      'de': '/german',
      'es': '/spanish',
      'he': '/hebrew',
      'ru': '/russian'
    };
    const prefix = languageMap[locale] || '';
    return `${prefix}${path}`;
  };

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Únete a Nuestro Equipo
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Estamos buscando personas talentosas para unirse a nuestro equipo en crecimiento. 
            Explora nuestras posiciones abiertas y encuentra el rol perfecto para ti.
          </p>
        </motion.div>

        {/* Job Positions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {jobPositions.map((position) => (
            <motion.div
              key={position.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: position.id * 0.1 }}
              className="bg-white border border-gray-200 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {position.title}
                  </h3>
                  <div className="flex items-center text-gray-600 mb-2">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span className="text-sm">{position.location}</span>
                  </div>
                  <div className="flex items-center text-gray-600 mb-2">
                    <Clock className="w-4 h-4 mr-2" />
                    <span className="text-sm">{position.type}</span>
                  </div>
                </div>
              </div>
              
              <p className="text-gray-600 text-sm mb-6 line-clamp-3">
                {position.description}
              </p>
              
              <div className="flex space-x-3">
                <Link
                  href={getLocalizedUrl(`/jobs/${position.id}`)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors duration-200 text-center"
                >
                  Leer Más
                </Link>
                <Link
                  href={getLocalizedUrl(`/jobs/${position.id}/apply`)}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center"
                >
                  Aplicar Ahora
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>


        {/* Additional Info */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-8 bg-gray-50 rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            ¿Qué pasa después?
          </h3>
          <div className="space-y-3 text-gray-600">
            <p>• Revisaremos tu aplicación dentro de 2-3 días hábiles</p>
            <p>• Si eres seleccionado, nos pondremos en contacto contigo para programar una entrevista</p>
            <p>• El proceso de entrevista típicamente toma 1-2 semanas</p>
            <p>• Te notificaremos nuestra decisión por correo electrónico</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default JobsPage;
