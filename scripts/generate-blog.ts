/**
 * DevOps Duoo - AI Blog Generator
 * 
 * This script uses Google Gemini API (free tier) to generate SEO-optimized blog posts
 * for the DevOps Duoo website.
 * 
 * Usage:
 *   npx tsx scripts/generate-blog.ts
 * 
 * Environment Variables:
 *   GEMINI_API_KEY - Your Google Gemini API key (free from https://aistudio.google.com/apikey)
 */

import fs from 'fs';
import path from 'path';

interface BlogTopic {
  topic: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  category: 'kubernetes' | 'cicd' | 'cloud' | 'monitoring' | 'security' | 'automation' | 'interview';
  intent: 'tutorial' | 'troubleshooting' | 'guide' | 'interview' | 'comparison';
  targetLength: number;
}

interface GeneratedBlog {
  title: string;
  slug: string;
  description: string;
  content: string;
  keywords: string[];
  category: string;
  readTime: number;
}

// ============================================
// TOPIC QUEUE - Add your topics here
// ============================================
const TOPICS_QUEUE: BlogTopic[] = [
  {
    topic: "Kubernetes CPU Alert Not Firing - Complete Troubleshooting Guide",
    primaryKeyword: "kubernetes cpu alert not firing",
    secondaryKeywords: ["prometheus alerting", "kubernetes monitoring", "cpu throttling", "alertmanager troubleshooting"],
    category: "kubernetes",
    intent: "troubleshooting",
    targetLength: 1800
  },
  {
    topic: "GitLab CI/CD Pipeline Optimization for Large Monorepos",
    primaryKeyword: "gitlab ci cd pipeline optimization",
    secondaryKeywords: ["monorepo ci cd", "gitlab runner optimization", "pipeline caching", "parallel jobs"],
    category: "cicd",
    intent: "tutorial",
    targetLength: 2000
  },
  {
    topic: "Terraform State Management Best Practices for Production",
    primaryKeyword: "terraform state management best practices",
    secondaryKeywords: ["terraform remote state", "state locking", "terraform workspaces", "state migration"],
    category: "automation",
    intent: "guide",
    targetLength: 1800
  },
  {
    topic: "Kubernetes Pod Stuck in Terminating State - How to Fix",
    primaryKeyword: "kubernetes pod stuck terminating",
    secondaryKeywords: ["kubectl delete force", "finalizers removal", "pod eviction", "graceful shutdown"],
    category: "kubernetes",
    intent: "troubleshooting",
    targetLength: 1500
  },
  {
    topic: "AWS EKS vs Self-Managed Kubernetes - Production Comparison",
    primaryKeyword: "eks vs self managed kubernetes",
    secondaryKeywords: ["kubernetes production", "eks cost comparison", "managed kubernetes", "kubernetes operations"],
    category: "cloud",
    intent: "comparison",
    targetLength: 2200
  }
];

// ============================================
// GPT PROMPT TEMPLATES
// ============================================
const SYSTEM_PROMPT = `You are the senior technical writer for DevOps Duoo, a practical DevOps learning platform focused on real-world Kubernetes, CI/CD, and cloud production issues.

Your writing style:
- Practical and production-focused
- Written for DevOps engineers with 2-5 years experience
- Includes real commands and code examples
- Uses clear H2 and H3 structure
- Avoids fluff - every sentence adds value
- Includes warnings for common pitfalls
- References actual tools and versions

Output format:
- Use Markdown format
- Single H1 for title (provided separately)
- Use H2 for major sections
- Use H3 for subsections
- Include code blocks with proper language tags
- Add comments in code for clarity
- Include a TL;DR at the beginning
- End with a clear conclusion and next steps`;

function generateUserPrompt(topic: BlogTopic): string {
  return `Write a comprehensive blog post on the following topic:

**Topic:** ${topic.topic}
**Primary Keyword:** ${topic.primaryKeyword}
**Secondary Keywords:** ${topic.secondaryKeywords.join(', ')}
**Intent:** ${topic.intent}
**Target Length:** ${topic.targetLength} words

Requirements:
1. Start with a TL;DR section (2-3 bullet points)
2. Include a "The Problem" or "What You'll Learn" section
3. Provide step-by-step instructions with actual commands
4. Include at least 2 code/command examples with explanations
5. Add a "Common Mistakes" or "Troubleshooting" section
6. End with "Key Takeaways" (3-5 bullet points)
7. Include internal linking placeholders like [INTERNAL_LINK: related-topic]

Target audience: DevOps engineers working in production environments who need practical, tested solutions.

Do NOT include:
- Generic introductions like "In today's fast-paced world..."
- Unnecessary padding or filler content
- Outdated tool versions
- Untested commands

DO include:
- Specific tool versions where relevant
- Production-tested configurations
- Performance considerations
- Security implications where applicable`;
}

// ============================================
// GOOGLE GEMINI API INTEGRATION (FREE TIER)
// ============================================
const GEMINI_MODELS = [
  'gemini-1.5-flash',
  'gemini-2.0-flash-lite',
  'gemini-2.0-flash',
];

async function callGeminiAPI(topic: BlogTopic, retries = 3): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set. Get a free key at https://aistudio.google.com/apikey');
  }

  const prompt = `${SYSTEM_PROMPT}\n\n${generateUserPrompt(topic)}`;

  for (const model of GEMINI_MODELS) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      console.log(`   Trying model: ${model} (attempt ${attempt}/${retries})...`);
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: prompt }]
            }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 8192,
            }
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
          console.log(`   ✅ Success with model: ${model}`);
          return data.candidates[0].content.parts[0].text;
        }
      }

      const status = response.status;
      if (status === 429) {
        console.log(`   ⏳ Rate limited on ${model}, waiting 20s...`);
        await new Promise(resolve => setTimeout(resolve, 20000));
      } else if (status === 404 || status === 403) {
        console.log(`   ⚠️ Model ${model} not available, trying next...`);
        break; // Try next model
      } else {
        const error = await response.json().catch(() => ({}));
        console.log(`   ⚠️ Error (${status}): ${JSON.stringify(error).substring(0, 100)}`);
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
    }
  }

  throw new Error('All Gemini models failed. Check your API key quota at https://ai.dev/rate-limit');
}

// ============================================
// POST-PROCESSING
// ============================================
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 60);
}

function calculateReadTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

function generateDescription(content: string, primaryKeyword: string): string {
  // Extract first meaningful paragraph after TL;DR
  const lines = content.split('\n').filter(line => 
    line.trim() && 
    !line.startsWith('#') && 
    !line.startsWith('-') &&
    !line.startsWith('*') &&
    line.length > 50
  );
  
  let description = lines[0] || `Learn about ${primaryKeyword} with practical examples and production-tested solutions.`;
  
  // Ensure it's within SEO limits (150-160 chars)
  if (description.length > 155) {
    description = description.substring(0, 152) + '...';
  }
  
  return description;
}

function createFrontMatter(blog: GeneratedBlog, topic: BlogTopic): string {
  const date = new Date().toISOString().split('T')[0];
  
  return `---
title: "${blog.title}"
description: "${blog.description}"
date: "${date}"
lastModified: "${date}"
author: "DevOps Duoo"
category: "${topic.category}"
tags:
${blog.keywords.map(k => `  - "${k}"`).join('\n')}
readTime: ${blog.readTime}
featured: false
draft: true
seo:
  title: "${blog.title} | DevOps Duoo"
  description: "${blog.description}"
  keywords: "${blog.keywords.join(', ')}"
  canonical: "/blog/${blog.slug}"
---

`;
}

function processContent(content: string): string {
  // Add internal link placeholders processing
  let processed = content;
  
  // Replace internal link placeholders with actual links
  // These should be manually reviewed and updated
  processed = processed.replace(
    /\[INTERNAL_LINK: ([^\]]+)\]/g,
    '<!-- TODO: Add internal link to: $1 -->'
  );
  
  // Ensure proper spacing
  processed = processed.replace(/\n{3,}/g, '\n\n');
  
  return processed;
}

// ============================================
// MAIN GENERATION FUNCTION
// ============================================
async function generateBlogPost(topic: BlogTopic): Promise<void> {
  console.log(`\n📝 Generating blog post: "${topic.topic}"`);
  console.log(`   Primary keyword: ${topic.primaryKeyword}`);
  console.log(`   Category: ${topic.category}`);
  console.log(`   Intent: ${topic.intent}\n`);

  try {
    // Generate content via Gemini
    console.log('🤖 Calling Gemini API...');
    const rawContent = await callGeminiAPI(topic);
    console.log('✅ Content generated successfully');

    // Process and structure the blog
    const slug = generateSlug(topic.topic);
    const readTime = calculateReadTime(rawContent);
    const description = generateDescription(rawContent, topic.primaryKeyword);
    const processedContent = processContent(rawContent);

    const blog: GeneratedBlog = {
      title: topic.topic,
      slug,
      description,
      content: processedContent,
      keywords: [topic.primaryKeyword, ...topic.secondaryKeywords],
      category: topic.category,
      readTime
    };

    // Create front matter
    const frontMatter = createFrontMatter(blog, topic);
    const finalContent = frontMatter + processedContent;

    // Save to file
    const date = new Date().toISOString().split('T')[0];
    const filename = `${date}-${slug}.md`;
    const filepath = path.join(process.cwd(), 'content', 'blog', filename);

    // Ensure directory exists
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filepath, finalContent, 'utf-8');
    
    console.log(`\n✅ Blog post saved: ${filename}`);
    console.log(`   📖 Read time: ${readTime} minutes`);
    console.log(`   🏷️  Keywords: ${blog.keywords.slice(0, 3).join(', ')}...`);
    console.log(`   ⚠️  Status: DRAFT - Review before publishing\n`);

  } catch (error) {
    console.error(`\n❌ Error generating blog post:`, error);
    throw error;
  }
}

// ============================================
// TOPIC SELECTION
// ============================================
function getNextTopic(): BlogTopic {
  // Get today's day of year for rotation
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  // Rotate through topics
  const index = dayOfYear % TOPICS_QUEUE.length;
  return TOPICS_QUEUE[index];
}

function getTopicByIndex(index: number): BlogTopic {
  if (index < 0 || index >= TOPICS_QUEUE.length) {
    throw new Error(`Topic index ${index} is out of range (0-${TOPICS_QUEUE.length - 1})`);
  }
  return TOPICS_QUEUE[index];
}

// ============================================
// CLI ENTRY POINT
// ============================================
async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  🚀 DevOps Duoo - AI Blog Generator');
  console.log('═══════════════════════════════════════════════════════════');

  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage:
  npx ts-node scripts/generate-blog.ts [options]

Options:
  --help, -h        Show this help message
  --list            List all topics in queue
  --topic <index>   Generate specific topic by index
  --next            Generate next topic in rotation (default)
  --all             Generate all topics (use with caution)

Environment:
  GEMINI_API_KEY    Required. Free key from https://aistudio.google.com/apikey

Examples:
  npx ts-node scripts/generate-blog.ts --list
  npx ts-node scripts/generate-blog.ts --topic 0
  GEMINI_API_KEY=xxx npx tsx scripts/generate-blog.ts --next
`);
    process.exit(0);
  }

  if (args.includes('--list')) {
    console.log('\n📋 Topics Queue:\n');
    TOPICS_QUEUE.forEach((topic, index) => {
      console.log(`  [${index}] ${topic.topic}`);
      console.log(`      Category: ${topic.category} | Intent: ${topic.intent}`);
      console.log(`      Keywords: ${topic.primaryKeyword}\n`);
    });
    process.exit(0);
  }

  let topic: BlogTopic;

  const topicIndex = args.indexOf('--topic');
  if (topicIndex !== -1 && args[topicIndex + 1]) {
    const index = parseInt(args[topicIndex + 1], 10);
    topic = getTopicByIndex(index);
  } else if (args.includes('--all')) {
    console.log('\n⚠️  Generating ALL topics. This will make multiple API calls.\n');
    for (const t of TOPICS_QUEUE) {
      await generateBlogPost(t);
      // Small delay between API calls
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    console.log('\n✅ All topics generated!\n');
    process.exit(0);
  } else {
    topic = getNextTopic();
  }

  await generateBlogPost(topic);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
