
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

### 2. Windows Local Development

Create the repository-root virtual environment and install the backend dependencies:
```powershell
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
```

Start the backend in one PowerShell terminal. The local SQLite URL overrides any `DATABASE_URL` in `backend\.env`, so local development does not write to a configured remote database:

```powershell
cd backend
$env:DATABASE_URL = "sqlite:///./upds_local.db"
..\.venv\Scripts\python.exe seed_demo.py
..\.venv\Scripts\python.exe -m uvicorn main:app --reload --host 127.0.0.1 --port 8001
```

Start the frontend in a second PowerShell terminal:

```powershell
cd frontend
$env:VITE_API_PROXY_TARGET = "http://127.0.0.1:8001"
npm.cmd ci
npm.cmd run dev
```

Open the local URL printed by Vite. The demo accounts are `admin@example.com` and `citizen@example.com`; both use password `Demo@12345`. The API docs are available at `http://127.0.0.1:8001/docs`.

The proxy defaults to port 8000; `VITE_API_PROXY_TARGET` lets you use another backend port when 8000 is occupied.

## 🔗 API Documentation

After starting the backend, access the interactive API documentation:

```text
http://127.0.0.1:8001/docs
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
