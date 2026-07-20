import { Metadata } from 'next';
import Link from 'next/link';
import { getAllPosts, getAllCategories, BlogPostMeta } from '@/lib/blog';

export const metadata: Metadata = {
  title: 'DevOps Blog - Tutorials, Guides & Best Practices',
  description: 'Practical DevOps tutorials, Kubernetes troubleshooting guides, CI/CD best practices, and cloud infrastructure tips from real production experience.',
  keywords: [
    'DevOps blog',
    'Kubernetes tutorials',
    'CI/CD guides',
    'cloud infrastructure',
    'DevOps best practices',
    'production troubleshooting'
  ],
  openGraph: {
    title: 'DevOps Blog - Tutorials, Guides & Best Practices | DevOps Duoo',
    description: 'Practical DevOps tutorials and guides from real production experience.',
    url: '/blog',
    type: 'website',
  },
};

// Category colors for visual distinction
const categoryColors: Record<string, string> = {
  kubernetes: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  cicd: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  cloud: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  monitoring: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  security: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  automation: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  interview: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
};

function BlogCard({ post }: { post: BlogPostMeta }) {
  const categoryColor = categoryColors[post.category] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  
  return (
    <article className="group h-full bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 dark:border-gray-700">
      <Link href={`/blog/${post.slug}`} className="flex h-full flex-col p-5 sm:p-6">
        {/* Category & Read Time */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${categoryColor}`}>
            {post.category}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {post.readTime} min read
          </span>
        </div>
        
        {/* Title */}
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug">
          {post.title}
        </h2>
        
        {/* Description */}
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-5 line-clamp-3 leading-relaxed flex-1">
          {post.description}
        </p>
        
        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {post.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded"
            >
              #{tag.replace(/\s+/g, '')}
            </span>
          ))}
        </div>
        
        {/* Footer */}
        <div className="mt-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {new Date(post.date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}
          </span>
          <span className="text-blue-600 dark:text-blue-400 text-sm font-medium group-hover:underline">
            Read more →
          </span>
        </div>
      </Link>
    </article>
  );
}

function CategoryFilter({ categories, activeCategory }: { categories: string[]; activeCategory?: string }) {
  return (
    <div className="flex flex-wrap gap-2 mb-8 sm:mb-10 pb-2">
      <Link
        href="/blog"
        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
          !activeCategory
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
      >
        All Posts
      </Link>
      {categories.map((category) => (
        <Link
          key={category}
          href={`/blog?category=${category}`}
          className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-colors whitespace-nowrap ${
            activeCategory === category
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          {category}
        </Link>
      ))}
    </div>
  );
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  const allPosts = await getAllPosts();
  const categories = await getAllCategories();
  
  // Filter by category if specified
  const filteredPosts = searchParams.category
    ? allPosts.filter(post => post.category === searchParams.category)
    : allPosts;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 text-white py-16 sm:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-5 leading-tight">
            DevOps Blog
          </h1>
          <p className="text-lg sm:text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
            Practical tutorials, real-world troubleshooting guides, and battle-tested best practices from production environments.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12">
        {/* Category Filter */}
        <CategoryFilter categories={categories} activeCategory={searchParams.category} />

        {/* Posts Grid */}
        {filteredPosts.length > 0 ? (
          <div className="grid gap-6 sm:gap-8 md:grid-cols-2 xl:grid-cols-3">
            {filteredPosts.map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              No posts yet
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {searchParams.category
                ? `No posts found in the "${searchParams.category}" category.`
                : 'Blog posts are coming soon. Stay tuned!'}
            </p>
            {searchParams.category && (
              <Link
                href="/blog"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                ← View all posts
              </Link>
            )}
          </div>
        )}

        {/* Newsletter CTA */}
        <section className="mt-12 sm:mt-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 sm:p-8 md:p-10 lg:p-12 text-center text-white">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            Stay Updated with DevOps Insights
          </h2>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Get the latest tutorials, troubleshooting guides, and best practices delivered to your inbox.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
            />
            <button className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors">
              Subscribe
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
