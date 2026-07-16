# Employees Module

## Purpose
The Employees Module manages the complete lifecycle of a workforce member within the organization. It acts as the central hub for storing personal details, employment information, hierarchical relationships (managers/subordinates), and preferences (language, currency, notifications) required by the rest of the HR system.

## Business Rules
- **Multi-Currency:** Employees can select a preferred currency for wallet balances and UI display, independent of the organization's base currency.
- **Hierarchy:** Every employee can have an assigned `Manager` and an assigned `Department` or `Location`.
- **Employment Status:** Probation and confirmation dates track the tenure of the employee. Active/Inactive statuses control system access.

## Database Models
- `User` - The core entity representing an employee.
- `EmergencyContact` - Represents the employee's emergency contacts.
- `Compensation` - Handles multi-currency salary components, allowances, and deductions.
- `BankAccount` - Stores banking details (IFSC, SWIFT, IBAN) integrated with Razorpay/Stripe.
- `NotificationPreferences` - Granular user preferences for emails/push/sms.
- `Document` - KYC, Offer Letters, Contracts, Payslips (linked to Cloudinary).

## Related Prisma Tables
- `Organization`
- `Department`
- `Location`
- `Wallet`

## API Endpoints
- `GET /employees` - List all employees (paginated, filtered).
- `GET /employees/:id` - Get employee details.
- `POST /employees` - Create a new employee profile.
- `PUT /employees/:id` - Update employee details.
- `GET /employees/:id/compensation` - Fetch latest compensation package.

## Controllers
- `UsersController` (located in `server/src/modules/users/`)

## Services
- `UsersService` (located in `server/src/modules/users/`)

## DTOs
- `CreateEmployeeDto`
- `UpdateEmployeeDto`
- `UpdateCompensationDto`
- `AddBankAccountDto`

## Validation Rules
- Valid email format (unique constraint).
- Valid currency enums (INR, USD, etc.) for `preferredCurrency`.
- Valid timezone strings for location configurations.
- Date comparisons (e.g. `joiningDate` must be before `resignationDate`).

## Frontend Pages
- `/employees` - Directory / list of employees.
- `/employees/[id]` - Detailed profile view.

## Components
- `EmployeeListTable` - Data table using shadcn/ui.
- `EmployeeProfileForm` - Built with `react-hook-form` + `zod` for editing details.
- `CompensationCard` - Displays breakdown of salary and allowances.

## State Stores
- Zustand store (`client/lib/stores/`) may be used for current user session, but general employee listing is likely handled via Server Components or React Query.

## Permissions
- **Admin/HR:** Full CRUD access to all employees.
- **Manager:** Read-only access to subordinates.
- **Employee:** Read-only access to own profile, edit access to preferences and emergency contacts.

## Dependencies
- Cloudinary (for Document and Avatar uploads).
- Razorpay / Stripe (for Bank Account validation and payout mapping).

## Future Improvements
- Add historical compensation tracking UI.
- Implement robust RBAC policies for detailed field-level security.

## Known Issues
- Bank account verification relies on third-party webhook reliability.

## Files
- `client/app/employees/`
- `client/components/employees/`
- `server/src/modules/users/`

## Related Modules
- [[Auth]]
- [[Departments]]
- [[Payroll]]
- [[Uploads]]

## Status
- [ ] Schema Design
- [ ] NestJS Module
- [ ] UI Views

## Completed %
0%

---
#force-flow #modules
