import { NextResponse } from 'next/server';
import { createBlogPost } from '../../../src/services/blogService';

// Secret key for blog post creation
const BLOG_SECRET_KEY = 'roamjet-blog-2026';

export async function POST(request) {
  try {
    // Check authentication header
    const blogKey = request.headers.get('X-Blog-Key');
    if (blogKey !== BLOG_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized. Invalid blog key.' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['slug', 'title', 'excerpt', 'content'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate slug format (URL-friendly)
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(body.slug)) {
      return NextResponse.json(
        { error: 'Invalid slug format. Use lowercase letters, numbers, and hyphens only.' },
        { status: 400 }
      );
    }

    // Prepare blog post data
    const blogPostData = {
      slug: body.slug.trim(),
      title: body.title.trim(),
      excerpt: body.excerpt.trim(),
      content: body.content,
      coverImage: body.coverImage || null,
      author: body.author || 'Roamjet Team',
      tags: Array.isArray(body.tags) ? body.tags : [],
      metaDescription: body.metaDescription || body.excerpt.trim(),
      published: body.published !== false // Default to true unless explicitly false
    };

    // Create the blog post
    const createdPost = await createBlogPost(blogPostData);

    return NextResponse.json({
      success: true,
      data: createdPost,
      message: 'Blog post created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Blog API Error:', error);

    // Handle specific Firestore errors
    if (error.code === 'already-exists') {
      return NextResponse.json(
        { error: 'A blog post with this slug already exists.' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Blog API is running',
    endpoints: {
      POST: 'Create a new blog post',
    },
    authentication: 'X-Blog-Key header required',
    version: '1.0.0'
  });
}