# Software Requirements Specification (SRS)
## Union Parishad Digital Service (UPDS)

> **Google Doc Reference:** [CSE309 SRS Document](https://docs.google.com/document/d/1FyNK4HVyV-GYl0VLCB9BlWqFk0n68r-PU3qZwgwTExM/edit?usp=sharing)

**Project Name:** Union Parishad Digital Service (UPDS)  
**Document Type:** SRS (Software Requirements Specification)  
**Version:** 1.0  

---

## 1. Introduction

### 1.1 Purpose
This Software Requirements Specification (SRS) document details the functional and non-functional requirements for the Union Parishad Digital Service (UPDS) web application. It serves as a guide for developers, testers, and stakeholders to understand system features, user interactions, and technical boundaries across MVP and Beta release cycles.

### 1.2 Scope
UPDS is a digital platform designed to bridge the communication gap between citizens and local Union Parishad offices in Bangladesh. The system digitizes service applications, tracking, and certificate issuance while providing role-based administration tools.

---

## 2. Overall Description

### 2.1 Product Perspective
UPDS is built on a modern decoupled architecture:
- **Frontend:** React with TypeScript and Vite.
- **Backend:** FastAPI (Python) RESTful API.
- **Database:** Supabase PostgreSQL (Production / Cloud) / SQLite.

### 2.2 Operating Environment
- Accessible via modern web browsers (Chrome, Firefox, Edge, Safari).
- Responsive design optimized for desktop, tablet, and mobile displays.

---

## 3. System Features & Functional Requirements

### 3.1 User Management & Authentication
- **FR-01 [Beta]:** The system shall allow new users to register by providing necessary personal details and credentials.
- **FR-02 [Beta]:** Registered users must be able to securely log in using JWT (JSON Web Tokens) authentication.
- **FR-03 [Beta]:** The system shall enforce Role-Based Access Control (RBAC) supporting three primary roles: `Citizen`, `UP Official`, and `Administrator`.

### 3.2 Service Application Management
- **FR-04 [MVP]:** The system shall display a public directory of available Union Parishad services (e.g., Citizenship Certificate, Character Certificate).
- **FR-05 [MVP]:** Authenticated citizens shall be able to fill out and submit online application forms for desired services.
- **FR-06 [MVP]:** Citizens must be able to upload mandatory supporting files/documents during the application process.
- **FR-07 [MVP]:** The backend shall provide RESTful API endpoints (`GET`, `POST`, `PUT`, `DELETE`) for managing application records.

### 3.3 Application Review & Processing (UP Official)
- **FR-08 [MVP]:** UP Officials shall be able to view all incoming applications submitted by citizens.
- **FR-09 [MVP]:** Officials must be able to review application details and attached documents.
- **FR-10 [MVP]:** Officials can update application status to `Approved`, `Rejected`, or `Pending` with appropriate remarks.

### 3.4 Tracking & Digital Certificates
- **FR-11 [MVP]:** The system shall generate a unique tracking reference number for each submitted application.
- **FR-12 [MVP]:** Citizens can check the real-time status of their applications using their dashboard or tracking ID.
- **FR-13 [Beta]:** Approved applications shall generate a digital certificate featuring a verification reference/QR code.

### 3.5 Notice Board & System Management
- **FR-14 [Beta]:** Administrators shall be able to publish, edit, or remove official notices and announcements.
- **FR-15 [Beta]:** Administrators shall have access to an admin panel for managing user accounts, roles, and system configurations.

---

## 4. Use Cases

### Use Case 1: Submit Service Application
* **Actor:** Citizen
* **Precondition:** User is on the UPDS web portal application form section.
* **Main Success Scenario:**
  1. User fills in `Applicant Name`, `NID Number`, and selects `Service Type`.
  2. User clicks the "Submit Application" button.
  3. System sends a `POST` request to `/api/applications/`.
  4. Backend validates input and saves data into Supabase PostgreSQL.
  5. System shows a success message and updates the application table view.

---

### Use Case 2: View Application List
* **Actor:** Citizen / Admin
* **Precondition:** Application portal is loaded.
* **Main Success Scenario:**
  1. Page triggers a `GET` request to `/api/applications/`.
  2. Backend fetches all rows sorted by `created_at` in descending order from Supabase.
  3. System renders the list in a formatted responsive table.

---

### Use Case 3: Update Application & Status
* **Actor:** Citizen / Admin
* **Precondition:** Existing application selected for editing.
* **Main Success Scenario:**
  1. User clicks the "Edit" button on a specific table row.
  2. Form populates with current application data and allows status change (Pending/Approved/Rejected).
  3. User clicks "Update Application".
  4. System sends a `PUT` request to `/api/applications/{app_id}`.
  5. Database record is updated and table view refreshes automatically.

---

### Use Case 4: Delete Application
* **Actor:** Citizen / Admin
* **Precondition:** Target application exists in the system.
* **Main Success Scenario:**
  1. User clicks the "Delete" button for an item.
  2. User confirms deletion in the browser prompt.
  3. System issues a `DELETE` request to `/api/applications/{app_id}`.
  4. Record is permanently removed from the Supabase table.

---

## 5. Non-Functional Requirements

### 5.1 Performance & Scalability
- **NFR-01:** Core API endpoints must respond within 500ms under standard operational loads.
- **NFR-02:** The application must support concurrent user sessions without performance degradation.

### 5.2 Security
- **NFR-03 [Beta]:** User passwords must be securely hashed using modern cryptographic algorithms (e.g., bcrypt) before saving to the database.
- **NFR-04 [Beta]:** Protected API routes must validate incoming Bearer tokens and verify user authorization scopes.
- **NFR-05:** Input validation must be implemented on both frontend and backend to prevent common vulnerabilities (e.g., SQL Injection, XSS).

### 5.3 Usability & Reliability
- **NFR-06:** The user interface must be intuitive, clean, and fully responsive across mobile and desktop viewports.
- **NFR-07:** System data transactions must ensure consistency, preventing partial or corrupt database writes.