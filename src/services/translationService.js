// Translation service for multi-language blog posts
import { Translate } from '@google-cloud/translate/build/src/v2';

class TranslationService {
  constructor() {
    // Initialize Google Translate client
    this.translate = new Translate({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE, // Optional: if using service account
      key: process.env.GOOGLE_TRANSLATE_API_KEY, // Alternative: API key
    });
    
    // Supported languages
    this.supportedLanguages = {
      'en': 'English',
      'ar': 'Arabic', 
      'fr': 'French',
      'de': 'German',
      'es': 'Spanish',
      'he': 'Hebrew',
      'ru': 'Russian'
    };
  }

  // Translate text to target language
  async translateText(text, targetLanguage, sourceLanguage = 'en') {
    try {
      if (!text || !targetLanguage) {
        throw new Error('Text and target language are required');
      }

      // If source and target are the same, return original text
      if (sourceLanguage === targetLanguage) {
        return text;
      }

      const [translation] = await this.translate.translate(text, {
        from: sourceLanguage,
        to: targetLanguage,
      });

      return translation;
    } catch (error) {
      console.error('Translation error:', error);
      // Return original text if translation fails
      return text;
    }
  }

  // Translate blog post content
  async translateBlogPost(post, targetLanguage) {
    try {
      const translatedPost = {
        ...post,
        id: `${post.id}_${targetLanguage}`,
        language: targetLanguage,
        originalPostId: post.id,
        translatedAt: new Date().toISOString(),
      };

      // Translate title
      if (post.title) {
        translatedPost.title = await this.translateText(post.title, targetLanguage);
      }

      // Translate excerpt
      if (post.excerpt) {
        translatedPost.excerpt = await this.translateText(post.excerpt, targetLanguage);
      }

      // Translate content (HTML content)
      if (post.content) {
        // Extract text content from HTML for translation
        const textContent = this.extractTextFromHTML(post.content);
        const translatedText = await this.translateText(textContent, targetLanguage);
        translatedPost.content = this.reconstructHTML(post.content, translatedText);
      }

      // Translate SEO fields
      if (post.metaTitle) {
        translatedPost.metaTitle = await this.translateText(post.metaTitle, targetLanguage);
      }

      if (post.metaDescription) {
        translatedPost.metaDescription = await this.translateText(post.metaDescription, targetLanguage);
      }

      if (post.ogTitle) {
        translatedPost.ogTitle = await this.translateText(post.ogTitle, targetLanguage);
      }

      if (post.ogDescription) {
        translatedPost.ogDescription = await this.translateText(post.ogDescription, targetLanguage);
      }

      if (post.twitterTitle) {
        translatedPost.twitterTitle = await this.translateText(post.twitterTitle, targetLanguage);
      }

      if (post.twitterDescription) {
        translatedPost.twitterDescription = await this.translateText(post.twitterDescription, targetLanguage);
      }

      return translatedPost;
    } catch (error) {
      console.error('Blog post translation error:', error);
      return post; // Return original post if translation fails
    }
  }

  // Extract text content from HTML
  extractTextFromHTML(html) {
    // Simple HTML tag removal - in production, use a proper HTML parser
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  // Reconstruct HTML with translated text
  reconstructHTML(originalHTML, translatedText) {
    // This is a simplified approach - in production, you'd want more sophisticated HTML handling
    // For now, we'll replace the text content while preserving HTML structure
    const words = translatedText.split(' ');
    let wordIndex = 0;
    
    return originalHTML.replace(/<[^>]*>/g, (match) => {
      return match;
    }).replace(/\b\w+\b/g, () => {
      return words[wordIndex++] || '';
    });
  }

  // Get all supported languages
  getSupportedLanguages() {
    return this.supportedLanguages;
  }

  // Check if language is supported
  isLanguageSupported(language) {
    return language in this.supportedLanguages;
  }

  // Translate multiple posts
  async translateMultiplePosts(posts, targetLanguage) {
    const translatedPosts = [];
    
    for (const post of posts) {
      try {
        const translatedPost = await this.translateBlogPost(post, targetLanguage);
        translatedPosts.push(translatedPost);
      } catch (error) {
        console.error(`Error translating post ${post.id}:`, error);
        // Add original post if translation fails
        translatedPosts.push({
          ...post,
          language: targetLanguage,
          translationError: true
        });
      }
    }
    
    return translatedPosts;
  }
}

// Create singleton instance
const translationService = new TranslationService();

export default translationService;
