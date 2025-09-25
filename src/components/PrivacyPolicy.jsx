import React from 'react';
import { Shield, Lock, Eye, Database, UserCheck } from 'lucide-react';

const PrivacyPolicy = ({ language = 'en' }) => {
  // Language-specific content
  const languageContent = {
    en: {
      title: "Privacy Policy",
      subtitle: "Your privacy is important to us. This policy explains how we collect, use, and protect your information.",
      lastUpdated: "Last updated: December 2024",
      sections: [
        {
          icon: Database,
          title: "Information We Collect",
          content: [
            "Personal information you provide when creating an account (name, email, phone number)",
            "Payment information processed securely through our payment partners",
            "Device information and eSIM activation data",
            "Usage data and analytics to improve our services",
            "Communication preferences and support interactions"
          ]
        },
        {
          icon: Eye,
          title: "How We Use Your Information",
          content: [
            "Provide and maintain our eSIM services",
            "Process transactions and send service notifications",
            "Improve our products and customer experience",
            "Comply with legal obligations and prevent fraud",
            "Send marketing communications (with your consent)"
          ]
        },
        {
          icon: Lock,
          title: "Data Protection & Security",
          content: [
            "Industry-standard encryption for all data transmission",
            "Secure data centers with 24/7 monitoring",
            "Regular security audits and vulnerability assessments",
            "Limited access to personal data on a need-to-know basis",
            "Compliance with GDPR, CCPA, and other privacy regulations"
          ]
        },
        {
          icon: UserCheck,
          title: "Your Rights",
          content: [
            "Access and review your personal information",
            "Request correction of inaccurate data",
            "Delete your account and associated data",
            "Opt-out of marketing communications",
            "Data portability and export options"
          ]
        }
      ],
      contactTitle: "Contact Us",
      contactText: "If you have any questions about this Privacy Policy, please contact us at privacy@esimplans.com"
    },
    he: {
      title: "מדיניות פרטיות",
      subtitle: "הפרטיות שלכם חשובה לנו. מדיניות זו מסבירה איך אנו אוספים, משתמשים ומגנים על המידע שלכם.",
      lastUpdated: "עודכן לאחרונה: דצמבר 2024",
      sections: [
        {
          icon: Database,
          title: "מידע שאנו אוספים",
          content: [
            "מידע אישי שאתם מספקים בעת יצירת חשבון (שם, אימייל, מספר טלפון)",
            "מידע תשלום המעובד בצורה מאובטחת דרך שותפי התשלום שלנו",
            "מידע על המכשיר ונתוני הפעלת eSIM",
            "נתוני שימוש ואנליטיקה לשיפור השירותים שלנו",
            "העדפות תקשורת ואינטראקציות תמיכה"
          ]
        },
        {
          icon: Eye,
          title: "איך אנו משתמשים במידע שלכם",
          content: [
            "לספק ולשמור על שירותי ה-eSIM שלנו",
            "לעבד עסקאות ולשלוח התראות שירות",
            "לשפר את המוצרים שלנו וחוויית הלקוח",
            "לעמוד בחובות משפטיות ולמנוע הונאה",
            "לשלוח תקשורת שיווקית (עם הסכמתכם)"
          ]
        },
        {
          icon: Lock,
          title: "הגנה על נתונים ואבטחה",
          content: [
            "הצפנה ברמה תעשייתית לכל העברת נתונים",
            "מרכזי נתונים מאובטחים עם ניטור 24/7",
            "ביקורות אבטחה סדירות והערכות פגיעות",
            "גישה מוגבלת לנתונים אישיים על בסיס צורך לדעת",
            "עמידה ב-GDPR, CCPA ותקנות פרטיות אחרות"
          ]
        },
        {
          icon: UserCheck,
          title: "הזכויות שלכם",
          content: [
            "גישה וסקירה של המידע האישי שלכם",
            "בקשה לתיקון נתונים לא מדויקים",
            "מחיקת החשבון שלכם והנתונים הקשורים",
            "ביטול הרשמה לתקשורת שיווקית",
            "אפשרויות ניידות נתונים וייצוא"
          ]
        }
      ],
      contactTitle: "צרו קשר",
      contactText: "אם יש לכם שאלות כלשהן לגבי מדיניות פרטיות זו, אנא צרו איתנו קשר בכתובת privacy@esimplans.com"
    },
    ar: {
      title: "سياسة الخصوصية",
      subtitle: "خصوصيتك مهمة بالنسبة لنا. توضح هذه السياسة كيف نجمع ونستخدم ونحمي معلوماتك.",
      lastUpdated: "آخر تحديث: ديسمبر 2024",
      sections: [
        {
          icon: Database,
          title: "المعلومات التي نجمعها",
          content: [
            "المعلومات الشخصية التي تقدمها عند إنشاء حساب (الاسم، البريد الإلكتروني، رقم الهاتف)",
            "معلومات الدفع المعالجة بأمان من خلال شركاء الدفع لدينا",
            "معلومات الجهاز وبيانات تفعيل eSIM",
            "بيانات الاستخدام والتحليلات لتحسين خدماتنا",
            "تفضيلات التواصل وتفاعلات الدعم"
          ]
        },
        {
          icon: Eye,
          title: "كيف نستخدم معلوماتك",
          content: [
            "تقديم وصيانة خدمات eSIM الخاصة بنا",
            "معالجة المعاملات وإرسال إشعارات الخدمة",
            "تحسين منتجاتنا وتجربة العملاء",
            "الامتثال للالتزامات القانونية ومنع الاحتيال",
            "إرسال الاتصالات التسويقية (بموافقتك)"
          ]
        },
        {
          icon: Lock,
          title: "حماية البيانات والأمان",
          content: [
            "تشفير معياري صناعي لجميع نقل البيانات",
            "مراكز بيانات آمنة مع مراقبة على مدار الساعة",
            "عمليات تدقيق أمنية منتظمة وتقييمات الثغرات",
            "وصول محدود للبيانات الشخصية على أساس الحاجة للمعرفة",
            "الامتثال لـ GDPR و CCPA ولوائح الخصوصية الأخرى"
          ]
        },
        {
          icon: UserCheck,
          title: "حقوقك",
          content: [
            "الوصول إلى معلوماتك الشخصية ومراجعتها",
            "طلب تصحيح البيانات غير الدقيقة",
            "حذف حسابك والبيانات المرتبطة به",
            "إلغاء الاشتراك في الاتصالات التسويقية",
            "خيارات نقل البيانات والتصدير"
          ]
        }
      ],
      contactTitle: "اتصل بنا",
      contactText: "إذا كان لديك أي أسئلة حول سياسة الخصوصية هذه، يرجى الاتصال بنا على privacy@esimplans.com"
    }
  };

  const content = languageContent[language] || languageContent.en;

  return (
    <div className="min-h-screen bg-white py-24">
      {/* Header Section */}
      <section className="bg-white">
        <div className="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8">
          <div className="text-center">
            <h2 className="text-center text-xl font-semibold text-tufts-blue">
              <span>{'{ '}</span>
              Privacy & Security
              <span>{' }'}</span>
            </h2>
            <p className="mx-auto mt-12 max-w-4xl text-center text-4xl font-semibold tracking-tight text-eerie-black sm:text-5xl">
              {content.title}
            </p>
            <p className="mx-auto mt-6 max-w-2xl text-center text-lg text-cool-black">
              {content.subtitle}
            </p>
            <div className="flex items-center justify-center mt-8">
              <Shield className="w-8 h-8 text-tufts-blue mr-2" />
              <p className="text-sm text-cool-black">
                {content.lastUpdated}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="bg-white">
        <div className="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8 mt-6">
          
          {/* Introduction */}
          <div className="relative mb-8">
            <div className="absolute inset-px rounded-xl bg-white"></div>
            <div className="relative flex h-full flex-col overflow-hidden rounded-xl">
              <div className="px-8 pt-8 pb-8">
                <h2 className="text-2xl font-medium tracking-tight text-eerie-black mb-4">Introduction</h2>
                <p className="text-cool-black leading-relaxed mb-4">
                  At Holylabs Ltd (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;), we are committed to protecting your privacy and ensuring 
                  the security of your personal information. This Privacy Policy explains how we collect, use, 
                  disclose, and safeguard your information when you use our eSIM services and website.
                </p>
                <p className="text-cool-black leading-relaxed">
                  By using our services, you agree to the collection and use of information in accordance with 
                  this Privacy Policy. If you do not agree with our policies and practices, please do not use our services.
                </p>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-px rounded-xl shadow-sm ring-1 ring-black/5"></div>
          </div>

          {/* Main Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {content.sections.map((section, index) => {
              const IconComponent = section.icon;
              return (
                <div
                  key={index}
                  className="relative"
                >
                  <div className="absolute inset-px rounded-xl bg-white"></div>
                  <div className="relative flex h-full flex-col overflow-hidden rounded-xl">
                    <div className="px-8 pt-8 pb-8">
                      <div className="flex items-center mb-6">
                        <div className="w-12 h-12 bg-tufts-blue/10 rounded-xl flex items-center justify-center mr-4">
                          <IconComponent className="w-6 h-6 text-tufts-blue" />
                        </div>
                        <h2 className="text-xl font-medium tracking-tight text-eerie-black">{section.title}</h2>
                      </div>
                      <ul className="space-y-3">
                        {section.content.map((item, itemIndex) => (
                          <li key={itemIndex} className="flex items-start">
                            <div className="w-2 h-2 bg-tufts-blue rounded-full mt-2 mr-3 flex-shrink-0"></div>
                            <span className="text-cool-black leading-relaxed">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="pointer-events-none absolute inset-px rounded-xl shadow-sm ring-1 ring-black/5"></div>
                </div>
              );
            })}
          </div>

          {/* Data Sharing */}
          <div className="relative mb-8">
            <div className="absolute inset-px rounded-xl bg-white"></div>
            <div className="relative flex h-full flex-col overflow-hidden rounded-xl">
              <div className="px-8 pt-8 pb-8">
                <h2 className="text-2xl font-medium tracking-tight text-eerie-black mb-4">Data Sharing and Disclosure</h2>
                <p className="text-cool-black leading-relaxed mb-4">
                  We do not sell, trade, or otherwise transfer your personal information to third parties without 
                  your consent, except in the following circumstances:
                </p>
                <ul className="space-y-3 mb-4">
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-tufts-blue rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span className="text-cool-black">Service providers who assist in our operations (payment processors, cloud storage)</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-tufts-blue rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span className="text-cool-black">Legal compliance and law enforcement requests</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-tufts-blue rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span className="text-cool-black">Business transfers (mergers, acquisitions)</span>
                  </li>
                </ul>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-px rounded-xl shadow-sm ring-1 ring-black/5"></div>
          </div>

          {/* Contact Section */}
          <div className="relative mb-8">
            <div className="absolute inset-px rounded-xl bg-white"></div>
            <div className="relative flex h-full flex-col overflow-hidden rounded-xl">
              <div className="px-8 pt-8 pb-8">
                <h2 className="text-2xl font-medium tracking-tight text-eerie-black mb-4">
                  {content.contactTitle}
                </h2>
                <p className="text-cool-black leading-relaxed">
                  {content.contactText}
                </p>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-px rounded-xl shadow-sm ring-1 ring-black/5"></div>
          </div>

        </div>
      </section>
    </div>
  );
};

export default PrivacyPolicy;
