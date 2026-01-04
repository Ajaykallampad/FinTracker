# Implementation Plan - Category -> Item -> Daily Expense Feature

## Problem Description
The user wants a structured, production-ready "Category -> Item -> Daily Expense" feature. This involves strictly enforced relationships where every item belongs to a category, and daily expenses are entered as a collection of items for a specific date. The system must support creating/viewing categories, reusable items, and daily expense logs with automatic category association.

## Proposed Data Model

We will refactor/extend the existing `finance` app models to match the requested hierarchy: `Category` -> `Item` -> `ExpenseItem` -> `DailyExpense`.

### Models (`backend/finance/models.py`)

1.  **Category** (Existing, verify constraints)
    *   `user` (FK to User)
    *   `name` (Char, unique per user)

2.  **Item** (Existing, verify constraints)
    *   `user` (FK to User)
    *   `category` (FK to Category)
    *   `name` (Char, unique per user)
    *   *Constraint*: `unique_together = ('user', 'name')`

3.  **DailyExpense** (New/Refactor)
    *   Represents a single day's expense sheet.
    *   `user` (FK to User)
    *   `date` (Date)
    *   *Constraint*: `unique_together = ('user', 'date')` - One record per day per user.

4.  **ExpenseItem** (Refactor of `Expense`)
    *   `daily_expense` (FK to `DailyExpense`, related_name='expenses')
    *   `item` (FK to `Item`)
    *   `amount` (Decimal)
    *   *Note*: The category is derived from `item.category`.
    *   *Properties*: `category_name` (for convenience in APIs).

## API Design (`backend/finance/views.py`, `serializers.py`)

1.  **CategoryViewSet**
    *   List/Create/Update/Delete.
    *   Ensure authorized user access.

2.  **ItemViewSet**
    *   List/Create/Update/Delete.
    *   Serializer must accept `category_id` and validate it belongs to the user or is global.

3.  **DailyExpenseViewSet**
    *   **GET /api/daily-expenses/{date}/**: Retrieve or create-if-not-exists the daily sheet for a specific date. Returns the list of `ExpenseItem`s nested within.
    *   **POST /api/daily-expenses/{date}/add_item/**: Add an item to that day.
    *   **POST /api/daily-expenses/{date}/bulk_update/**: (Optional) Save the entire day's grid.
    *   **GET /api/daily-expenses/summary/**: Aggregated category totals.

## Frontend Design (`frontend/src/pages/Expenses.jsx` or similar)

1.  **Components**:
    *   `CategoryManager`: Modal/Page to add/edit categories.
    *   `ItemManager`: Helper to create items (often invoked while adding an expense).
    *   `DailyExpenseForm`:
        *   Date Picker (default Today).
        *   List of entered rows: `Item (Dropdown) | Amount`.
        *   "Add Row" button.
        *   Live totals visualization (Grouped by Category).

2.  **UX Flow**:
    *   User selects Date.
    *   Frontend fetches `DailyExpense` for that date.
    *   User sees existing items.
    *   User clicks "Add Item", selects "Milk" (Dropdown shows "Milk - Food"). Category "Food" is displayed read-only next to it.
    *   User enters Price.
    *   Saves.
    *   Totals update immediately.

## Step-by-Step Implementation Plan

1.  **Backend: Models Migration**
    *   Modify `finance/models.py` to introduce `DailyExpense` and refactor `Expense` to `ExpenseItem` linking to `DailyExpense`.
    *   Run makemigrations and migrate.
2.  **Backend: Serializers & Views**
    *   Update `CategorySerializer` and `ItemSerializer`.
    *   Create `DailyExpenseSerializer` (nested) and `ExpenseItemSerializer`.
    *   Implement ViewSets with proper permissions and query optimizations (`select_related`).
3.  **Frontend: API Services**
    *   Update `api.js` to include new endpoints.
4.  **Frontend: UI Construction**
    *   Create `Expenses` page.
    *   Implement the Daily Entry form with dynamic rows.
    *   Implement Category/Item creation modals.
5.  **Validation & Testing**
    *   Verify data integrity (no orphan items, unique names).
    *   Test aggregation logic.

## Verification
*   Create Categories: Food, Ent.
*   Create Items: Milk->Food, Cinema->Ent.
*   Add Entry for Today: Milk 30, Cinema 250.
*   Check Summary: Food=30, Ent=250.
