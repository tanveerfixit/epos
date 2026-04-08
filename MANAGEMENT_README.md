# EPOS System Management & Architecture Guide

Welcome to the EPOS System documentation. This guide explains the core functional layout, multi-tenant data flow, registration processes, and how the system separates entities (Businesses, Branches, and Users).

---

## 1. System Architecture & Layout

The EPOS platform operates as a multi-tenant (SaaS) application. This means multiple distinct companies (Businesses) can use the same deployed application and database, completely isolated from one another.

### Core Entities:
- **Developer / Super Admin**: The ultimate system owner (e.g., `admin@icover.ie`, `tanveerfixit@gmail.com`). Has access to the **Developer Control Center** to oversee all businesses globally.
- **Businesses**: The highest tenant level. A business acts as a completely isolated bubble. Data from Business A can never be seen by Business B.
- **Branches**: Physical or logical store locations belonging to a Business. A Business can have one or many branches.
- **Users**: Employees configured with role-based access control (`staff`, `admin`, `superadmin`) who work at a specific Branch.

---

## 2. Data Flow & Security Isolation

To guarantee that tenants do not see each other's data, the entire database and API structure relies on **Strict Isolation Filters**.

1. **Database Schema**: Almost every major table (`customers`, `products`, `invoices`, `settings`, `smtp_settings`, `devices`) possesses a `business_id`. 
2. **Authentication Injection**: When a user logs in, the server generates a token mapped to their specific `business_id` and `branch_id`. 
3. **API Routing**: Every standard backend route (like `/api/products` or `/api/customers`) automatically enforces `WHERE business_id = ?` under the hood. No client-side request structure is trusted for multi-tenant isolation.
4. **Branch Level Filtering**: While products and customers are accessible across the entire Business, volatile entities like **Invoices** and **Inventory Quantities** (`branch_stock`) are strictly tracked per `branch_id`.

---

## 3. The Registration Pipeline

The journey of onboarded users involves a strict verification flow to maintain system integrity.

### A. Business Registration (New Tenant)
1. **Sign Up**: A prospective owner visits the portal and switches to "Register Business" mode. They input their Business Name, Initial Branch Name, and Admin Credentials.
2. **Inactive State**: By default, to prevent spam and unapproved usage, the system inserts the business into the database with an `inactive` status.
3. **The Developer Gate**: The user cannot immediately log in. They will see an error stating: *"Your business account is pending developer approval..."*
4. **Approval**: A developer logs in from their specialized account, opens the **Developer Control Center**, navigates to the **Business Hub**, reviews the tenant, and clicks "Approve". Only then is the business `active`.

### B. User / Staff Enrollment
1. **Sign Up**: A new employee visits the portal and stays in the standard "Join as Staff" mode. They select their localized branch from a provided lookup.
2. **Pending Approval**: Their account is immediately placed into a `pending` state with the `staff` role.
3. **Admin Verification**: The Business Owner (Admin) logs into the System Control Panel, reviews pending users for their business, and approves them. If a user loses their credentials, the Admin can use the portal to instantly generate and email them a fresh, sanitized password.

---

## 4. Branch Dynamics & Stock Management

A Business acts as an umbrella, but real-world operations occur at the Branch level.

- **Unified Catalog**: The core Product Catalog (Names, Categories, Global SKUs, Global Selling Prices) is shared across the Business so admins don't have to duplicate products per branch.
- **Localized Quantities**: The actual count of items exists inside `branch_stock`. A branch only ever interacts with its own stock limits. Branch A selling an item decreases stock only for Branch A.
- **Serialized Devices**: High-value items (like Mobile Phones) are heavily tracked via IMEI. Each individual device record belongs directly to the `branch_id` it currently physically sits in. 
- **Stock Transfers**: Staff can initiate a "Device Transfer" from one branch to another. This securely migrates the device record to the target `branch_id`.

---

## 5. User Roles and Capabilities

Access Control relies on rigid hierarchy constraints.

#### Staff
- Functions exclusively within their assigned `branch_id`.
- Permitted to construct invoices, parse local inventory, and check out customers.
- Cannot manipulate core system settings, email configurations, or approve new staff requests.

#### Admin (Business Owner)
- Has ubiquitous access to all locations nested under their `business_id`.
- Accessible Control Panel commands:
  - Add, approve, reject, or purge Staff on the tenant network.
  - Formulate new Branch Nodes.
  - Modify localized tenant variables (Receipt formatting, SMTP configurations, Registration security lockdowns like "Disable Staff Sign-in").

#### Developer / Super Admin
- Ultimate system override. 
- Equipped with the **Developer Control Center**.
- Can override `status` states for entirely top-level Businesses.
- Can view global metrics unfettered by tenant-level row isolation.
