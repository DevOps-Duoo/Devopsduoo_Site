/**
 * Blog utilities for DevOps Duoo
 * 
 * This module provides functions to read and parse blog posts
 * from the content/blog directory.
 */

import fs from 'fs';
import path from 'path';

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  lastModified: string;
  author: string;
  category: string;
  tags: string[];
  readTime: number;
  featured: boolean;
  draft: boolean;
  content: string;
  seo: {
    title: string;
    description: string;
    keywords: string;
    canonical: string;
  };
}

export interface BlogPostMeta {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  category: string;
  tags: string[];
  readTime: number;
  featured: boolean;
}

const BLOG_DIR = path.join(process.cwd(), 'content', 'blog');

/**
 * Parse frontmatter from markdown content
 */
function parseFrontmatter(content: string): { data: Record<string, any>; content: string } {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return { data: {}, content };
  }

  const frontmatter = match[1];
  const body = match[2];

  const data: Record<string, any> = {};
  
  // Simple YAML parsing for our use case
  const lines = frontmatter.split('\n');
  let currentKey = '';
  let inArray = false;
  let arrayValues: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed.startsWith('- ') && inArray) {
      // Array item
      const value = trimmed.substring(2).replace(/^"|"$/g, '');
      arrayValues.push(value);
    } else if (trimmed.includes(':')) {
      // Save previous array if exists
      if (inArray && currentKey) {
        data[currentKey] = arrayValues;
        arrayValues = [];
        inArray = false;
      }

      const colonIndex = trimmed.indexOf(':');
      const key = trimmed.substring(0, colonIndex).trim();
      let value = trimmed.substring(colonIndex + 1).trim();

      if (value === '') {
        // Could be start of array or nested object
        inArray = true;
        currentKey = key;
      } else {
        // Simple value
        value = value.replace(/^"|"$/g, '');
        
        // Type conversion
        if (value === 'true') data[key] = true;
        else if (value === 'false') data[key] = false;
        else if (!isNaN(Number(value)) && value !== '') data[key] = Number(value);
        else data[key] = value;
      }
    }
  }

  // Save last array if exists
  if (inArray && currentKey) {
    data[currentKey] = arrayValues;
  }

  return { data, content: body };
}

/**
 * Get all blog posts (excluding drafts in production)
 */
export async function getAllPosts(includeDrafts = false): Promise<BlogPostMeta[]> {
  if (!fs.existsSync(BLOG_DIR)) {
    return [];
  }

  const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));
  const posts: BlogPostMeta[] = [];

  for (const file of files) {
    const slug = file.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.md$/, '');
    const fullPath = path.join(BLOG_DIR, file);
    const content = fs.readFileSync(fullPath, 'utf-8');
    const { data } = parseFrontmatter(content);

    // Skip drafts in production
    if (data.draft && !includeDrafts) {
      continue;
    }

    posts.push({
      slug,
      title: data.title || 'Untitled',
      description: data.description || '',
      date: data.date || '',
      author: data.author || 'DevOps Duoo',
      category: data.category || 'general',
      tags: data.tags || [],
      readTime: data.readTime || 5,
      featured: data.featured || false,
    });
  }

  // Sort by date descending
  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Get a single blog post by slug
 */
export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  if (!fs.existsSync(BLOG_DIR)) {
    return null;
  }

  const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));
  
  for (const file of files) {
    const fileSlug = file.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.md$/, '');
    
    if (fileSlug === slug) {
      const fullPath = path.join(BLOG_DIR, file);
      const content = fs.readFileSync(fullPath, 'utf-8');
      const { data, content: body } = parseFrontmatter(content);

      return {
        slug,
        title: data.title || 'Untitled',
        description: data.description || '',
        date: data.date || '',
        lastModified: data.lastModified || data.date || '',
        author: data.author || 'DevOps Duoo',
        category: data.category || 'general',
        tags: data.tags || [],
        readTime: data.readTime || 5,
        featured: data.featured || false,
        draft: data.draft || false,
        content: body,
        seo: data.seo || {
          title: data.title,
          description: data.description,
          keywords: '',
          canonical: `/blog/${slug}`,
        },
      };
    }
  }

  return null;
}

/**
 * Get posts by category
 */
export async function getPostsByCategory(category: string): Promise<BlogPostMeta[]> {
  const allPosts = await getAllPosts();
  return allPosts.filter(post => post.category.toLowerCase() === category.toLowerCase());
}

/**
 * Get posts by tag
 */
export async function getPostsByTag(tag: string): Promise<BlogPostMeta[]> {
  const allPosts = await getAllPosts();
  return allPosts.filter(post => 
    post.tags.some(t => t.toLowerCase() === tag.toLowerCase())
  );
}

/**
 * Get featured posts
 */
export async function getFeaturedPosts(limit = 3): Promise<BlogPostMeta[]> {
  const allPosts = await getAllPosts();
  return allPosts.filter(post => post.featured).slice(0, limit);
}

/**
 * Get related posts based on category and tags
 */
export async function getRelatedPosts(slug: string, limit = 3): Promise<BlogPostMeta[]> {
  const currentPost = await getPostBySlug(slug);
  if (!currentPost) return [];

  const allPosts = await getAllPosts();
  
  // Score posts by relevance
  const scored = allPosts
    .filter(post => post.slug !== slug)
    .map(post => {
      let score = 0;
      
      // Same category
      if (post.category === currentPost.category) score += 2;
      
      // Shared tags
      const sharedTags = post.tags.filter(t => currentPost.tags.includes(t));
      score += sharedTags.length;
      
      return { post, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map(item => item.post);
}

/**
 * Get all unique categories
 */
export async function getAllCategories(): Promise<string[]> {
  const allPosts = await getAllPosts();
  const categories = new Set(allPosts.map(post => post.category));
  return Array.from(categories).sort();
}

/**
 * Get all unique tags
 */
export async function getAllTags(): Promise<string[]> {
  const allPosts = await getAllPosts();
  const tags = new Set(allPosts.flatMap(post => post.tags));
  return Array.from(tags).sort();
}
