# DSD Resort Management System (Frontend)

Welcome to the frontend repository for the **DSD Resort Management System**. This application provides a comprehensive administrative interface for managing resort operations, including reservations, restaurant orders, kitchen operations, and guest feedback.

## 🚀 Technologies Used

- **Framework**: [React 19](https://react.dev/) with [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [Ant Design (antd)](https://ant.design/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
- **Routing**: [React Router DOM](https://reactrouter.com/)
- **Data Fetching & API**: [Axios](https://axios-http.com/) & [TanStack Query (React Query)](https://tanstack.com/query/latest)
- **Real-time Communication**: [@stomp/stompjs](https://stomp-js.github.io/) & SockJS
- **PDF Generation**: [jsPDF](https://artskydj.github.io/jsPDF/docs/jsPDF.html) & [html2canvas](https://html2canvas.hertzen.com/)

## 📂 Core Features & Modules

- **Dashboard**: High-level overview of resort operations and analytics.
- **Reservations & Rooms**: Seamlessly manage guest bookings, room availability, and assignments.
- **Restaurant Orders**: Point-of-Sale (POS) interface for capturing dining orders, generating receipts, and printing bills with embedded QR codes for guest feedback.
- **Kitchen Management (KDS)**:
  - **Chef Operations Desk**: Real-time Kanban board for kitchen staff to track and fulfill orders.
  - **AI Demand Forecasting**: Intelligently forecast dish demand and calculate Bill of Materials (BOM) against live inventory shortages.
- **Guest Feedback**: Dashboard for monitoring guest satisfaction, analyzing health scores, and viewing detailed reviews.
- **Billing & Reporting**: Generate detailed invoices for guest checkouts, aggregating room charges, meal plans, and restaurant orders into a single printable PDF.

## 🛠️ Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- `npm` or `yarn`

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   ```

3. **Build for production:**
   ```bash
   npm run build
   ```

4. **Preview production build:**
   ```bash
   npm run preview
   ```

## 🎨 UI/UX Highlights
- Fully responsive and modern design using Tailwind CSS.
- Custom stylized slim scrollbars for enhanced aesthetics.
- Dynamic PDF receipts that adapt to content height (perfect for receipt printers).
- Intuitive layouts optimized for resort staff (Admin, Receptionists, Head Chefs).

## 📜 License
*Proprietary software.*
