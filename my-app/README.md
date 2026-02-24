# LifeByDorm

A comprehensive platform for students to discover, review, and compare university dormitories.

## Quick Start with Docker

The easiest way to run this project is with Docker. No need to install Node.js, MongoDB, or any dependencies locally!

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) (v20.10+)
- [Docker Compose](https://docs.docker.com/compose/install/) (v2.0+)

### One-Command Setup

```bash
# Clone the repository
git clone <repository-url>
cd LifeByDorm/my-app

# Copy the environment template and configure (optional - works with defaults)
cp .env.example .env

# Start the application
docker-compose up --build
```

The application will be available at: **http://localhost:3000**

### Seed the Database (Optional)

To populate the database with sample universities and dorms:

```bash
docker-compose --profile seed up seeder
```

### Development Mode with Hot-Reload

For development with live code reloading:

```bash
docker-compose -f docker-compose.dev.yml up --build
```

- Frontend (Vite): http://localhost:5173
- Backend API: http://localhost:3000

---

## Manual Setup (Without Docker)

If you prefer to run without Docker:

### Prerequisites

- Node.js 20+
- MongoDB 7.0+

### Installation

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### Environment Variables

Create a `.env` file in the `server/` directory:

```env
MONGODB_URI=mongodb://localhost:27017/lifebydorm
ACCESS_TOKEN_SECRET=your-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
ADMIN_EMAILS=admin@example.com
```

### Running

```bash
# Start MongoDB locally first

# Terminal 1: Start backend
cd server
npm run devStart

# Terminal 2: Start frontend
npm run dev
```

---

## Project Structure

```
my-app/
├── src/                    # Frontend React application
│   ├── admin/              # Admin dashboard components
│   ├── context/            # React context providers
│   ├── dorms/              # Dorm listing and review components
│   ├── footer/             # Footer components
│   ├── homepage/           # Homepage components
│   ├── NavBarPages/        # Navigation and auth components
│   └── UniversitiesPage/   # University dashboard
├── server/                 # Backend Express API
│   ├── models/             # Mongoose data models
│   ├── seed/               # Database seed scripts
│   └── server.tsx          # Main server file
├── docker-compose.yml      # Production Docker setup
├── docker-compose.dev.yml  # Development Docker setup
├── Dockerfile              # Multi-stage production build
└── Dockerfile.dev          # Development image
```

---

## Docker Commands Reference

| Command | Description |
|---------|-------------|
| `docker-compose up --build` | Build and start production containers |
| `docker-compose up -d` | Start in detached mode (background) |
| `docker-compose down` | Stop and remove containers |
| `docker-compose down -v` | Stop and remove containers + volumes (resets DB) |
| `docker-compose logs -f app` | View application logs |
| `docker-compose --profile seed up seeder` | Seed the database |
| `docker-compose -f docker-compose.dev.yml up` | Start development environment |

---

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGO_ROOT_USERNAME` | MongoDB admin username | Yes |
| `MONGO_ROOT_PASSWORD` | MongoDB admin password | Yes |
| `ACCESS_TOKEN_SECRET` | JWT signing secret | Yes |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | No |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth for frontend | No |
| `ADMIN_EMAILS` | Comma-separated admin emails | No |
| `AWS_ACCESS_KEY_ID` | AWS S3 access key | No |
| `AWS_SECRET_ACCESS_KEY` | AWS S3 secret key | No |
| `AWS_S3_BUCKET` | S3 bucket for images | No |

---

## Testing

```bash
# Run frontend tests
npm test

# Run backend tests
cd server
npm test
```

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/register` | POST | User registration |
| `/login` | POST | User login |
| `/api/universities` | GET | List all universities |
| `/api/dorms` | GET | List all dorms |
| `/api/reviews` | GET/POST | Manage reviews |

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Material-UI, i18next
- **Backend**: Express 5, TypeScript, Mongoose, Serverless Framework, AWS S3, Zod, Nodemailer
- **Database**: MongoDB 7
- **Authentication**: JWT, Google OAuth
- **Containerization**: Docker, Docker Compose

---

## License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.
