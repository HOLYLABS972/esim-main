/**
 * Admin utility to regenerate SEO for existing blog posts
 * This can be used to update SEO for posts created before auto-SEO was implemented
 */

import { enhancePostWithAutoSEO } from './autoSEOGenerator';
import { blogService } from '../services/blogService';

/**
 * Regenerate SEO for a specific post
 */
export async function regeneratePostSEO(postId) {
  try {
    console.log(`🔄 Regenerating SEO for post: ${postId}`);
    
    // Get the post data
    const post = await blogService.getPostById(postId);
    if (!post) {
      throw new Error('Post not found');
    }
    
    // Generate new SEO data
    const enhancedPost = enhancePostWithAutoSEO(post);
    
    // Update the post with new SEO data
    await blogService.updatePost(postId, {
      seoTitle: enhancedPost.seoTitle,
      seoDescription: enhancedPost.seoDescription,
      seoKeywords: enhancedPost.seoKeywords
    });
    
    console.log('✅ SEO regenerated successfully');
    console.log(`New SEO Title: ${enhancedPost.seoTitle}`);
    console.log(`New SEO Description: ${enhancedPost.seoDescription}`);
    console.log(`New SEO Keywords: ${enhancedPost.seoKeywords.join(', ')}`);
    
    return enhancedPost;
  } catch (error) {
    console.error('❌ Error regenerating SEO:', error);
    throw error;
  }
}

/**
 * Regenerate SEO for all posts
 */
export async function regenerateAllPostsSEO() {
  try {
    console.log('🔄 Regenerating SEO for all posts...');
    
    // Get all posts
    const posts = await blogService.getAllPosts();
    
    if (!posts || posts.length === 0) {
      console.log('ℹ️ No posts found to update');
      return;
    }
    
    console.log(`📊 Found ${posts.length} posts to update`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const post of posts) {
      try {
        await regeneratePostSEO(post.id);
        successCount++;
      } catch (error) {
        console.error(`❌ Failed to update post ${post.id}:`, error);
        errorCount++;
      }
    }
    
    console.log('\n📈 Regeneration Summary:');
    console.log(`✅ Successfully updated: ${successCount} posts`);
    console.log(`❌ Failed to update: ${errorCount} posts`);
    console.log(`📊 Total processed: ${posts.length} posts`);
    
  } catch (error) {
    console.error('❌ Error regenerating all posts SEO:', error);
    throw error;
  }
}

/**
 * Check SEO status for all posts
 */
export async function checkSEOStatus() {
  try {
    console.log('🔍 Checking SEO status for all posts...');
    
    const posts = await blogService.getAllPosts();
    
    if (!posts || posts.length === 0) {
      console.log('ℹ️ No posts found');
      return;
    }
    
    let withSEO = 0;
    let withoutSEO = 0;
    let needsUpdate = 0;
    
    posts.forEach(post => {
      if (post.seoTitle && post.seoDescription && post.seoKeywords?.length > 0) {
        withSEO++;
        
        // Check if SEO looks auto-generated (contains target keywords)
        const hasTargetKeywords = post.seoKeywords.some(keyword => 
          keyword.toLowerCase().includes('esim') || 
          keyword.toLowerCase().includes('travel') ||
          keyword.toLowerCase().includes('backpacker') ||
          keyword.toLowerCase().includes('nomad')
        );
        
        if (!hasTargetKeywords) {
          needsUpdate++;
        }
      } else {
        withoutSEO++;
      }
    });
    
    console.log('\n📊 SEO Status Report:');
    console.log(`✅ Posts with SEO: ${withSEO}`);
    console.log(`❌ Posts without SEO: ${withoutSEO}`);
    console.log(`🔄 Posts needing SEO update: ${needsUpdate}`);
    console.log(`📊 Total posts: ${posts.length}`);
    
    return {
      total: posts.length,
      withSEO,
      withoutSEO,
      needsUpdate
    };
    
  } catch (error) {
    console.error('❌ Error checking SEO status:', error);
    throw error;
  }
}

// Export for use in admin panel or console
export default {
  regeneratePostSEO,
  regenerateAllPostsSEO,
  checkSEOStatus
};
