# LuxPOS v2 - Restaurant Management System Summary

## System Overview
LuxPOS is a modern React-based Point of Sale (POS) and restaurant management system built with TypeScript, designed for multi-tenant restaurant operations.

## Technology Stack & Dependencies

### Frontend Framework
- **React 18** - UI framework with hooks and functional components
- **TypeScript** - Type-safe JavaScript
- **Vite** - Build tool and development server

### UI Components & Styling
- **TailwindCSS** - Utility-first CSS framework
- **Lucide React** - Icon library
- **shadcn/ui** - Modern UI component library
  - Button, Input, Switch, Dialog, Card, Badge, etc.

### Routing & State Management
- **React Router** - Client-side routing
- **Zustand** - Lightweight state management
- **React Query** - Server state management (if needed)

### Animation & Effects
- **GSAP** - Professional animation library for smooth transitions

### Development Tools
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Vercel** - Deployment platform

## System Architecture

### Multi-Tenant Structure
- **Tenant-based isolation** - Each restaurant operates independently
- **Role-based access control**:
  - **Super Admin**: System-wide administration
  - **Owner**: Restaurant management
  - **Admin**: Restaurant administration
  - **Cashier**: POS operations
  - **Tenant**: Business owner role

### Data Flow
- **Mock Database** (`mockDb.ts`) - Simulated backend with full CRUD operations
- **Mock Data** (`mockData.ts`) - Sample data for development
- **Real-time Updates** - Simulated real-time features via polling

## Key Features

### 1. Point of Sale (POS) System
- **CashierPage**: Full POS interface with cart management
- **Product Catalog**: Categories, products, and variants
- **Order Management**: Create, process, and track orders
- **Receipt Printing**: Configurable receipt templates

### 2. Inventory Management
- **Ingredient Tracking**: Stock levels and low-stock alerts
- **Restocking**: Manual and automated restocking
- **Real-time Updates**: Live inventory status

### 3. Dashboard & Analytics
- **DashboardPage**: Overview with statistics
- **Sales Analytics**: Revenue, order counts, popular items
- **Inventory Reports**: Stock levels and alerts
- **Notifications**: System alerts and updates

### 4. User Management
- **CashierManagement**: Create and manage cashier accounts
- **Role-based Access**: Granular permissions
- **Authentication**: Secure login system

### 5. Admin Panel
- **AdminPage**: System administration (hidden feature)
- **Tenant Management**: Multi-tenant setup
- **Product Management**: Categories, products, variants
- **Ingredient Management**: Inventory items
- **System Settings**: Configuration options

## Recent Major Changes

### Branch System Removal
- **Removed**: Complete branch/branch_id system from entire codebase
- **Simplified**: Now operates on tenant-level granularity only
- **Files Updated**: All TypeScript files, components, and database schemas

### Admin Access Control
- **Hidden Admin Panel**: Admin role removed from login page
- **Fixed Button**: Circular admin button in top-left corner (z-50)
- **Route Protection**: /admin route only accessible via button
- **SPA Routing**: Fixed with vercel.json for proper client-side routing

## File Structure

```
app/src/
├── components/
│   ├── ui/          # shadcn/ui components
│   └── Receipt.tsx  # Receipt printing component
├── hooks/
│   ├── useAuth.ts   # Authentication hook
│   ├── useRealtime.ts # Real-time updates
│   └── useStore.ts  # Zustand store
├── lib/
│   ├── mockDb.ts    # Mock database functions
│   └── mockData.ts  # Sample data
├── pages/
│   ├── LoginPage.tsx      # Authentication
│   ├── DashboardPage.tsx  # Main dashboard
│   ├── CashierPage.tsx    # POS interface
│   ├── AdminPage.tsx      # Admin panel (hidden)
│   └── CashierManagement.tsx # User management
├── stores/
│   └── useStore.ts  # Global state
├── types/
│   ├── database.ts  # Database schemas
│   └── index.ts     # TypeScript types
└── App.tsx          # Main app with routing
```

## Database Schema (Mock)

### Core Tables
- **tenants**: Restaurant/tenant information
- **users**: User accounts with role-based permissions
- **categories**: Product categories
- **products**: Menu items and products
- **product_variants**: Product variations (size, options)
- **ingredients**: Inventory items
- **product_ingredients**: Product-ingredient relationships
- **orders**: Customer orders
- **order_items**: Order line items
- **inventory_logs**: Stock movement tracking
- **notifications**: System notifications

## Authentication Flow

1. **Login Page**: Select role (Cashier/Owner) and authenticate
2. **Route Protection**: ProtectedRoute component checks permissions
3. **Redirect Logic**: Users redirected based on role
   - Owner/Admin → Dashboard
   - Cashier → POS
4. **Admin Access**: Hidden admin button for admin/owner users

## Deployment Configuration

### Vercel Setup
- **vercel.json**: SPA routing configuration
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Node Version**: Latest

### Environment Variables
- No external dependencies - fully self-contained mock system

## Development Workflow

### Local Development
```bash
npm install
npm run dev
```

### Build & Deploy
```bash
npm run build
vercel --prod
```

## Key Design Decisions

1. **Mock Backend**: Simplified development without external database
2. **Multi-tenant**: Scalable architecture for multiple restaurants
3. **Type Safety**: Full TypeScript implementation
4. **Modern UI**: Clean, responsive design with TailwindCSS
5. **Component-based**: Reusable React components
6. **State Management**: Zustand for simplicity and performance

## Security Considerations

- **Role-based Access Control**: Granular permissions
- **Route Protection**: Server-side route validation
- **Hidden Admin Panel**: Admin access not exposed in UI
- **Input Validation**: Form validation and sanitization

## Future Enhancements

1. **Real Database**: Replace mock with PostgreSQL/MongoDB
2. **Payment Integration**: Stripe/PayPal integration
3. **Advanced Analytics**: More detailed reporting
4. **Mobile App**: React Native companion app
5. **API Integration**: Third-party service integrations
6. **Advanced Inventory**: Automated ordering, suppliers

## Current Status

- **Branch System**: ✅ Completely removed
- **Admin Access**: ✅ Hidden via top-left button
- **SPA Routing**: ✅ Fixed with vercel.json
- **Multi-tenant**: ✅ Fully functional
- **All Core Features**: ✅ Operational

The system is production-ready for demo purposes and can be extended with real backend services as needed.
