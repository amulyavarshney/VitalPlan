# VitalPlan - AI-Powered Diet Guide

A comprehensive web application that provides personalized diet plans, AI-powered food scanning, and nutrition tracking.

## Architecture

### Frontend (React + TypeScript)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **PWA**: Progressive Web App with offline capabilities
- **State Management**: React hooks and context
- **UI Components**: Custom components with Lucide React icons

### Backend (Python FastAPI)
- **Framework**: FastAPI with Python 3.11+
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Authentication**: JWT tokens with bcrypt password hashing
- **AI Integration**: Azure OpenAI for diet plan generation and food analysis
- **Image Processing**: PIL/Pillow for food image analysis
- **API Documentation**: Auto-generated with Swagger/OpenAPI

## Features

### 🤖 AI-Powered Features
- **Personalized Diet Plans**: AI generates custom meal plans based on user goals
- **Food Image Analysis**: Computer vision analyzes food photos for nutrition info
- **Smart Recommendations**: AI suggests supplements and foods based on user profile

### 📱 Mobile-First Design
- **Progressive Web App**: Installable on mobile devices
- **Responsive Design**: Optimized for all screen sizes
- **Touch-Friendly**: Gesture-based interactions
- **Offline Support**: Core features work without internet

### 🍎 Nutrition Tracking
- **Food Scanner**: Camera-based food recognition and analysis
- **Barcode Scanner**: Quick nutrition lookup via product barcodes
- **Nutrition Database**: Comprehensive food and supplement information
- **Meal Planning**: Detailed meal plans with recipes and shopping lists

### 🛒 Marketplace Integration
- **Supplement Store**: Curated selection of health products
- **Order Management**: Track purchases and delivery status
- **Vendor Integration**: Support for multiple suppliers (Amazon, Walmart, local stores)

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Python 3.11+
- PostgreSQL 13+
- Redis (optional, for caching)

### Backend Setup

1. **Clone and navigate to backend**:
   ```bash
   cd backend
   ```

2. **Create virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Set up database**:
   ```bash
   # Create PostgreSQL database
   createdb vitalplan
   
   # Run the application (tables will be created automatically)
   python -m app.main
   ```

6. **Start the API server**:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

### Frontend Setup

1. **Navigate to frontend**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your API URL
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```

### Docker Setup (Alternative)

1. **Start with Docker Compose**:
   ```bash
   cd backend
   docker-compose up -d
   ```

This will start:
- FastAPI backend on port 8000
- PostgreSQL database on port 5432
- Redis on port 6379

## API Documentation

Once the backend is running, visit:
- **Swagger UI**: http://localhost:8000/api/docs
- **ReDoc**: http://localhost:8000/api/redoc

## Key API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/token` - OAuth2 token endpoint

### User Management
- `GET /api/users/me` - Get current user profile
- `PUT /api/users/me` - Update user profile
- `DELETE /api/users/me` - Delete user account

### Goals & Diet Plans
- `GET /api/goals` - Get user goals
- `POST /api/goals` - Create new goal
- `POST /api/diet-plans/generate` - Generate AI diet plan
- `GET /api/diet-plans` - Get user's diet plans

### Food Scanner
- `POST /api/scanner/analyze-image` - Analyze food image
- `GET /api/scanner/history` - Get scan history
- `POST /api/scanner/barcode/{barcode}` - Scan barcode

### Marketplace & Orders
- `GET /api/marketplace/items` - Get marketplace items
- `POST /api/orders` - Create new order
- `GET /api/orders` - Get user orders

## Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql://user:password@localhost/vitalplan
REDIS_URL=redis://localhost:6379
SECRET_KEY=your-secret-key
AZURE_OPENAI_API_KEY=your-azure-openai-key
AZURE_OPENAI_ENDPOINT=your-azure-endpoint
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:8000/api
```

## Deployment

### Backend Deployment
1. Set up PostgreSQL database
2. Configure environment variables
3. Deploy using Docker or cloud platform
4. Run database migrations

### Frontend Deployment
1. Build the application: `npm run build`
2. Deploy to static hosting (Netlify, Vercel, etc.)
3. Configure environment variables for production API

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License.