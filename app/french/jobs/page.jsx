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
      title: 'Représentant développement commercial',
      location: 'Télétravail',
      type: 'Temps partiel',
      description: 'Nous recherchons un représentant développement commercial motivé pour rejoindre notre équipe et nous aider à étendre notre portée mondiale. Gagnez 17% de commission sur chaque transaction basée sur vos compétences. Soyez votre propre patron avec un contrat d\'un an.',
      requirements: [
        '1 an d\'expérience en vente',
        'Structure de commission revenus 17%',
        'Engagement contrat d\'un an',
        'Excellentes compétences en communication',
        'Autonome et axé sur les résultats'
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
            Rejoignez notre équipe
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Nous recherchons des personnes talentueuses pour rejoindre notre équipe en croissance. 
            Explorez nos postes ouverts et trouvez le rôle parfait pour vous.
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
                  Lire plus
                </Link>
                <Link
                  href={getLocalizedUrl(`/jobs/${position.id}/apply`)}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center"
                >
                  Postuler maintenant
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
            Que se passe-t-il ensuite ?
          </h3>
          <div className="space-y-3 text-gray-600">
            <p>• Nous examinerons votre candidature dans les 2-3 jours ouvrables</p>
            <p>• Si vous êtes sélectionné, nous vous contacterons pour planifier un entretien</p>
            <p>• Le processus d'entretien prend généralement 1-2 semaines</p>
            <p>• Nous vous notifierons de notre décision par e-mail</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default JobsPage;
