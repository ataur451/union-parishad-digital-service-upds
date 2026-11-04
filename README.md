
# Union Parishad Digital Service (UPDS)

A web-based digital platform designed to simplify and modernize Union Parishad services in Bangladesh.

## 📌 Project Overview

Union Parishad Digital Service (UPDS) aims to make local government services more accessible, organized, and efficient through a digital platform.

The system allows citizens to submit service applications online and helps manage application information digitally.

## 🎯 Objectives

- Digitalize traditional Union Parishad services.
- Reduce paperwork and manual processes.
- Make citizen service applications easier to manage.
- Improve transparency and efficiency.
- Provide a user-friendly digital service platform.

## ✨ Features

- Submit service applications.
- View submitted applications.
- Update application information.
- Delete applications.
- Track application status.
- Manage application records.

## 🛠️ Technologies Used

### Frontend
- React
- TypeScript
- Vite
- CSS

### Backend
- Python
- FastAPI
- SQLite
- Pydantic

### Development Tools
- Git & GitHub
- GitHub Codespaces
- VS Code

## 📁 Project Structure

```text
union-parishad-digital-service-upds/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── layouts/
│   │   ├── services/
│   │   ├── types/
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
│
├── backend/
│   ├── routers/
│   │   ├── __init__.py
│   │   └── applications.py
│   ├── main.py
│   ├── database.py
│   ├── models.py
│   ├── schemas.py
│   └── requirements.txt
│
└── README.md
```

## ⚙️ Installation and Setup

### 1. Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd union-parishad-digital-service-upds
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### 3. Backend Setup

Open another terminal:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Start the backend server:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## 🔗 API Documentation

After starting the backend, access the interactive API documentation:

```text
http://localhost:8000/docs
```

### Application API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/applications/` | Create an application |
| GET | `/applications/` | Get all applications |
| GET | `/applications/{id}` | Get a single application |
| PUT | `/applications/{id}` | Update an application |
| DELETE | `/applications/{id}` | Delete an application |

## 🗄️ Database

The project uses SQLite to store application information.

Each application contains:

- Application ID
- Applicant Name
- NID Number
- Service Type
- Application Status

## 🚀 Future Improvements

- User authentication and authorization.
- Citizen registration and login.
- Online application status tracking.
- Admin dashboard.
- Application approval and rejection system.
- PDF certificate generation.
- Notifications for application updates.

## 👨‍💻 Developer

Developed as an academic project.

## 📄 License

This project is developed for educational purposes.
