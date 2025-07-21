# Inventory Management System

A modern, responsive inventory management web application built with Next.js 14, TypeScript, and Tailwind CSS.

## Features

### 🏠 Dashboard
- **Real-time Metrics**: Total items, inventory value, low stock alerts, and category counts
- **Interactive Charts**: Inventory value trends using Recharts
- **Low Stock Alerts**: Visual indicators for items needing restocking
- **Recent Activity**: Timeline of inventory changes and updates
- **Quick Actions**: Fast access to add new items, categories, locations, and users

### 📦 Inventory Management
- **Comprehensive Item Tracking**: SKU, name, description, pricing, and stock levels
- **Smart Filtering**: Filter by status, category, location, and low stock items
- **Advanced Search**: Real-time search across item names and SKUs
- **Sortable Columns**: Click to sort by any column (SKU, name, price, stock, etc.)
- **Stock Status Indicators**: Visual badges for in-stock, low stock, and out-of-stock items
- **Margin Calculations**: Automatic profit margin calculations

### 🎨 Modern UI/UX
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Collapsible Sidebar**: Space-efficient navigation with icons and labels
- **Clean Typography**: Professional appearance with consistent spacing
- **Loading States**: Smooth user experience with proper loading indicators
- **Error Boundaries**: Graceful error handling throughout the application

### 🏗️ Technical Architecture
- **Next.js 14 App Router**: Latest Next.js features with file-based routing
- **TypeScript**: Full type safety and better developer experience
- **Tailwind CSS**: Utility-first CSS framework for rapid styling
- **shadcn/ui Components**: High-quality, accessible UI components
- **React Hook Form**: Efficient form handling with validation
- **Recharts**: Beautiful, responsive charts and data visualizations
- **Lucide Icons**: Consistent, modern icon system

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── globals.css        # Global styles and Tailwind directives
│   ├── layout.tsx         # Root layout component
│   ├── page.tsx          # Dashboard home page
│   └── inventory/        # Inventory management pages
├── components/           # Reusable React components
│   ├── ui/              # Base UI components (shadcn/ui)
│   ├── layout/          # Layout components (Sidebar)
│   ├── dashboard/       # Dashboard-specific components
│   └── inventory/       # Inventory management components
├── lib/                 # Utility functions and types
│   ├── types.ts        # TypeScript interfaces
│   └── utils.ts        # Helper functions
└── public/             # Static assets
```

## Data Models

### Inventory Item
- **SKU**: Unique product identifier
- **Basic Info**: Name, description, category
- **Pricing**: Price, cost, calculated margin percentage
- **Stock**: Current stock, minimum level, status
- **Location**: Storage location assignment
- **Timestamps**: Created, updated, last modified dates

### Categories
- Organize products into logical groups
- Color-coded for visual identification
- Hierarchical structure support

### Locations
- Warehouse, store, and office locations
- Address and contact information
- Inventory distribution tracking

### Users
- Role-based access (Admin, Manager, Employee)
- Activity tracking and audit logs
- Profile management

## Key Features Implementation

### Dashboard Metrics
- **Total Inventory Value**: Real-time calculation of all inventory worth
- **Low Stock Monitoring**: Automatic alerts when items fall below minimum levels
- **Category Distribution**: Visual breakdown of inventory by category
- **Activity Timeline**: Recent changes and inventory movements

### Inventory Table
- **Advanced Filtering**: Multiple filter criteria with visual indicators
- **Real-time Search**: Instant results as you type
- **Sortable Columns**: Click any header to sort data
- **Responsive Design**: Adapts to different screen sizes
- **Bulk Actions**: Select multiple items for batch operations

### Stock Management
- **Automatic Calculations**: Margin percentages computed from price and cost
- **Visual Indicators**: Color-coded badges for stock status
- **Low Stock Alerts**: Prominent warnings for items needing attention
- **Stock Adjustments**: Easy inventory level modifications

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd inventory-management-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
npm start
```

## Future Enhancements

### Database Integration
- **Supabase Ready**: Component architecture prepared for Supabase integration
- **Real-time Updates**: Live data synchronization across users
- **Data Persistence**: Secure cloud storage for all inventory data

### Advanced Features
- **Barcode Scanning**: Mobile barcode scanning for quick item lookup
- **Reporting**: Detailed analytics and inventory reports
- **Multi-location**: Advanced multi-warehouse management
- **API Integration**: Connect with external systems and suppliers
- **Mobile App**: Native mobile application for on-the-go management

### Business Intelligence
- **Predictive Analytics**: AI-powered demand forecasting
- **Automated Reordering**: Smart restocking recommendations
- **Cost Analysis**: Detailed profitability and cost tracking
- **Supplier Management**: Vendor relationships and purchase orders

## Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Charts**: Recharts for data visualization
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React icon library
- **Development**: ESLint, TypeScript compiler

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please open an issue in the GitHub repository.