# 2.4 - Inventory Triad & Client Financial Overrides

> 🧭 **Note:** ⬅️ Previous: [11 - 3 C's Diagnostics & Hardware OBD-II Scanner](https://notion.so/3e0968d84bdf81df8968dcb3a9e6f46d)   |   🏠 [Main Architecture Hub](https://notion.so/3df968d84bdf80c1aae3e239eb52e38d)


# 12 - Inventory Triad & Client Financial Overrides

> 📦 **Note:** Benchmark: Complete inventory management across Parts, Tires, and Labor packages, combined with per-client commercial pricing overrides.


---


## 1. Working Notes & Functional Overview

Auto repair shops manage three fundamentally distinct inventory types: physical parts with part numbers, tires with dimensional specs, and labor packages with predefined hourly units. Additionally, commercial fleet clients require custom contract rates, while tax-exempt customers require zero-VAT invoicing.

- Inventory Triad: Unified management of Parts, Tires, and Canned Labor.
- Tire Sizing Intelligence: Dedicated dimensional schema (Width / Aspect Ratio / Rim / Speed / Season).
- Dynamic Gross Margin: Automatic computation of markup and gross profit margin on every stock item.
- Low Stock Warnings: Automatic flags when quantity drops to or below reorder threshold.
- 5-Point Client Overrides: Tax Exempt, Account Discount, Labor Rate, Parts Markup, and Payment Terms.

## 2. Inventory Triad Schema Structure

| Inventory Type | Key Attributes | Usage in Repair Order |
| --- | --- | --- |
| General Parts | SKU, Description, Category, Cost, Retail, Qty, Bin Location | Deducts stock on job completion, calculates parts profit |
| Tire Catalog | Brand, Pattern, Width/Profile/Rim, Load/Speed Index, DOT | Tracks tire inventory, seasonal sets, and rim fitments |
| Canned Labor | Service Code, Standard Hours, Labor Category, Notes | Standardizes book-time labor across technicians |


## 3. Client Financial Overrides Matrix

| Override | Field | Default Behavior | Overridden Behavior |
| --- | --- | --- | --- |
| Tax Exempt | isTaxExempt (boolean) | 15% VAT added to total | 0% VAT calculated, tax-exempt disclaimer printed |
| Apply Discount | defaultDiscountPercent (numeric) | 0% discount | Applies fixed % across all eligible labor/parts items |
| Labor Rate | customLaborRateHourly (numeric) | Shop standard (R 480.00/hr) | Custom rate applied to all labor entries for client |
| Parts Markup | customPartsMarkupPercent (numeric) | Standard markup (+45%) | Fixed contract markup (e.g. Cost + 15%) |
| Payment Terms | customPaymentTermsDays (int) | 0 (COD) | Net 15, Net 30, or Net 60 days on invoice due date |


## 4. Where it is Configured

| Layer | File Path | Description |
| --- | --- | --- |
| Route - Inventory | app/(dashboard)/inventory/page.tsx | Inventory catalog table with tabbed filter (Parts, Tires, Labor) |
| Route - Customer Settings | app/(dashboard)/customers/[id]/page.tsx | Profile tab including Client Settings & Overrides card |
| Component - Overrides | src/components/customers/CustomerOverridesCard.tsx | Interactive toggle card for 5 override rules |
| Component - Tire Form | src/components/inventory/TireSpecsForm.tsx | Specialized tire dimension selector |
| Server Actions | src/actions/inventory.ts | addInventoryItemAction, adjustStockQuantityAction |
| Server Actions | src/actions/customers.ts | updateCustomerOverridesAction |


## 5. Why it was Built This Way

- B2B Fleet Profitability: Commercial contracts require negotiated rates. Storing overrides on the customer level eliminates manual recalculations and billing mistakes.
- Speed of Quoting: Combining canned labor with catalog parts allows complete repair estimates to be generated in under 60 seconds.
- Audit Trail & Stock Control: Automated inventory decrementing upon repair order completion prevents stock shrinkage.

---

> 🧭 **Note:** ⬅️ Previous: [11 - 3 C's Diagnostics & Hardware OBD-II Scanner](https://notion.so/3e0968d84bdf81df8968dcb3a9e6f46d)   |   🏠 [Main Architecture Hub](https://notion.so/3df968d84bdf80c1aae3e239eb52e38d)

