# PlanPulse — Project & Task Workspace Management (Jira-Inspired)

An enterprise-grade, full-stack **MERN (MongoDB, Express.js, React 18, Node.js)** project and workspace management application equipped with role-based access control, interactive Kanban boards, and 4 explainable decision-support algorithms.

---

## 🛠️ Architecture Stack

- **Frontend**: React 18, Vite, React Router 6, Axios, Lucide React, Recharts, Vanilla CSS Design System.
- **Backend**: Node.js v24, Express.js, Mongoose ODM, JWT Authentication, Bcryptjs.
- **Database**: MongoDB (Multi-tenant workspace schema).

---

## 🧠 Core Novelty Features (Explainable Decision Support)

1. **Smart Task Prioritization**: Rule-based scoring engine calculating transparent scores (0-100) based on priority, deadline urgency, task age, and downstream dependency impact.
2. **Team Workload Balancing & Smart Assignee Recommender**: Nominal 40-hour capacity tracking, overload detection (>85%), and optimal assignee matching.
3. **Project Risk Detection**: Multi-variable health evaluator categorizing projects as LOW, MEDIUM, or HIGH RISK with actionable root causes.
4. **Dependency-Aware Bottleneck Recommendations**: Directed Acyclic Graph (DAG) validation, cycle prevention, and critical path bottleneck alerts.

---

## 🚀 Quick Start (Development)

### 1. Install Dependencies
```bash
npm run install:all
```

### 2. Start Backend Server
```bash
npm run dev:backend
```
Backend runs at `http://localhost:5000` (Health Check: `http://localhost:5000/api/health`).

### 3. Start Frontend Dev Server
```bash
npm run dev:frontend
```
Frontend runs at `http://localhost:5173` with reverse proxy to backend.
