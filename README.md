# Keisha WriteNow Allen

A Next.js website and private CMS for books, news, events, media, contact inquiries, newsletter subscribers, and image galleries.

## Development

```bash
npm install
npm run dev
```

The public site runs at `http://localhost:3000` and the CMS at `http://localhost:3000/admin`.

## MongoDB

Add your MongoDB Atlas connection to `.env.local`:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.example.mongodb.net/?retryWrites=true&w=majority
MONGODB_DATABASE=keisha_writenow
```

Restart the server and migrate the existing local content:

```bash
npm run db:migrate
```

MongoDB collections:

- `site_content` — global settings and public content
- `contact_inquiries` — contact form submissions
- `newsletter_subscribers` — newsletter signups
- `media_uploads.files` and `media_uploads.chunks` — GridFS images

Without `MONGODB_URI`, development automatically uses the JSON files in `data/` and image files in `public/uploads/`. The dashboard overview shows the active storage mode.

## Verification

```bash
npm run lint
npx tsc --noEmit
```
