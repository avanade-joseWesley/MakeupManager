# MakeupManager - AI Coding Assistant Instructions

## Project Overview
MakeupManager is a professional makeup artist's management system built with React 18, TypeScript, Vite, and Supabase. It provides complete client management, pricing calculation, and WhatsApp integration for Brazilian beauty professionals.

## Architecture & Data Flow

### Core Components
- **Authentication**: Supabase Auth with user-scoped data isolation
- **Client Management**: Full CRUD with search/filtering and WhatsApp integration
- **Appointments System**: Complete scheduling with calendar view, status management, and payment tracking
- **Financial Dashboard**: Revenue analysis, payment tracking, and performance metrics
- **Service Configuration**: Hierarchical structure (categories → services → regional pricing)
- **Price Calculator**: Complex pricing with regional overrides, custom prices, and travel fees
- **Settings**: User profile and business configuration management

### Data Model
```sql
profiles (user profiles)
├── service_areas (regions with travel fees)
├── service_categories (service groups)
│   └── services (individual services with base pricing)
└── service_regional_prices (region-specific pricing overrides)

clients (customer database with user isolation)

appointments (scheduling system)
├── client_id (reference to clients)
├── scheduled_date, scheduled_time
├── status (confirmed, completed, cancelled)
├── services (JSONB array)
├── is_custom_price (boolean flag)
├── travel_fee (decimal)
├── payment_total_appointment (total value)
├── total_amount_paid (sum of payments)
├── down_payment, remaining_payment
└── notes, address
```

### Key Business Rules
- **Regional Pricing Priority**: Regional prices completely override base service prices (including travel fees)
- **User Data Isolation**: All data scoped by `user_id` with Row Level Security (RLS)
- **Brazilian Localization**: Phone formatting, currency (BRL), and Portuguese UI text
- **Appointment Reminders**: WhatsApp reminders automatically sent for appointments within 7 days
- **Custom Pricing**: Support for manual price override excluding travel fees
- **Payment Tracking**: Complete payment flow with down payment, remaining, and total paid tracking

## Critical Developer Workflows

### Development Setup
```bash
npm install
npm run dev  # Runs on http://localhost:3000
```

### Build & Deployment
```bash
npm run build  # Creates dist/ folder
./deploy.ps1   # PowerShell deploy script (developer → master → GitHub Pages)
```

### Database Management
- SQL migrations in `database/migrations.sql`
- Execute via Supabase dashboard SQL editor
- RLS policies ensure user data isolation

### WhatsApp Integration
- **Web Integration**: Direct `wa.me` links with URL-encoded messages
- **Server Integration**: Node.js server (`whatsapp-server.cjs`) for automated messaging
- **Phone Formatting**: Brazilian numbers with automatic country code addition

## Project-Specific Patterns

### Component Structure
```tsx
// State management with useState/useEffect
// Supabase queries with user isolation
// Brazilian Portuguese UI text
// Tailwind CSS with custom gradients
// Form validation with NumericInput component
```

### Database Queries
```typescript
// Always include user_id filtering
const { data, error } = await supabase
  .from('clients')
  .select('*')
  .eq('user_id', user.id)  // Critical for RLS
  .order('created_at', { ascending: false })
```

### Pricing Logic
```typescript
// Regional price takes precedence over base price
const basePrice = regionalPrice ? regionalPrice.price : service.price
// Regional prices already include travel fees
```

### Phone Number Handling
```typescript
// Brazilian phone formatting for WhatsApp
const cleanNumber = phone.replace(/\D/g, '')
const whatsappNumber = cleanNumber.startsWith('55') ? cleanNumber : `55${cleanNumber}`
const chatId = `${whatsappNumber}@c.us`
```

### File Organization
```
src/
├── components/     # React components
├── lib/           # Utilities (supabase client)
└── main.tsx       # App entry point

database/          # SQL migrations and setup
.github/workflows/ # CI/CD configuration
```

## Common Patterns & Conventions

### Error Handling
```typescript
try {
  const { data, error } = await supabase.from('table').select('*')
  if (error) throw error
  // Handle success
} catch (err) {
  console.error('Operation failed:', err)
  alert(`Error: ${err.message}`)
}
```

### Form Validation
```tsx
// Use NumericInput for currency/numeric fields
<NumericInput
  value={priceInput}
  onChange={setPriceInput}
  decimalPlaces={2}
  formatCurrency={true}
  currency="BRL"
  locale="pt-BR"
  onValidate={setValid}
/>
```

### WhatsApp Message Templates
```typescript
const message = `*🎨 AGENDAMENTO CONFIRMADO*
👤 Cliente: ${clientName}
💄 Serviço: ${service}
📅 Data: ${date}
💰 Valor: R$ ${price.toFixed(2)}
✨ Enviado via MakeUp Manager`
```

### Branch Strategy
- `developer`: Active development branch
- `master`: Production branch (auto-deploys to GitHub Pages)
- Merge developer → master triggers CI/CD pipeline

### Environment Configuration
```typescript
// Vite environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
```

## Key Files to Reference

### Core Architecture
- `src/App.tsx` - Main app structure and routing
- `src/components/Dashboard.tsx` - Main navigation and view switching
- `src/lib/supabase.ts` - Database client and types

### Business Logic
- `src/components/AppointmentsPage.tsx` - Appointments management with reminders
- `src/components/CalendarPage.tsx` - Monthly calendar with appointment CRUD
- `src/components/FinancialDashboard.tsx` - Financial metrics and reporting
- `src/components/PriceCalculator.tsx` - Complex pricing calculations
- `src/components/Settings.tsx` - Configuration management
- `src/components/Clients.tsx` - Client CRUD operations

### Infrastructure
- `vite.config.ts` - Build configuration with GitHub Pages setup
- `package.json` - Scripts and dependencies
- `database/migrations.sql` - Database schema and RLS policies
- `.github/workflows/ci-deploy.yml` - CI/CD pipeline

### WhatsApp Integration
- `src/components/WhatsAppButton.tsx` - Web-based messaging
- `whatsapp-server.cjs` - Server-based automation
- `src/components/PriceCalculator.tsx` - Budget messaging templates

## Development Best Practices

### Code Style
- TypeScript strict mode enabled
- ESLint configuration via Vite
- Tailwind CSS with custom color schemes
- Component composition over inheritance

### Testing Approach
- Manual testing with `npm run dev`
- Build validation with `npm run build`
- Deploy testing with `./deploy.ps1`

### Performance Considerations
- Lazy loading not implemented (small app)
- Supabase RLS ensures data security
- PWA manifest for offline capability
- Optimized bundle with Vite

## Troubleshooting Common Issues

### Build Failures
```bash
# Clear cache and reinstall
Remove-Item node_modules -Recurse -Force
npm install
npm run build
```

### Supabase Connection Issues
- Verify `.env` file exists with correct credentials
- Check Supabase project status and API keys
- Ensure RLS policies are applied

### WhatsApp Integration Problems
- Web version: Check phone number formatting
- Server version: Verify QR code scanning and authentication
- Test with Brazilian phone numbers (55 prefix)

### Deployment Issues
- Ensure on `developer` branch before deploy
- Check GitHub Actions logs for CI/CD failures
- Verify `dist/` folder creation after build

## Security Considerations
- Row Level Security (RLS) enabled on all tables
- User data isolation by `user_id`
- Environment variables for sensitive credentials
- No client-side secret storage

Remember: This is a Brazilian makeup artist's business tool. All features should support professional beauty service workflows with WhatsApp integration and regional pricing flexibility.