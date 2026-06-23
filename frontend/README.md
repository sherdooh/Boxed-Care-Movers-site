# Boxed With Care Movers Frontend

This is the Vite + React frontend for the Boxed With Care Movers website. It consumes the backend API for site content, blog posts, leads, login, and uploads.

## Run locally

Install dependencies:

```bash
npm install
```

Start the frontend dev server:

```bash
npm run dev
```

The frontend reads the API base from `VITE_API_URL` in `.env`. By default this repo points to the local backend at `http://localhost:5000`.

## Build

```bash
npm run build
```

## Notes

- Homepage content is loaded from `GET /api/content`.
- Blog posts come from `blog_posts` through the backend API.
- Admin image uploads go through `POST /api/upload`.
