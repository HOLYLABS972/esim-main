import { NextResponse } from 'next/server';
import translationService from '../../../src/services/translationService';

export async function POST(request) {
  try {
    const { text, targetLanguage, sourceLanguage = 'en' } = await request.json();
    
    if (!text || !targetLanguage) {
      return NextResponse.json(
        { error: 'Text and target language are required' },
        { status: 400 }
      );
    }

    const translatedText = await translationService.translateText(text, targetLanguage, sourceLanguage);
    
    return NextResponse.json({
      success: true,
      originalText: text,
      translatedText,
      sourceLanguage,
      targetLanguage
    });
  } catch (error) {
    console.error('Translation API error:', error);
    return NextResponse.json(
      { error: 'Translation failed', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Translation API is running',
    supportedLanguages: translationService.getSupportedLanguages()
  });
}
