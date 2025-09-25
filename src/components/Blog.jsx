"use client";

import React, { useState, useEffect } from 'react';
import { Calendar, User, ArrowRight, Clock, Search, Mail, Globe } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import blogService from '../services/blogService';
import translationService from '../services/translationService';
import { subscribeToNewsletter } from '../services/newsletterService';
import toast from 'react-hot-toast';

const Blog = ({ language = 'en' }) => {
  const [blogPosts, setBlogPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Newsletter state
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [isNewsletterSubmitting, setIsNewsletterSubmitting] = useState(false);

  // Language-specific content
  const languageContent = {
    en: {
      title: 'Stay updated with eSIM technology',
      subtitle: 'Discover the latest trends, guides, and insights in eSIM technology and global connectivity solutions.',
      searchPlaceholder: 'Search blog posts...',
      allCategories: 'All Categories',
      noPostsFound: 'No blog posts found matching your criteria',
      noPostsAvailable: 'No blog posts available yet',
      readMore: 'Read More',
      newsletterTitle: 'Stay Updated with eSIM News',
      newsletterSubtitle: 'Get the latest eSIM insights, travel tips, and technology updates delivered to your inbox',
      newsletterPlaceholder: 'Enter your email',
      subscribe: 'Subscribe',
      subscribing: 'Subscribing...',
      loadingText: 'Loading blog posts...'
    },
    ar: {
      title: 'ابق محدثًا مع تقنية eSIM',
      subtitle: 'اكتشف أحدث الاتجاهات والأدلة والرؤى في تقنية eSIM وحلول الاتصال العالمي.',
      searchPlaceholder: 'البحث في منشورات المدونة...',
      allCategories: 'جميع الفئات',
      noPostsFound: 'لم يتم العثور على منشورات مدونة تطابق معاييرك',
      noPostsAvailable: 'لا توجد منشورات مدونة متاحة بعد',
      readMore: 'اقرأ المزيد',
      newsletterTitle: 'ابق محدثًا مع أخبار eSIM',
      newsletterSubtitle: 'احصل على أحدث رؤى eSIM ونصائح السفر وتحديثات التكنولوجيا في صندوق الوارد الخاص بك',
      newsletterPlaceholder: 'أدخل بريدك الإلكتروني',
      subscribe: 'اشترك',
      subscribing: 'جاري الاشتراك...',
      loadingText: 'جاري تحميل منشورات المدونة...'
    },
    fr: {
      title: 'Restez informé de la technologie eSIM',
      subtitle: 'Découvrez les dernières tendances, guides et insights en technologie eSIM et solutions de connectivité mondiale.',
      searchPlaceholder: 'Rechercher des articles de blog...',
      allCategories: 'Toutes les catégories',
      noPostsFound: 'Aucun article de blog trouvé correspondant à vos critères',
      noPostsAvailable: 'Aucun article de blog disponible pour le moment',
      readMore: 'Lire la suite',
      newsletterTitle: 'Restez informé des actualités eSIM',
      newsletterSubtitle: 'Recevez les derniers insights eSIM, conseils de voyage et mises à jour technologiques dans votre boîte de réception',
      newsletterPlaceholder: 'Entrez votre email',
      subscribe: 'S\'abonner',
      subscribing: 'Abonnement en cours...',
      loadingText: 'Chargement des articles de blog...'
    },
    de: {
      title: 'Bleiben Sie über eSIM-Technologie informiert',
      subtitle: 'Entdecken Sie die neuesten Trends, Anleitungen und Einblicke in eSIM-Technologie und globale Konnektivitätslösungen.',
      searchPlaceholder: 'Blog-Beiträge suchen...',
      allCategories: 'Alle Kategorien',
      noPostsFound: 'Keine Blog-Beiträge gefunden, die Ihren Kriterien entsprechen',
      noPostsAvailable: 'Noch keine Blog-Beiträge verfügbar',
      readMore: 'Weiterlesen',
      newsletterTitle: 'Bleiben Sie über eSIM-Nachrichten informiert',
      newsletterSubtitle: 'Erhalten Sie die neuesten eSIM-Insights, Reisetipps und Technologie-Updates in Ihrem Posteingang',
      newsletterPlaceholder: 'E-Mail eingeben',
      subscribe: 'Abonnieren',
      subscribing: 'Abonnement läuft...',
      loadingText: 'Blog-Beiträge werden geladen...'
    },
    es: {
      title: 'Mantente actualizado con la tecnología eSIM',
      subtitle: 'Descubre las últimas tendencias, guías e insights en tecnología eSIM y soluciones de conectividad global.',
      searchPlaceholder: 'Buscar publicaciones del blog...',
      allCategories: 'Todas las categorías',
      noPostsFound: 'No se encontraron publicaciones del blog que coincidan con tus criterios',
      noPostsAvailable: 'Aún no hay publicaciones del blog disponibles',
      readMore: 'Leer más',
      newsletterTitle: 'Mantente actualizado con las noticias eSIM',
      newsletterSubtitle: 'Recibe los últimos insights eSIM, consejos de viaje y actualizaciones tecnológicas en tu bandeja de entrada',
      newsletterPlaceholder: 'Ingresa tu email',
      subscribe: 'Suscribirse',
      subscribing: 'Suscribiendo...',
      loadingText: 'Cargando publicaciones del blog...'
    },
    he: {
      title: 'הישאר מעודכן עם טכנולוגיית eSIM',
      subtitle: 'גלה את המגמות, המדריכים והתובנות האחרונות בטכנולוגיית eSIM ובפתרונות חיבור גלובליים.',
      searchPlaceholder: 'חיפוש פוסטים בבלוג...',
      allCategories: 'כל הקטגוריות',
      noPostsFound: 'לא נמצאו פוסטים בבלוג התואמים לקריטריונים שלך',
      noPostsAvailable: 'אין עדיין פוסטים בבלוג זמינים',
      readMore: 'קרא עוד',
      newsletterTitle: 'הישאר מעודכן עם חדשות eSIM',
      newsletterSubtitle: 'קבל את התובנות, טיפי הנסיעות ועדכוני הטכנולוגיה האחרונים של eSIM בתיבת הדואר שלך',
      newsletterPlaceholder: 'הזן את האימייל שלך',
      subscribe: 'הירשם',
      subscribing: 'נרשם...',
      loadingText: 'טוען פוסטים בבלוג...'
    },
    ru: {
      title: 'Оставайтесь в курсе технологий eSIM',
      subtitle: 'Откройте для себя последние тенденции, руководства и инсайты в области технологий eSIM и глобальных решений подключения.',
      searchPlaceholder: 'Поиск постов блога...',
      allCategories: 'Все категории',
      noPostsFound: 'Не найдено постов блога, соответствующих вашим критериям',
      noPostsAvailable: 'Пока нет доступных постов блога',
      readMore: 'Читать далее',
      newsletterTitle: 'Оставайтесь в курсе новостей eSIM',
      newsletterSubtitle: 'Получайте последние инсайты eSIM, советы путешественникам и обновления технологий в свой почтовый ящик',
      newsletterPlaceholder: 'Введите ваш email',
      subscribe: 'Подписаться',
      subscribing: 'Подписка...',
      loadingText: 'Загрузка постов блога...'
    }
  };

  const content = languageContent[language] || languageContent.en;

  // Load blog posts on component mount
  useEffect(() => {
    loadBlogPosts();
    loadCategories();
  }, []);

  // Filter posts when search term or category changes
  useEffect(() => {
    filterPosts();
  }, [searchTerm, selectedCategory, blogPosts]);

  const loadBlogPosts = async () => {
    try {
      setLoading(true);
      const result = await blogService.getPublishedPosts(20);
      
      if (language === 'en') {
        // For English, show original posts
        setBlogPosts(result.posts);
      } else {
        // For other languages, translate the posts
        const translatedPosts = await translationService.translateMultiplePosts(result.posts, language);
        setBlogPosts(translatedPosts);
      }
    } catch (error) {
      console.error('Error loading blog posts:', error);
      // Fallback to empty array if there's an error
      setBlogPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const cats = await blogService.getCategories();
      setCategories(cats);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const filterPosts = () => {
    let filtered = blogPosts;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(post => post.category === selectedCategory);
    }

    setFilteredPosts(filtered);
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    
    if (!newsletterEmail.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    setIsNewsletterSubmitting(true);
    
    try {
      const result = await subscribeToNewsletter({
        email: newsletterEmail.trim(),
        name: '', // Optional for blog subscription
        source: 'blog'
      });
      
      if (result.success) {
        if (result.message === 'Email reactivated') {
          toast.success('Welcome back! Your newsletter subscription has been reactivated.');
        } else {
          toast.success('Successfully subscribed to our newsletter!');
        }
        
        // Reset form
        setNewsletterEmail('');
      } else {
        toast.error(result.message || 'Failed to subscribe to newsletter');
      }
    } catch (error) {
      console.error('Error subscribing to newsletter:', error);
      toast.error('Failed to subscribe to newsletter. Please try again.');
    } finally {
      setIsNewsletterSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white pt-24">
      {/* Header Section */}
      <section className="bg-white">
        <div className="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8">
          <div className="text-center">
            <h2 className="text-center text-xl font-semibold text-tufts-blue">
              <span>{'{ '}</span>
              eSIM Insights
              <span>{' }'}</span>
            </h2>
            <p className="mx-auto mt-12 max-w-4xl text-center text-4xl font-semibold tracking-tight text-eerie-black sm:text-5xl">
              {content.title}
            </p>
            <p className="mx-auto mt-6 max-w-2xl text-center text-lg text-cool-black">
              {content.subtitle}
            </p>
          </div>
        </div>
      </section>

      {/* Search and Filter Section */}
      <section className="bg-white">
        <div className="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8 mt-6">
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={content.searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="md:w-48">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">{content.allCategories}</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="bg-white pb-16">
        <div className="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">{content.loadingText}</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                {searchTerm || selectedCategory !== 'all' 
                  ? content.noPostsFound 
                  : content.noPostsAvailable
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.map((post, index) => (
              <article
                key={post.id}
                className="relative"
              >
                <div className="absolute inset-px rounded-xl bg-white"></div>
                <div className="relative flex h-full flex-col overflow-hidden rounded-xl">
                  <div className="relative">
                    {post.featuredImage ? (
                      <Image
                        src={post.featuredImage}
                        alt={post.title}
                        width={400}
                        height={192}
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-400 text-sm">No image</span>
                      </div>
                    )}
                    <div className="absolute top-4 left-4">
                      <span className="bg-tufts-blue text-white px-3 py-1 rounded-full text-sm font-medium">
                        {post.category}
                      </span>
                    </div>
                  </div>
                  
                  <div className="px-6 pt-6 pb-6 flex-1 flex flex-col">
                    <h2 className="text-xl font-medium tracking-tight text-eerie-black mb-3 line-clamp-2">
                      {post.title}
                    </h2>
                    
                    <p className="text-cool-black mb-4 line-clamp-3 flex-1">
                      {post.excerpt}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm text-cool-black mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <User className="w-4 h-4" />
                          <span>{post.author}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(post.publishedAt)}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {post.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1 text-sm text-cool-black">
                        <Clock className="w-4 h-4" />
                        <span>{post.readTime}</span>
                      </div>
                      
                      <Link
                        href={`/${language}/blog/${post.slug}`}
                        className="inline-flex items-center space-x-1 text-tufts-blue hover:text-cobalt-blue font-medium transition-colors duration-200"
                      >
                        <span>{content.readMore}</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="pointer-events-none absolute inset-px rounded-xl shadow-sm ring-1 ring-black/5"></div>
              </article>
            ))}
            </div>
          )}
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="bg-eerie-black text-white py-16">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-medium tracking-tight text-white mb-6">
            {content.newsletterTitle}
          </h2>
          <p className="text-xl text-alice-blue mb-8">
            {content.newsletterSubtitle}
          </p>
          <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder={content.newsletterPlaceholder}
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              required
              className="input-field flex-1"
            />
            <button 
              type="submit"
              disabled={isNewsletterSubmitting}
              className="btn-primary px-6 py-3 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isNewsletterSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {content.subscribing}
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  {content.subscribe}
                </>
              )}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default Blog;
