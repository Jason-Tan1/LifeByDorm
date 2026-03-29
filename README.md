<div align="center">

# LifeByDorm

**Your Guide to Canadian University Housing**

</div>

---

## About The Project

**LifeByDorm** helps Canadian students find their ideal university dorm through authentic peer reviews and comprehensive listings. Students can search schools, compare dorms by ratings and reviews, and share their own experiences to help future residents make informed housing decisions.

Finding the right dorm can be overwhelming. LifeByDorm bridges the gap by providing real student reviews, detailed ratings across multiple categories (room quality, bathrooms, building, amenities, location), and a streamlined interface to explore housing options at universities across Canada.

## Key Features

- **University Search** – Quickly find any Canadian university and explore their residence options
- **Detailed Ratings** – Reviews cover room quality, bathrooms, building condition, amenities, and location
- **Student Reviews** – Read authentic experiences from students who lived in the dorms
- **Photo Uploads** – See real photos of dorm rooms uploaded by reviewers
- **University Profiles** – View university stats including founding year, student population, and acceptance rate
- **Dorm Listings** – Browse all available residences with descriptions, amenities, and room types
- **Admin Dashboard** – Moderation tools for managing reviews and content

## Built With
### Frontend

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![Material UI](https://img.shields.io/badge/Material--UI-0081CB?style=for-the-badge&logo=mui&logoColor=white)
![i18next](https://img.shields.io/badge/i18next-26A69A?style=for-the-badge&logo=i18next&logoColor=white)

### Backend & Services

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![Serverless](https://img.shields.io/badge/Serverless-FD5750?style=for-the-badge&logo=serverless&logoColor=white)
![AWS S3](https://img.shields.io/badge/Amazon_S3-569A31?style=for-the-badge&logo=amazons3&logoColor=white)
![Zod](https://img.shields.io/badge/Zod-3068B7?style=for-the-badge&logo=zod&logoColor=white)
![Nodemailer](https://img.shields.io/badge/Nodemailer-18A8D8?style=for-the-badge&logo=nodemailer&logoColor=white)

### Database

![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)

### Authentication & Security

![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
![Google OAuth](https://img.shields.io/badge/Google_OAuth_2.0-4285F4?style=for-the-badge&logo=google&logoColor=white)
![AWS IAM](https://img.shields.io/badge/AWS_IAM-232F3E?style=for-the-badge&logo=amazonwebservices&logoColor=white)

### Deployment & Infrastructure

![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![AWS App Runner](https://img.shields.io/badge/AWS_App_Runner-232F3E?style=for-the-badge&logo=amazonwebservices&logoColor=white)

### Testing

![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)

## Getting Started

The application workspace lives under `my-app/`.

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/YourUsername/LifeByDorm.git
   cd LifeByDorm
   ```

2. **Install dependencies**
   
   Frontend:
   ```bash
   cd my-app/client
   npm install
   ```
   
   Backend:
   ```bash
   cd my-app/server
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the server directory:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   ACCESS_TOKEN_SECRET=your_jwt_secret
   ADMIN_EMAILS=admin@example.com
   ```

4. **Start the development servers**
   
   Frontend:
   ```bash
   cd my-app/client
   npm run dev
   ```
   
   Backend:
   ```bash
   cd my-app/server
   npm run devStart
   ```

### Docker Setup

If you prefer Docker:

```bash
cd my-app
docker-compose -f docker/docker-compose.yml up --build
```

Development Docker setup:

```bash
cd my-app
docker-compose -f docker/docker-compose.dev.yml up --build
```

### Project Structure

```text
LifeByDorm/
├── README.md               # Repository documentation
├── my-app/
│   ├── client/             # Frontend React application
│   │   ├── src/            # Frontend source code
│   │   ├── public/         # Static assets
│   │   └── vite.config.ts  # Vite development/build config
│   ├── server/             # Backend Express API
│   │   ├── src/            # Server source code
│   │   ├── seed/           # Database seed scripts
│   │   └── serverless.yml  # AWS Lambda/serverless config
│   ├── docker/             # Docker-related files
│   ├── api/                # Serverless entrypoints
│   └── vercel.json         # Vercel configuration
└── api.txt                 # Owner-provided deployment/env reference
```

### Docker Commands

| Command | Description |
|---------|-------------|
| `cd my-app && docker-compose -f docker/docker-compose.yml up --build` | Build and start production containers |
| `cd my-app && docker-compose -f docker/docker-compose.yml up -d` | Start containers in detached mode |
| `cd my-app && docker-compose -f docker/docker-compose.yml down` | Stop and remove containers |
| `cd my-app && docker-compose -f docker/docker-compose.yml down -v` | Stop and remove containers and volumes |
| `cd my-app && docker-compose -f docker/docker-compose.yml logs -f app` | View application logs |
| `cd my-app && docker-compose -f docker/docker-compose.yml --profile seed up seeder` | Seed the database |
| `cd my-app && docker-compose -f docker/docker-compose.dev.yml up --build` | Start the development Docker environment |

### Environment Variables

Backend variables used by `my-app/server/.env`:

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | Yes |
| `ACCESS_TOKEN_SECRET` | JWT signing secret | Yes |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | No |
| `ADMIN_EMAILS` | Comma-separated admin emails | No |
| `FRONTEND_URL` | Allowed frontend origin for CORS | No |
| `EMAIL_USER` | Email sender account | No |
| `EMAIL_PASS` | Email sender password/app password | No |
| `AWS_BUCKET_NAME` | S3 bucket for images | No |
| `AWS_REGION` | AWS region | No |
| `AWS_ACCESS_KEY_ID` | AWS access key | No |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | No |

Frontend variables used by `my-app/client/.env`:

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_BASE` | Browser API base URL for non-local environments | No |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID for the frontend | No |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps key used on dorm pages | No |

### Testing

Frontend:

```bash
cd my-app/client
npm test
```

Backend:

```bash
cd my-app/server
npm test
```

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/auth/google` | POST | Google authentication |
| `/auth/send-code` | POST | Send email verification code |
| `/auth/verify-code` | POST | Verify email code and create session |
| `/api/universities` | GET | List all universities |
| `/api/universities/:slug` | GET | Fetch one university |
| `/api/universities/:slug/dorms` | GET | List dorms for a university |
| `/api/reviews` | GET/POST | Fetch or submit reviews |

## Usage

1. **Search Universities** – Use the search bar to find Canadian universities
2. **Browse Dorms** – Click on a university to see all available residences
3. **Read Reviews** – View detailed reviews and ratings from current and former residents 
4. **Write a Review** – Share your own dorm experience by rating categories and adding comments
5. **Upload Photos** – Add photos to your review to help future students

## License

Distributed under the MIT License. See `LICENSE` for more information.
