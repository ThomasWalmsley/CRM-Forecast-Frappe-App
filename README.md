# CRM Forecast for Frappe/ERPNext v16

A custom Desk page for Frappe CRM that presents open CRM Deals as a monthly revenue forecast.

## Features

- Monthly columns based on `expected_closure_date`
- Pipeline total per month
- Weighted forecast per month (`expected_deal_value × probability`)
- Deal cards showing organization, value, probability, stage and close date
- Click a deal to open the CRM Deal
- Previous/next month navigation
- 3/6/12 month range
- Owner filter
- Refresh button
- Uses Frappe permissions when reading `CRM Deal`

## Installation

This is a normal custom Frappe app. It does not modify Frappe CRM.

From your bench:

```bash
bench get-app /path/to/crm_forecast
bench --site your-site.example.com install-app crm_forecast
bench --site your-site.example migrate
bench build --app crm_forecast
bench --site your-site.example clear-cache
```

For a local development app already present in `apps/`:

```bash
bench --site your-site.example install-app crm_forecast
bench --site your-site.example migrate
bench build --app crm_forecast
bench --site your-site.example clear-cache
```

Then open:

`/app/sales-forecast`

## Frappe Cloud

Put this app in a Git repository and add it to the bench/site using the Frappe Cloud custom app flow. The app declares compatibility with Frappe v16.

## Add a link in CRM

The first version intentionally does not modify the Frappe CRM application itself. Add a Workspace shortcut/link to `/app/sales-forecast`, or bookmark the page.

## Data assumptions

The page reads these CRM Deal fields:

- `organization`
- `expected_deal_value`
- `probability`
- `expected_closure_date`
- `status`
- `deal_owner`
- `currency`

Forecasting should be enabled in Frappe CRM so expected value and expected closure date are populated on deals.

The page excludes CRM Deal statuses whose `CRM Deal Status.type` is `Won` or `Lost`.

## Currency

Totals are calculated separately by currency. If all deals use GBP, each monthly total is a single GBP amount. If multiple currencies are present, the month displays a separate total for each currency rather than incorrectly adding currencies together.

## Customisation

The frontend is in:

`crm_forecast/crm_forecast/page/sales_forecast/sales_forecast.js`

Styles are in:

`crm_forecast/crm_forecast/page/sales_forecast/sales_forecast.css`

The API is in:

`crm_forecast/api.py`
