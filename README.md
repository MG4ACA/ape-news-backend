# APE News Backend

Backend API for APE News website built with Node.js, Express, and MySQL.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables:

```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Create MySQL database:

```sql
CREATE DATABASE ape_news;
```

4. Run migrations:

```bash
npm run migrate
```

5. (Optional) Seed database:

```bash
npm run seed
```

6. Start development server:

```bash
npm run dev
```

## API Endpoints

See PROJECT_STRUCTURE.md in the root directory for complete API documentation.

## Development

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run migrate` - Run database migrations
- `npm run seed` - Seed database with sample data

## Environment Variables

See `.env.example` for all required environment variables.
