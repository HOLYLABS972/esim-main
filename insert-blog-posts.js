const fs = require('fs');
const path = require('path');

// Import Firebase admin SDK
const admin = require('firebase-admin');

// Initialize Firebase Admin (you'll need to set up service account key)
// For now, we'll use the client SDK approach since we have the config

// Import Firebase client SDK instead for this script
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, serverTimestamp, doc, setDoc } = require('firebase/firestore');

// Firebase configuration (same as in config.js)
const firebaseConfig = {
  apiKey: "AIzaSyAl456JTQntXJItbXSv8hx1oQ9KW4BGci4",
  authDomain: "esim-f0e3e.firebaseapp.com",
  projectId: "esim-f0e3e",
  storageBucket: "esim-f0e3e.firebasestorage.app",
  messagingSenderId: "482450515497",
  appId: "1:482450515497:web:5f15bfaf97b55221a39e38",
  measurementId: "G-T0YBW024Z8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function insertBlogPosts() {
  try {
    // Read the blog posts JSON file
    const blogPostsPath = path.join(__dirname, '..', 'blog-posts.json');
    const blogPostsData = JSON.parse(fs.readFileSync(blogPostsPath, 'utf8'));

    console.log(`📚 Found ${blogPostsData.length} blog posts to insert`);

    // Insert each blog post
    for (let i = 0; i < blogPostsData.length; i++) {
      const post = blogPostsData[i];
      
      try {
        // Prepare the blog post data for Firestore
        const blogPostData = {
          slug: post.slug,
          title: post.title,
          excerpt: post.excerpt,
          content: post.content,
          coverImage: post.coverImage,
          author: post.author || 'Roamjet Team',
          tags: post.tags || [],
          metaDescription: post.metaDescription,
          images: post.images || [],
          published: true,
          publishedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };

        // Insert into Firestore using the slug as document ID for predictable URLs
        const docRef = doc(db, 'blog_posts', post.slug);
        await setDoc(docRef, blogPostData);

        console.log(`✅ Inserted: ${post.title} (${post.slug})`);
        
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`❌ Error inserting ${post.title}:`, error.message);
      }
    }

    console.log('🎉 Blog post insertion completed!');
    
    // Log summary
    console.log('\n📊 Summary:');
    console.log(`- Total posts: ${blogPostsData.length}`);
    console.log('- Collection: blog_posts');
    console.log('- All posts set to published: true');
    console.log('- Images arrays included for each post');
    
    console.log('\n🔗 Posts can be viewed at:');
    blogPostsData.forEach(post => {
      console.log(`- https://roamjet.net/blog/${post.slug}`);
    });

    process.exit(0);
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the insertion
console.log('🚀 Starting blog post insertion...\n');
insertBlogPosts();