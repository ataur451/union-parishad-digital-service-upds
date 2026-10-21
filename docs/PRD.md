# Product Requirements Document (PRD)
## Union Parishad Digital Service (UPDS)

> **Google Doc Reference:** [CSE309 PRD Document](https://docs.google.com/document/d/1ka4Y515vYRlOdgLJsyHXhL2ty1ebQQWvJAwnvDlDFSE/edit?usp=sharing)

**Project Name:** Union Parishad Digital Service (UPDS)  
**Product Type:** Web Application  
**Version:** 1.0  

---

## 1. Introduction

### 1.1 Purpose
The purpose of UPDS is to make Union Parishad services easier and more accessible for people in rural areas of Bangladesh. Citizens often need to visit the Union Parishad office several times to apply for certificates or collect information. UPDS will help reduce this problem by providing these services through an online platform.

Citizens will be able to apply for certificates, track their applications, check notices, and verify issued certificates. Union Parishad officials will be able to review applications and manage services from their dashboard.

### 1.2 Problem Statement
Many citizens face difficulties when using traditional Union Parishad services. They may need to travel long distances, wait in queues, or visit the office multiple times to complete an application. It can also be difficult to know the application status, required documents, and service fees.

UPDS will provide a single platform where citizens can find available services, submit applications, and track their progress. It will also help officials manage applications and citizen records more efficiently.

---

## 2. Product Goals
- Make Union Parishad services available online.
- Reduce unnecessary visits to the Union Parishad office.
- Make certificate applications easier.
- Allow citizens to track their applications.
- Help officials manage applications efficiently.
- Provide clear information about service requirements and fees.
- Make certificate verification easier and more reliable.

---

## 3. Target Users

### 3.1 Citizens
- Create an account and log in.
- View available services.
- Apply for certificates.
- Upload required documents.
- Track application status.
- Download approved certificates.
- Read notices and verify certificates.

### 3.2 Union Parishad Officials
- View submitted applications.
- Review citizen information and documents.
- Approve or reject applications.
- Request corrections when information is incomplete.
- Issue certificates after approval.
- Manage relevant service records.

### 3.3 Administrator
- Manage user accounts and roles.
- Manage available services.
- Manage Union Parishad information.
- Publish notices.
- Monitor applications and system activities.

---

## 4. Product Scope

### 4.1 In Scope & Release Plan

#### Release 1: MVP (Mid-Term Demo)
Focuses on core service applications and basic application management running locally via REST APIs.
- **[MVP] Service Directory:** View available services, required information, and fees.
- **[MVP] Online Certificate Applications:** Citizens fill out forms and submit requests (e.g., Citizenship Certificate, Character Certificate).
- **[MVP] Document Upload:** Upload necessary identification documents.
- **[MVP] Application Management (CRUD):** Officials view, review, approve, reject, or request corrections on applications.
- **[MVP] Application Tracking:** Tracking application status using a unique tracking number.

#### Release 2: Beta (Final Demo)
Focuses on security, user authentication, role-based controls, and cloud deployment.
- **[Beta] User Authentication:** User registration and login using JWT.
- **[Beta] Citizen Dashboard:** Personal dashboard to track application history and download issued certificates.
- **[Beta] Role-Based Access Control (RBAC):** Access control for Citizens, UP Officials, and System Administrators.
- **[Beta] Certificate Verification:** Verify issued certificates via unique verification reference or QR code.
- **[Beta] Notice Board & Announcements:** Publish and manage UP notices.
- **[Beta] Holding Tax & Trade License Modules:** View tax information and request trade license renewals.
- **[Beta] Admin Management:** Manage users, roles, services, and system logs.
- **[Beta] Cloud Deployment:** Frontend deployed on Vercel and backend hosted on cloud service.

### 4.2 Out of Scope
- Direct integration with national birth and death registration systems.
- Real-time mobile banking and online payment gateway integration.
- Direct integration with external government databases.
- Native Android/iOS mobile application.

---

## 5. Main Features
- **5.1 User Registration & Login [Beta]:** Account creation and JWT-based authentication for Citizens, Officials, and Admins.
- **5.2 Citizen Dashboard [MVP / Beta]:** View available services, application history, and notices.
- **5.3 Certificate Application [MVP]:** Online form submission for Citizenship, Character, Family, Warishan, Permanent Resident, and Financial Insolvency Certificates.
- **5.4 Application Tracking [MVP]:** Real-time status updates (Submitted, Under Review, Correction Required, Approved, Rejected, Certificate Issued).
- **5.5 Application Management [MVP]:** Officer review workflow for approving/rejecting or requesting corrections.
- **5.6 Digital Certificate & Verification [Beta]:** Issuance of digital certificates with QR code verification.
- **5.7 Holding Tax & Trade License [Beta]:** Information lookup for holding taxes and trade license applications.
- **5.8 Notice & Announcements [Beta]:** Public notice publishing system.
- **5.9 Admin Dashboard [Beta]:** System-wide user and service management.

---

## 6. User Roles and Permissions

| Role | Permissions | Scope |
| :--- | :--- | :--- |
| **Citizen** | Apply for services, upload documents, track status, download certificates | `[MVP / Beta]` |
| **UP Official** | Review applications, verify documents, request corrections, approve/reject, issue certificates | `[MVP / Beta]` |
| **Administrator** | Manage users, roles, services, notices, and view system reports | `[Beta]` |

---

## 7. Non-Functional Requirements
- **7.1 Security [Beta]:** Secure password hashing and Role-Based Access Control (RBAC) via Bearer Tokens.
- **7.2 Usability:** Responsive UI built with React & TypeScript, supporting Bangla language.
- **7.3 Performance:** API response time under 500ms for core endpoints.
- **7.4 Reliability:** Strict input validation and transactional application status updates.

---

## 8. User Stories

### 8.1 Citizen (End User)
1. **Submit Application:** As a citizen, I want to submit a service application with my name, NID number, and service type online so that I do not need to visit the Union Parishad office physically.
2. **View Applications:** As a citizen, I want to view a list of submitted service applications so that I can track their current status.
3. **Update Information:** As a citizen, I want to update my submitted application details so that I can correct any mistakes before processing.
4. **Cancel/Delete Application:** As a citizen, I want to delete my application if I no longer require the service.

### 8.2 Union Parishad Admin / Official
1. **Review Applications:** As an admin, I want to view all citizen service applications in an organized table so that I can process them efficiently.
2. **Change Application Status:** As an admin, I want to update the status of an application to "Approved", "Pending", or "Rejected" so that citizens know the decision.

---

## 9. Success Criteria
- Citizens can register, log in, and submit certificate applications.
- System generates a unique tracking number for each application.
- Officials can review applications and update status via REST API.
- Certificates can be downloaded and verified.
- Access controls prevent unauthorized user actions.