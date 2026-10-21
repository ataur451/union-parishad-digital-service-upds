# Technical Design Document (TDD)
## Union Parishad Digital Service (UPDS)

> **Google Doc Reference:** [CSE309 TDD Document](https://docs.google.com/document/d/1ysee_Tvyu_UG8mTb1T4QVnNCEyQ4Sn58DRVPOFqCpJY/edit?usp=sharing)

**Project Name:** Union Parishad Digital Service (UPDS)  
**Frontend:** React (TypeScript)  
**Backend:** FastAPI (Python)  
**Database:** Supabase PostgreSQL / SQLite  

---

## 1. Introduction

This document explains the technical structure of the UPDS project. It shows how the frontend, backend, and database connect to each other. Features are divided into two releases: **[MVP]** (Mid-Term) and **[Beta]** (Final).

---

## 2. Tech Stack

- **Frontend:** React with TypeScript & Vite (for the user interface).
- **Backend:** FastAPI with Python (for handling REST APIs and business logic).
- **Database:** Supabase PostgreSQL (cloud production) / SQLite (local fallback).
- **Deployment:** Vercel (Unified Serverless Deployment).

---

## 3. Architecture

The Union Parishad Digital Service (UPDS) application follows a modern decoupled full-stack architecture hosted on Vercel:

[ Client Browser (React + TS) ]
│
▼  (HTTP / REST API Requests)
[ FastAPI Backend (Python) ]
│
▼  (Supabase Python Client / REST API)
[ Supabase PostgreSQL Database ]

1. **Frontend Layer:** Built using React, TypeScript, and Vite. Handles user inputs, UI component rendering, state management, and async API requests.
2. **Backend Layer:** Built using FastAPI (Python). Exposes RESTful API endpoints for CRUD operations, handles request data validation using Pydantic models, and manages CORS headers.
3. **Database Layer:** Supabase PostgreSQL hosting the `service_applications` table for secure, scalable persistence.

---

## 4. Project Structure

union-parishad-digital-service-upds/
├── docs/             # PRD, SRS, and TDD documents
├── frontend/         # React + TypeScript app
├── backend/          # FastAPI app
├── vercel.json       # Vercel deployment routing configuration
└── README.md 

---

## 5. Main API Endpoints

### Core Features (MVP)

| Method | Endpoint | Description | Scope |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/applications/` | Submit a new service application | `[MVP]` |
| `GET` | `/api/applications/` | Get all submitted applications list | `[MVP]` |
| `GET` | `/api/applications/{app_id}` | View specific application details | `[MVP]` |
| `PUT` | `/api/applications/{app_id}` | Update application details or status | `[MVP]` |
| `DELETE` | `/api/applications/{app_id}` | Delete an application | `[MVP]` |

### Advanced Features (Beta)

| Method | Endpoint | Description | Scope |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register a new user | `[Beta]` |
| `POST` | `/api/auth/login` | Login and get JWT token | `[Beta]` |
| `GET` | `/api/certificates/verify/{code}` | Verify digital certificates | `[Beta]` |

---

## 6. Database Schema & Tables

### `service_applications` Table (MVP)
Stores submitted application forms and status:
- `id`: `uuid` (Primary Key, default `gen_random_uuid()`)
- `created_at`: `timestamptz` (Timestamp, default `now()`)
- `applicant_name`: `text` (Required)
- `nid_number`: `text` (Required)
- `service_type`: `text` (Required)
- `status`: `text` (Default `'Pending'`)

### Other Tables (MVP / Beta)
- `users`: Stores user accounts, roles (Citizen, Official, Admin), and passwords `[Beta]`.
- `services`: Stores UP service names, descriptions, and fees `[MVP]`.
- `documents`: Stores uploaded file references `[MVP]`.

---

## 7. Deployment & Configuration

### Deployment Platform: Vercel
The application is deployed using Vercel's unified infrastructure:
- Root configuration is managed through `vercel.json`.
- Requests targeting `/api/*` are dynamically routed to the FastAPI Python backend serverless runtime.
- Static frontend assets (React SPA) are served directly via Vercel Edge Network.

### Environment & Database Credentials
- **API Integration:**
  - Supabase project credentials (`SUPABASE_URL` and `SUPABASE_KEY`) are integrated within the backend configurations using `create_client` from the `supabase` Python package