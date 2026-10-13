***Technical Design Document (TDD)***

***Union Parishad Digital Service (UPDS)***



> \*\*Google Doc Reference:\*\* \[CSE309 TDD Document](https://docs.google.com/document/d/1ysee\_Tvyu\_UG8mTb1T4QVnNCEyQ4Sn58DRVPOFqCpJY/edit?usp=sharing)



\*\*Project Name:\*\* Union Parishad Digital Service (UPDS)  

\*\*Frontend:\*\* React (TypeScript)  

\*\*Backend:\*\* FastAPI (Python)  

\*\*Database:\*\* SQLite / PostgreSQL  



\---



***1. Introduction***

This document explains the technical structure of the UPDS project. It shows how the frontend, backend, and database connect to each other. Features are divided into two releases: \*\*\[MVP]\*\* (Mid-Term) and \*\*\[Beta]\*\* (Final).



\---



***2. Tech Stack***

\- \*\*Frontend:\*\* React with TypeScript (for the user interface).

\- \*\*Backend:\*\* FastAPI with Python (for handling APIs and business logic).

\- \*\*Database:\*\* SQLite (local development) / PostgreSQL (production).



\---



***3. Project Structure***



union-parishad-digital-service-upds/

├── docs/             # PRD, SRS, and TDD documents

├── frontend/         # React + TypeScript app

├── backend/          # FastAPI app

└── README.md



***4. Main API Endpoints***

***Core Features (MVP)***



Method	Endpoint	Description	Scope

GET	/api/services	View available services	\[MVP]

POST	/api/applications	Submit a service application	\[MVP]

GET	/api/applications/my	View user's submitted applications	\[MVP]

GET	/api/official/applications	View applications (for UP Officers)	\[MVP]

PATCH	/api/applications/{id}/status	Update status (Approve/Reject)	\[MVP]



Method,Endpoint,Description,Scope



POST,/api/auth/register,Register a new user,\[Beta]

POST,/api/auth/login,Login and get JWT token,\[Beta]

GET,/api/certificates/verify/{code},Verify digital certificates,\[Beta]



***5. Database Tables***

users: Stores user accounts, roles (Citizen, Official, Admin), and passwords \[Beta].



services: Stores UP service names, descriptions, and fees \[MVP].



applications: Stores submitted application forms and status \[MVP].



documents: Stores uploaded file references \[MVP].

