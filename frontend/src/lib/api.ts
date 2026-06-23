import { BlogPost, LeadEntry, SiteContent } from './siteContent';
import { slugifyBlogTitle } from './blogUtils';

export interface GoogleReview {
  id: string;
  authorName: string;
  authorUrl?: string;
  rating: number;
  text: string;
  profilePhotoUrl?: string;
  relativeTimeDescription?: string;
}

const API_BASE = import.meta.env.VITE_API_URL || 'https://boxed-care-movers-backend.vercel.app';

function normalizeContent(content: any): SiteContent {
  if (content && typeof content === 'object' && content.site && typeof content.site === 'object') {
    const normalizedBlogs = Array.isArray(content.blogPosts)
      ? content.blogPosts.map((post: any) => ({
          ...post,
          slug: post.slug || slugifyBlogTitle(post.title || ''),
        }))
      : content.blogPosts;

    return {
      ...content.site,
      ...content,
      blogPosts: normalizedBlogs,
    };
  }
  if (content && Array.isArray(content.blogPosts)) {
    return {
      ...content,
      blogPosts: content.blogPosts.map((post: any) => ({
        ...post,
        slug: post.slug || slugifyBlogTitle(post.title || ''),
      })),
    };
  }
  return content;
}

async function parseResponse(response: Response) {
  const text = await response.text();
  if (!response.ok) {
    throw new Error(text || response.statusText || 'API request failed');
  }
  return text ? JSON.parse(text) : null;
}

export async function fetchSiteContent(): Promise<SiteContent> {
  const response = await fetch(`${API_BASE}/api/content`);
  const content = await parseResponse(response);
  return normalizeContent(content);
}

export async function saveSiteContent(content: SiteContent, token: string): Promise<SiteContent> {
  const response = await fetch(`${API_BASE}/api/content`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(content),
  });
  return parseResponse(response);
}

export async function fetchLeads(token: string): Promise<LeadEntry[]> {
  const response = await fetch(`${API_BASE}/api/leads`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return parseResponse(response);
}

export async function postLead(lead: LeadEntry): Promise<LeadEntry> {
  const response = await fetch(`${API_BASE}/api/leads`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(lead),
  });
  return parseResponse(response);
}

export async function loginAdmin(username: string, password: string): Promise<{ token: string }> {
  const response = await fetch(`${API_BASE}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return parseResponse(response);
}

export async function verifyToken(token: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  await parseResponse(response);
}

export async function uploadFile(file: File, token: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/api/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  
  const result = await parseResponse(response);
  return result.url;
}

export async function deleteLead(leadId: string, token: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api/leads/${leadId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  await parseResponse(response);
}

export async function fetchBlogs(): Promise<BlogPost[]> {
  const response = await fetch(`${API_BASE}/api/blogs`);
  const blogs = await parseResponse(response);
  return Array.isArray(blogs)
    ? blogs.map((post: any) => ({
        ...post,
        slug: post.slug || slugifyBlogTitle(post.title || ''),
      }))
    : [];
}

export async function createBlog(blog: Partial<BlogPost> & { content?: string }, token: string): Promise<any> {
  const payload = {
    ...blog,
    image_url: (blog as any).image_url || blog.image || '',
  };

  const response = await fetch(`${API_BASE}/api/blogs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
}

export async function updateBlog(id: number | string, blog: Partial<BlogPost> & { content?: string }, token: string): Promise<any> {
  const payload = {
    ...blog,
    image_url: (blog as any).image_url || blog.image || '',
  };

  const response = await fetch(`${API_BASE}/api/blogs/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
}

export async function deleteBlogPost(id: number | string, token: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api/blogs/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  await parseResponse(response);
}

export async function fetchGoogleReviews(): Promise<GoogleReview[]> {
  const response = await fetch(`${API_BASE}/api/google-reviews`);
  return parseResponse(response);
}

export async function createLead(lead: LeadEntry): Promise<LeadEntry> {
  const response = await fetch(`${API_BASE}/api/leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(lead),
  });
  return parseResponse(response);
}