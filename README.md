# 🍛 KSN Aahaar

An authentic Indian food ordering platform featuring traditional South Indian sweets, snacks, biriyanis, curries, and catering services.

## 📁 Project Structure

```
KSN_Aahaar/
├── frontend/          # Next.js 15 App Router Frontend (TypeScript, Tailwind CSS)
└── backend/           # Node.js + Express Backend (TypeScript, MongoDB, Razorpay)
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or later)
- MongoDB running locally or MongoDB Atlas connection string
- npm / yarn / pnpm

---

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create your `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
4. Start the backend server:
   ```bash
   npm run dev
   ```
   Backend runs on `http://localhost:5000`.

---

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛠 Tech Stack

- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS, Lucide Icons
- **Backend:** Node.js, Express, TypeScript, Mongoose (MongoDB)
- **Payments:** Razorpay Integration
- **Notifications:** WhatsApp Order Alert Integration
