import { NextResponse } from 'next/server';
import { createBlogPost } from '../../../src/services/blogService';

const BLOG_SECRET_KEY = 'roamjet-blog-2026';

export async function POST(request) {
  try {
    const blogKey = request.headers.get('X-Blog-Key');
    if (blogKey !== BLOG_SECRET_KEY) {
      return NextResponse.json({ error: 'Unauthorized. Invalid blog key.' }, { status: 401 });
    }

    const body = await request.json();
    const requiredFields = ['slug', 'title', 'excerpt', 'content'];
    const missingFields = requiredFields.filter(field => !body[field]);
    if (missingFields.length > 0) {
      return NextResponse.json({ error: `Missing required fields: ${missingFields.join(', ')}` }, { status: 400 });
    }

    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(body.slug)) {
      return NextResponse.json({ error: 'Invalid slug format.' }, { status: 400 });
    }

    const createdPost = await createBlogPost({
      slug: body.slug.trim(),
      title: body.title.trim(),
      excerpt: body.excerpt.trim(),
      content: body.content,
      coverImage: body.coverImage || null,
      author: body.author || 'Roamjet Team',
      tags: Array.isArray(body.tags) ? body.tags : [],
      metaDescription: body.metaDescription || body.excerpt.trim(),
      published: body.published !== false
    });

    return NextResponse.json({ success: true, data: createdPost }, { status: 201 });
  } catch (error) {
    console.error('Blog API Error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Blog API is running', version: '2.0.0' });
}
