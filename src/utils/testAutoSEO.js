/**
 * Test utility for Auto-SEO Generation
 * This file can be used to test the auto-SEO functionality
 */

import { generateAutoSEO } from '../utils/autoSEOGenerator';

// Test data for different types of blog posts
const testPosts = [
  {
    title: "Airalo vs RoamJet vs eSIMo - Complete Comparison for Travelers",
    content: "When it comes to choosing the best eSIM for your travels, comparing Airalo vs RoamJet vs eSIMo is essential. Digital nomads and backpackers need reliable mobile data connectivity worldwide. This comprehensive comparison covers pricing, coverage, activation speed, and customer support to help you make the best choice for your travel needs.",
    excerpt: "Compare Airalo vs RoamJet vs eSIMo to find the best eSIM solution for travelers and digital nomads."
  },
  {
    title: "Best eSIM Plans for Digital Nomads Working Remotely",
    content: "Digital nomads need reliable internet connectivity to work from anywhere in the world. Our guide covers the best eSIM plans for remote workers, including coverage in popular nomad destinations, data allowances, and pricing. Learn how to stay connected while working remotely across different countries.",
    excerpt: "Complete guide to the best eSIM plans for digital nomads working remotely around the world."
  },
  {
    title: "Backpacker's Guide to Mobile Data While Traveling",
    content: "Backpackers need affordable mobile data solutions for their adventures. This guide covers budget-friendly eSIM options, tips for staying connected on a shoestring budget, and how to avoid expensive roaming charges. Perfect for budget travelers exploring multiple countries.",
    excerpt: "Essential mobile data tips and eSIM solutions for budget-conscious backpackers traveling the world."
  },
  {
    title: "How to Activate eSIM Instantly - Step by Step Tutorial",
    content: "Learn how to activate your eSIM instantly with our step-by-step tutorial. This guide covers activation for both iOS and Android devices, troubleshooting common issues, and tips for seamless connectivity. Perfect for travelers who need quick internet access upon arrival.",
    excerpt: "Step-by-step tutorial on how to activate eSIM instantly on iOS and Android devices."
  }
];

// Function to test auto-SEO generation
export function testAutoSEO() {
  console.log('🧪 Testing Auto-SEO Generation...\n');
  
  testPosts.forEach((post, index) => {
    console.log(`📝 Test Post ${index + 1}:`);
    console.log(`Title: ${post.title}`);
    console.log(`Content: ${post.content.substring(0, 100)}...`);
    
    const seoData = generateAutoSEO(post);
    
    console.log('\n🎯 Generated SEO Data:');
    console.log(`SEO Title: ${seoData.seoTitle}`);
    console.log(`SEO Description: ${seoData.seoDescription}`);
    console.log(`SEO Keywords: ${seoData.seoKeywords.join(', ')}`);
    console.log('\n' + '='.repeat(80) + '\n');
  });
}

// Function to test specific post data
export function testSpecificPost(postData) {
  console.log('🧪 Testing Specific Post SEO Generation...\n');
  console.log(`Title: ${postData.title}`);
  console.log(`Content: ${postData.content?.substring(0, 100)}...`);
  
  const seoData = generateAutoSEO(postData);
  
  console.log('\n🎯 Generated SEO Data:');
  console.log(`SEO Title: ${seoData.seoTitle}`);
  console.log(`SEO Description: ${seoData.seoDescription}`);
  console.log(`SEO Keywords: ${seoData.seoKeywords.join(', ')}`);
  
  return seoData;
}

// Export for use in browser console or testing
if (typeof window !== 'undefined') {
  window.testAutoSEO = testAutoSEO;
  window.testSpecificPost = testSpecificPost;
}

const testAutoSEOUtils = {
  testAutoSEO,
  testSpecificPost,
  testPosts
};

export default testAutoSEOUtils;
