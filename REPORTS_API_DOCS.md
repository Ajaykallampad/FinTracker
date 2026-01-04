# Reports API Documentation

## Overview
Three production-ready reporting endpoints for comprehensive financial analytics.

---

## 1️⃣ Monthly Bar Chart API

**Endpoint:** `GET /api/daily-expenses/monthly_bar_chart/`

**Purpose:** Returns 12-month expense totals for bar chart visualization (includes zero months).

**Query Parameters:**
- `year` (optional): Year to query (default: current year)

**Request Example:**
```
GET /api/daily-expenses/monthly_bar_chart/?year=2026
```

**Response Example:**
```json
[
  {"month": "January", "month_num": 1, "total": 1250.50},
  {"month": "February", "month_num": 2, "total": 0.0},
  {"month": "March", "month_num": 3, "total": 850.25},
  ... (12 months total)
]
```

**Frontend Usage:**
- Direct mapping to recharts BarChart
- X-axis: `month`
- Y-axis: `total`

---

## 2️⃣ Category Pie Chart API

**Endpoint:** `GET /api/daily-expenses/category_pie_chart/`

**Purpose:** Returns category-wise expense breakdown for a specific month (only categories with expenses > 0).

**Query Parameters:**
- `year` (optional): Year to query (default: current year)
- `month` (optional): Month to query 1-12 (default: current month)

**Request Example:**
```
GET /api/daily-expenses/category_pie_chart/?year=2026&month=1
```

**Response Example:**
```json
[
  {"category": "Food", "total": 500.00},
  {"category": "Entertainment", "total": 250.00},
  {"category": "Transport", "total": 150.00}
]
```

**Edge Case:**
- Returns `[]` if no expenses for the month

**Frontend Usage:**
- Direct mapping to recharts PieChart
- `dataKey="total"`
- `nameKey="category"`

---

## 3️⃣ Advanced Tabular Report API

**Endpoint:** `GET /api/daily-expenses/tabular_report/`

**Purpose:** Returns pivot-table style report with items as columns, grouped by date or month.

**Query Parameters (Required):**
- `start_date`: Start date (YYYY-MM-DD)
- `end_date`: End date (YYYY-MM-DD)
- `group_by`: Grouping mode (`daily` or `monthly`)

**Request Example (Daily):**
```
GET /api/daily-expenses/tabular_report/?start_date=2026-01-01&end_date=2026-01-31&group_by=daily
```

**Response Example (Daily):**
```json
{
  "columns": ["Date", "Egg", "Milk", "Cinema", "Total"],
  "rows": [
    {
      "date": "2026-01-10",
      "Egg": 40.0,
      "Milk": 30.0,
      "Cinema": 0.0,
      "total": 70.0
    },
    {
      "date": "2026-01-11",
      "Egg": 0.0,
      "Milk": 30.0,
      "Cinema": 250.0,
      "total": 280.0
    }
  ],
  "group_by": "daily"
}
```

**Request Example (Monthly):**
```
GET /api/daily-expenses/tabular_report/?start_date=2026-01-01&end_date=2026-03-31&group_by=monthly
```

**Response Example (Monthly):**
```json
{
  "columns": ["Month", "Egg", "Milk", "Cinema", "Total"],
  "rows": [
    {
      "month": "January 2026",
      "month_key": "2026-01",
      "Egg": 120.0,
      "Milk": 90.0,
      "Cinema": 250.0,
      "total": 460.0
    },
    {
      "month": "February 2026",
      "month_key": "2026-02",
      "Egg": 60.0,
      "Milk": 60.0,
      "Cinema": 0.0,
      "total": 120.0
    }
  ],
  "group_by": "monthly"
}
```

**Dynamic Columns:**
- Item columns are generated based on all items belonging to the user
- Missing items automatically get 0.0 value
- Column order: [Date/Month, ...Item Names..., Total]

**Frontend Usage:**
- Use `columns` array to generate table headers
- Iterate `rows` array for table body
- Access item values by item name: `row[itemName]`
- First column: `row.date` or `row.month`
- Last column: `row.total`

---

## Performance Optimizations

1. **SQL Aggregations**: All calculations done at database level using Django ORM
2. **Select Related**: Minimizes database queries with joins
3. **Efficient Filtering**: User-scoped queries prevent data leaks
4. **Zero-Data Handling**: Monthly bar chart always returns 12 months (fills zeros)

---

## Edge Cases Handled

✅ **No Data**:
- Bar chart: Returns 12 months with `total: 0.0`
- Pie chart: Returns empty array `[]`
- Tabular: Returns `rows: []`

✅ **Partial Data**:
- Missing months get 0.0
- Missing items get 0.0 in tabular report

✅ **Date Ranges**:
- Tabular report validates `start_date` and `end_date` are present
- Returns 400 error if missing

---

## Testing Checklist

- [ ] Test monthly bar chart with year having no data → Should return 12 zeros
- [ ] Test pie chart for current month → Should show live data
- [ ] Test tabular report daily grouping
- [ ] Test tabular report monthly grouping
- [ ] Test tabular report with date range spanning multiple years
- [ ] Verify totals match across all reports

---

## API Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/daily-expenses/monthly_bar_chart/` | GET | 12-month expense trend |
| `/api/daily-expenses/category_pie_chart/` | GET | Category breakdown (monthly) |
| `/api/daily-expenses/tabular_report/` | GET | Pivot table with date filters |

All endpoints require authentication via JWT token.
