# DevOps Duoo - AI Blog Generation System

## 🚀 Overview

This automated blog generation system uses OpenAI's GPT API to create SEO-optimized DevOps content for devopsduoo.com. The system follows a **human-in-the-loop** approach where AI generates drafts and humans review before publishing.

## 📁 Project Structure

```
├── .github/workflows/
│   └── generate-blog.yml     # GitHub Actions workflow
├── scripts/
│   ├── generate-blog.ts      # Main generation script
│   └── topics.json           # Topic queue and config
├── content/blog/             # Generated markdown files
├── lib/blog.ts               # Blog utility functions
└── app/blog/                 # Next.js blog pages
    ├── page.tsx              # Blog listing page
    └── [slug]/page.tsx       # Individual blog post page
```

## 🔧 Setup

### 1. Install Dependencies

```bash
npm install
npm install -g ts-node typescript @types/node
```

### 2. Set Environment Variables

Create a `.env.local` file:

```env
OPENAI_API_KEY=sk-your-api-key-here
```

For GitHub Actions, add these secrets to your repository:
- `OPENAI_API_KEY`: Your OpenAI API key

### 3. Configure Topics

Edit `scripts/topics.json` to add your blog topics:

```json
{
  "topics": [
    {
      "topic": "Your Blog Title Here",
      "primaryKeyword": "main seo keyword",
      "secondaryKeywords": ["keyword1", "keyword2"],
      "category": "kubernetes",
      "intent": "tutorial",
      "targetLength": 1800,
      "status": "pending"
    }
  ]
}
```

## 💻 Local Usage

### List Available Topics

```bash
npx ts-node scripts/generate-blog.ts --list
```

### Generate Specific Topic

```bash
OPENAI_API_KEY=sk-xxx npx ts-node scripts/generate-blog.ts --topic 0
```

### Generate Next Topic in Rotation

```bash
OPENAI_API_KEY=sk-xxx npx ts-node scripts/generate-blog.ts --next
```

### Generate All Topics (Use with Caution)

```bash
OPENAI_API_KEY=sk-xxx npx ts-node scripts/generate-blog.ts --all
```

## ⚙️ GitHub Actions Workflow

### Automatic Schedule

The workflow runs automatically on **Monday, Wednesday, and Friday at 6:00 AM IST**.

### Manual Trigger

1. Go to **Actions** tab in GitHub
2. Select **Generate Blog Post** workflow
3. Click **Run workflow**
4. Optionally specify topic index or enable auto-merge

### Workflow Process

1. **Generate**: Creates markdown file with GPT
2. **Create PR**: Opens pull request with review checklist
3. **Human Review**: You verify content accuracy
4. **Merge**: Publish to main branch
5. **Deploy**: Site rebuilds with new content

## 📝 Content Guidelines

### SEO Best Practices (Enforced)

- ✅ Single H1 (title in frontmatter)
- ✅ Clear H2/H3 hierarchy
- ✅ Meta description under 160 characters
- ✅ Primary keyword in title and first paragraph
- ✅ Internal linking placeholders
- ✅ Proper code block formatting

### Content Quality Standards

- ✅ TL;DR at the beginning
- ✅ Practical, production-tested examples
- ✅ Step-by-step instructions
- ✅ Common mistakes section
- ✅ Key takeaways at the end

### Review Checklist (Before Merging)

- [ ] Title is accurate and SEO-friendly
- [ ] Commands/code examples are valid and tested
- [ ] No sensitive information exposed
- [ ] Technical accuracy verified
- [ ] Internal links properly set
- [ ] Change `draft: true` to `draft: false`

## 🎯 Categories

| Category | Description |
|----------|-------------|
| `kubernetes` | K8s concepts, troubleshooting, best practices |
| `cicd` | CI/CD pipelines, GitOps, automation |
| `cloud` | AWS, Azure, GCP guides |
| `monitoring` | Prometheus, Grafana, observability |
| `security` | DevSecOps, RBAC, secrets management |
| `automation` | Terraform, Ansible, IaC |
| `interview` | Interview prep and questions |

## 📊 Publishing Strategy

### Recommended Schedule

- **Frequency**: 3-4 posts per week (Mon/Wed/Fri)
- **Model**: AI generates draft → Human reviews → Publish
- **Quality over Quantity**: Never auto-publish without review

### Why Not Daily Auto-Publish?

| Approach | SEO Impact | Effort |
|----------|------------|--------|
| Full AI auto-publish daily | ⚠️ Risk of thin content | Low |
| **AI + human review (this system)** | ✅ Safe and scalable | Medium |
| Manual writing only | ✅ Highest quality | Very High |

## 🔄 Customization

### Modify GPT Prompt

Edit `SYSTEM_PROMPT` in `scripts/generate-blog.ts`:

```typescript
const SYSTEM_PROMPT = `You are the senior technical writer for DevOps Duoo...`;
```

### Add New Category Colors

Edit `categoryColors` in both:
- `app/blog/page.tsx`
- `app/blog/[slug]/page.tsx`

### Change Publishing Schedule

Edit cron schedule in `.github/workflows/generate-blog.yml`:

```yaml
schedule:
  - cron: '30 0 * * 1,3,5'  # Mon, Wed, Fri at 6:00 AM IST
```

## 🐛 Troubleshooting

### "OPENAI_API_KEY not set"

Ensure the environment variable is set:
```bash
export OPENAI_API_KEY=sk-xxx
```

### "No posts found" on blog page

Check if:
1. Markdown files exist in `content/blog/`
2. Files have `draft: false` in frontmatter
3. Date format is correct (YYYY-MM-DD)

### GitHub Actions failing

1. Verify `OPENAI_API_KEY` secret is set in repository settings
2. Check workflow logs for specific error
3. Ensure npm dependencies are up to date

## 📈 Monitoring & Analytics

### Recommended Tools

- **Google Search Console**: Track indexed posts and keywords
- **Google Analytics**: Monitor traffic and engagement
- **Ahrefs/SEMrush**: Keyword tracking (optional)

### Key Metrics to Watch

- Organic traffic to `/blog/*` pages
- Average time on page
- Bounce rate by post
- Keyword rankings improvement

## 🔒 Security Notes

- Never commit `.env.local` with API keys
- Use GitHub Secrets for sensitive data
- Review AI-generated content for accidental exposure
- Validate all code examples before publishing

## 📞 Support

Questions or issues? 
- Open an issue in this repository
- Email: contact@devopsduoo.com

---

*Built with ❤️ by DevOps Duoo*
