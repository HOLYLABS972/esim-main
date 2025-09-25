import React from 'react';
import { FileText, Users, CreditCard, Shield, AlertTriangle, Scale } from 'lucide-react';

const TermsOfService = ({ language = 'en' }) => {
  // Language-specific content
  const languageContent = {
    en: {
      title: "Terms of Service",
      subtitle: "Please read these terms carefully before using our eSIM services. By using our services, you agree to be bound by these terms.",
      lastUpdated: "Last updated: December 2024",
      sections: [
        {
          icon: Users,
          title: "Acceptance of Terms",
          content: [
            "By accessing and using our eSIM services, you accept and agree to be bound by these Terms of Service",
            "If you do not agree to these terms, you may not use our services",
            "We reserve the right to modify these terms at any time with notice to users",
            "Continued use of our services after changes constitutes acceptance of new terms"
          ]
        },
        {
          icon: CreditCard,
          title: "Service Description & Payments",
          content: [
            "We provide eSIM data plans for mobile connectivity in various countries and regions",
            "All prices are displayed in the applicable currency and include applicable taxes",
            "Payment is required before service activation and is processed securely",
            "Refunds may be available according to our refund policy within specified timeframes",
            "We reserve the right to modify pricing with advance notice to customers"
          ]
        },
        {
          icon: Shield,
          title: "User Responsibilities",
          content: [
            "You must provide accurate and complete information when creating an account",
            "You are responsible for maintaining the confidentiality of your account credentials",
            "You agree to use our services only for lawful purposes and in compliance with local laws",
            "You must not attempt to circumvent security measures or access unauthorized areas",
            "Any misuse of our services may result in account suspension or termination"
          ]
        },
        {
          icon: AlertTriangle,
          title: "Service Limitations & Disclaimers",
          content: [
            "Service availability depends on network coverage and may vary by location",
            "Data speeds and quality may be affected by network conditions and device compatibility",
            "We do not guarantee uninterrupted or error-free service at all times",
            "Emergency services may not be available through our eSIM services",
            "You acknowledge that mobile services have inherent technical limitations"
          ]
        }
      ],
      contactTitle: "Contact Us",
      contactText: "If you have any questions about these Terms of Service, please contact us at legal@esimplans.com"
    },
    he: {
      title: "תנאי שירות",
      subtitle: "אנא קראו את התנאים האלה בקפידה לפני השימוש בשירותי ה-eSIM שלנו. בשימוש בשירותים שלנו, אתם מסכימים להיות מחויבים לתנאים אלה.",
      lastUpdated: "עודכן לאחרונה: דצמבר 2024",
      sections: [
        {
          icon: Users,
          title: "קבלת התנאים",
          content: [
            "בגישה לשימוש בשירותי ה-eSIM שלנו, אתם מקבלים ומסכימים להיות מחויבים לתנאי השירות האלה",
            "אם אתם לא מסכימים לתנאים אלה, אתם לא יכולים להשתמש בשירותים שלנו",
            "אנו שומרים לעצמנו את הזכות לשנות את התנאים האלה בכל עת עם הודעה למשתמשים",
            "המשך השימוש בשירותים שלנו לאחר השינויים מהווה קבלה של התנאים החדשים"
          ]
        },
        {
          icon: CreditCard,
          title: "תיאור השירות ותשלומים",
          content: [
            "אנו מספקים תוכניות נתונים eSIM לחיבור נייד במדינות ואזורים שונים",
            "כל המחירים מוצגים במטבע הרלוונטי וכוללים מיסים חלים",
            "תשלום נדרש לפני הפעלת השירות ומעובד בצורה מאובטחת",
            "החזרים עשויים להיות זמינים לפי מדיניות ההחזר שלנו בתוך מסגרות זמן מוגדרות",
            "אנו שומרים לעצמנו את הזכות לשנות תמחור עם הודעה מוקדמת ללקוחות"
          ]
        },
        {
          icon: Shield,
          title: "אחריות המשתמש",
          content: [
            "עליכם לספק מידע מדויק ומלא בעת יצירת חשבון",
            "אתם אחראים לשמירה על הסודיות של פרטי החשבון שלכם",
            "אתם מסכימים להשתמש בשירותים שלנו רק למטרות חוקיות ובהתאם לחוקים מקומיים",
            "אתם לא חייבים לנסות לעקוף אמצעי אבטחה או לגשת לאזורים לא מורשים",
            "כל שימוש לרעה בשירותים שלנו עלול לגרום להשעיה או סיום החשבון"
          ]
        },
        {
          icon: AlertTriangle,
          title: "הגבלות שירות והסתייגויות",
          content: [
            "זמינות השירות תלויה בכיסוי הרשת ועשויה להשתנות לפי מיקום",
            "מהירויות נתונים ואיכות עשויות להיות מושפעות מתנאי רשת ותאימות מכשירים",
            "אנו לא מבטיחים שירות ללא הפרעה או ללא שגיאות בכל עת",
            "שירותי חירום עשויים לא להיות זמינים דרך שירותי ה-eSIM שלנו",
            "אתם מכירים בכך שלשירותים ניידים יש הגבלות טכניות מובנות"
          ]
        }
      ],
      contactTitle: "צרו קשר",
      contactText: "אם יש לכם שאלות כלשהן לגבי תנאי השירות האלה, אנא צרו איתנו קשר בכתובת legal@esimplans.com"
    },
    ar: {
      title: "شروط الخدمة",
      subtitle: "يرجى قراءة هذه الشروط بعناية قبل استخدام خدمات eSIM الخاصة بنا. باستخدام خدماتنا، توافق على الالتزام بهذه الشروط.",
      lastUpdated: "آخر تحديث: ديسمبر 2024",
      sections: [
        {
          icon: Users,
          title: "قبول الشروط",
          content: [
            "بالوصول إلى استخدام خدمات eSIM الخاصة بنا، تقبل وتوافق على الالتزام بشروط الخدمة هذه",
            "إذا كنت لا توافق على هذه الشروط، فلا يجوز لك استخدام خدماتنا",
            "نحتفظ بالحق في تعديل هذه الشروط في أي وقت مع إشعار المستخدمين",
            "الاستمرار في استخدام خدماتنا بعد التغييرات يشكل قبولاً للشروط الجديدة"
          ]
        },
        {
          icon: CreditCard,
          title: "وصف الخدمة والمدفوعات",
          content: [
            "نوفر خطط بيانات eSIM للاتصال المحمول في دول ومناطق مختلفة",
            "جميع الأسعار معروضة بالعملة المناسبة وتشمل الضرائب المطبقة",
            "الدفع مطلوب قبل تفعيل الخدمة ويتم معالجته بأمان",
            "قد تكون المبالغ المستردة متاحة وفقاً لسياسة الاسترداد الخاصة بنا ضمن الإطارات الزمنية المحددة",
            "نحتفظ بالحق في تعديل التسعير مع إشعار مسبق للعملاء"
          ]
        },
        {
          icon: Shield,
          title: "مسؤوليات المستخدم",
          content: [
            "يجب عليك تقديم معلومات دقيقة وكاملة عند إنشاء حساب",
            "أنت مسؤول عن الحفاظ على سرية بيانات اعتماد حسابك",
            "توافق على استخدام خدماتنا فقط للأغراض القانونية ووفقاً للقوانين المحلية",
            "يجب ألا تحاول تجاوز إجراءات الأمان أو الوصول إلى مناطق غير مصرح بها",
            "أي إساءة استخدام لخدماتنا قد تؤدي إلى تعليق أو إنهاء الحساب"
          ]
        },
        {
          icon: AlertTriangle,
          title: "قيود الخدمة والإخلاءات",
          content: [
            "توفر الخدمة يعتمد على تغطية الشبكة وقد يختلف حسب الموقع",
            "سرعات البيانات والجودة قد تتأثر بظروف الشبكة وتوافق الجهاز",
            "نحن لا نضمن خدمة غير منقطعة أو خالية من الأخطاء في جميع الأوقات",
            "قد لا تكون خدمات الطوارئ متاحة من خلال خدمات eSIM الخاصة بنا",
            "تقر بأن الخدمات المحمولة لها قيود تقنية متأصلة"
          ]
        }
      ],
      contactTitle: "اتصل بنا",
      contactText: "إذا كان لديك أي أسئلة حول شروط الخدمة هذه، يرجى الاتصال بنا على legal@esimplans.com"
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
              Legal Terms
              <span>{' }'}</span>
            </h2>
            <p className="mx-auto mt-12 max-w-4xl text-center text-4xl font-semibold tracking-tight text-eerie-black sm:text-5xl">
              {content.title}
            </p>
            <p className="mx-auto mt-6 max-w-2xl text-center text-lg text-cool-black">
              {content.subtitle}
            </p>
            <div className="flex items-center justify-center mt-8">
              <FileText className="w-8 h-8 text-tufts-blue mr-2" />
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
                <h2 className="text-2xl font-medium tracking-tight text-eerie-black mb-4">Agreement Overview</h2>
                <p className="text-cool-black leading-relaxed mb-4">
                  These Terms of Service (&quot;Terms&quot;) govern your use of the eSIM services provided by 
                  Holylabs Ltd (&quot;Company,&quot; &quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). These Terms constitute a legally 
                  binding agreement between you and Holylabs Ltd.
                </p>
                <p className="text-cool-black leading-relaxed">
                  Our services include the provision of eSIM data plans, mobile connectivity solutions, 
                  and related digital services accessible through our website and mobile applications.
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

          {/* Intellectual Property */}
          <div className="relative mb-8">
            <div className="absolute inset-px rounded-xl bg-white"></div>
            <div className="relative flex h-full flex-col overflow-hidden rounded-xl">
              <div className="px-8 pt-8 pb-8">
                <h2 className="text-2xl font-medium tracking-tight text-eerie-black mb-4">Intellectual Property Rights</h2>
                <p className="text-cool-black leading-relaxed mb-4">
                  All content, features, and functionality of our services, including but not limited to 
                  text, graphics, logos, images, and software, are owned by Holylabs Ltd or our licensors 
                  and are protected by copyright, trademark, and other intellectual property laws.
                </p>
                <ul className="space-y-2 text-cool-black">
                  <li>• You may not reproduce, distribute, or create derivative works without permission</li>
                  <li>• Our trademarks and service marks may not be used without prior written consent</li>
                  <li>• Any feedback or suggestions you provide may be used by us without compensation</li>
                </ul>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-px rounded-xl shadow-sm ring-1 ring-black/5"></div>
          </div>

          {/* Limitation of Liability */}
          <div className="relative mb-8">
            <div className="absolute inset-px rounded-xl bg-white"></div>
            <div className="relative flex h-full flex-col overflow-hidden rounded-xl">
              <div className="px-8 pt-8 pb-8">
                <div className="flex items-center mb-4">
                  <Scale className="w-8 h-8 text-tufts-blue mr-3" />
                  <h2 className="text-2xl font-medium tracking-tight text-eerie-black">Limitation of Liability</h2>
                </div>
                <p className="text-cool-black leading-relaxed mb-4">
                  To the maximum extent permitted by law, Holylabs Ltd shall not be liable for any 
                  indirect, incidental, special, consequential, or punitive damages, including but 
                  not limited to loss of profits, data, or business opportunities.
                </p>
                <div className="bg-tufts-blue/10 border-l-4 border-tufts-blue p-4 rounded-lg">
                  <p className="text-eerie-black text-sm">
                    <strong>Important:</strong> Our total liability for any claims related to our services 
                    shall not exceed the amount paid by you for the specific service in question during 
                    the twelve months preceding the claim.
                  </p>
                </div>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-px rounded-xl shadow-sm ring-1 ring-black/5"></div>
          </div>

          {/* Governing Law */}
          <div className="relative mb-8">
            <div className="absolute inset-px rounded-xl bg-white"></div>
            <div className="relative flex h-full flex-col overflow-hidden rounded-xl">
              <div className="px-8 pt-8 pb-8">
                <h2 className="text-2xl font-medium tracking-tight text-eerie-black mb-4">Governing Law & Dispute Resolution</h2>
                <div className="space-y-4 text-cool-black">
                  <p>
                    These Terms shall be governed by and construed in accordance with the laws of 
                    England and Wales, without regard to conflict of law principles.
                  </p>
                  <p>
                    Any disputes arising from these Terms or our services shall be resolved through 
                    binding arbitration in London, United Kingdom, except where prohibited by local law.
                  </p>
                  <p>
                    You agree to first attempt to resolve any disputes through our customer support 
                    team before pursuing formal legal action.
                  </p>
                </div>
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

export default TermsOfService;
