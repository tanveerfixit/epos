# Application Layout Reference

Use this guide to identify which source files control the layout of specific pages and sections in the EPOS system.

## Main Application Shell
- **Main Wrapper & Sidebar**: [App.tsx](file:///c:/epos/src/App.tsx)

## Navigation Views (Main Routes)
| Page / View Name | Switch Case / View ID | Source Component File |
| :--- | :--- | :--- |
| **Home Menu** | `home` | [HomeMenu.tsx](file:///c:/epos/src/components/HomeMenu.tsx) |
| **Dashboard** | `dashboard` | [Dashboard.tsx](file:///c:/epos/src/components/Dashboard.tsx) |
| **Cash Register (POS)** | `register` | [CashRegister.tsx](file:///c:/epos/src/components/CashRegister.tsx) |
| **Repairs (Jobs)** | `repairs` | [RepairList.tsx](file:///c:/epos/src/components/RepairList.tsx) |
| **Sales Invoices** | `invoices` | [InvoiceList.tsx](file:///c:/epos/src/components/InvoiceList.tsx) |
| **Invoice Detail View** | `invoice-details` | [InvoiceDetails.tsx](file:///c:/epos/src/components/InvoiceDetails.tsx) |
| **Customers List** | `customers` | [CustomerList.tsx](file:///c:/epos/src/components/CustomerList.tsx) |
| **Customer Profile** | `customer-details` | [CustomerDetails.tsx](file:///c:/epos/src/components/CustomerDetails.tsx) |
| **Products Inventory** | `products` | [ProductList.tsx](file:///c:/epos/src/components/ProductList.tsx) |
| **Product Detail View** | `product-details` | [ProductDetails.tsx](file:///c:/epos/src/components/ProductDetails.tsx) |
| **Add New Product** | `create-product` | [CreateProduct.tsx](file:///c:/epos/src/components/CreateProduct.tsx) |
| **Add Inventory (SKUs)** | `add-inventory` | [AddInventory.tsx](file:///c:/epos/src/components/AddInventory.tsx) |
| **Devices Inventory** | `devices` | [DeviceInventory.tsx](file:///c:/epos/src/components/DeviceInventory.tsx) |
| **Device Details (SKU)** | `sku-device-details` | [SkuDeviceDetails.tsx](file:///c:/epos/src/components/SkuDeviceDetails.tsx) |
| **Purchase Orders** | `purchase-orders` | [PurchaseOrderList.tsx](file:///c:/epos/src/components/PurchaseOrderList.tsx) |
| **PO Detailed View** | `purchase-order-detail`| [PurchaseOrderDetail.tsx](file:///c:/epos/src/components/PurchaseOrderDetail.tsx) |
| **End of Day** | `end-of-day` | [EndOfDay.tsx](file:///c:/epos/src/components/EndOfDay.tsx) |
| **Branch Transfers** | `transfers` | [BranchTransfer.tsx](file:///c:/epos/src/components/BranchTransfer.tsx) |
| **Manage Data / Settings**| `manage-data` | [ManageData.tsx](file:///c:/epos/src/components/ManageData.tsx) |
| **Getting Started** | `getting-started`| [GettingStarted.tsx](file:///c:/epos/src/components/GettingStarted.tsx) |

## Authentication Pages
- **Login Page**: [LoginPage.tsx](file:///c:/epos/src/components/auth/LoginPage.tsx)
- **Signup Page**: [SignupPage.tsx](file:///c:/epos/src/components/auth/SignupPage.tsx)
- **Forgot Password**: [ForgotPassword.tsx](file:///c:/epos/src/components/auth/ForgotPassword.tsx)
- **Reset Password**: [ResetPassword.tsx](file:///c:/epos/src/components/auth/ResetPassword.tsx)
- **Admin Login**: [AdminLoginPage.tsx](file:///c:/epos/src/components/auth/AdminLoginPage.tsx)

## Admin Portal
- **Management Center**: [AdminPortal.tsx](file:///c:/epos/src/components/admin/AdminPortal.tsx)

---

> [!TIP]
> When requesting a layout update, you can reference the file name (e.g., *"Update the layout of CustomerDetails.tsx to be full width"*) or the Page Name (e.g., *"Make the End of Day page look like the Repairs page"*).
