from django.db.models import Sum, F
from django.db.models.functions import TruncMonth, TruncDay
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Category, Item, DailyExpense, ExpenseItem
from .serializers import CategorySerializer, ItemSerializer, DailyExpenseSerializer, ExpenseItemSerializer

class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self): return Category.objects.filter(user=self.request.user)
    def perform_create(self, serializer): serializer.save(user=self.request.user)

class ItemViewSet(viewsets.ModelViewSet):
    serializer_class = ItemSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self): return Item.objects.filter(user=self.request.user)
    def perform_create(self, serializer): serializer.save(user=self.request.user)

class DailyExpenseViewSet(viewsets.ModelViewSet):
    serializer_class = DailyExpenseSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'date'

    def get_queryset(self):
        return DailyExpense.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def add_item(self, request, date=None):
        daily_expense = self.get_object()
        item_id = request.data.get('item')
        amount = request.data.get('amount')
        
        if not item_id or amount is None:
            return Response({'error': 'Item and Amount required'}, status=400)
            
        try:
            item = Item.objects.get(id=item_id, user=request.user)
        except Item.DoesNotExist:
            return Response({'error': 'Invalid item'}, status=400)

        ExpenseItem.objects.create(daily_expense=daily_expense, item=item, amount=amount)
        return Response(self.get_serializer(daily_expense).data)

    @action(detail=False, methods=['get'])
    def reports(self, request):
        qs = ExpenseItem.objects.filter(daily_expense__user=request.user)
        
        start = request.query_params.get('start_date')
        end = request.query_params.get('end_date')
        if start: qs = qs.filter(daily_expense__date__gte=start)
        if end: qs = qs.filter(daily_expense__date__lte=end)

        category_data = qs.values(name=F('item__category__name')).annotate(value=Sum('amount')).order_by('-value')
        daily_data = qs.values(date=F('daily_expense__date')).annotate(value=Sum('amount')).order_by('date')
        monthly_data = qs.annotate(month=TruncMonth('daily_expense__date')).values('month').annotate(value=Sum('amount')).order_by('month')

        return Response({
            'category_distribution': [{'name': x['name'], 'value': float(x['value'] or 0)} for x in category_data],
            'daily_trend': [{'date': x['date'], 'value': float(x['value'] or 0)} for x in daily_data],
            'monthly_trend': [{'month': x['month'], 'value': float(x['value'] or 0)} for x in monthly_data]
        })

    @action(detail=False, methods=['get'])
    def monthly_bar_chart(self, request):
        """
        Returns 12-month expense data for bar chart.
        Query params: year (default: current year)
        Response: [{"month": "January", "month_num": 1, "total": 1250.50}, ...]
        """
        from datetime import datetime
        from calendar import month_name
        
        year = request.query_params.get('year', datetime.now().year)
        year = int(year)
        
        # Get all expense items for the specified year
        qs = ExpenseItem.objects.filter(
            daily_expense__user=request.user,
            daily_expense__date__year=year
        )
        
        # Aggregate by month
        monthly_totals = qs.annotate(
            month_num=TruncMonth('daily_expense__date')
        ).values('month_num').annotate(
            total=Sum('amount')
        ).order_by('month_num')
        
        # Create a lookup dictionary
        month_lookup = {item['month_num'].month: float(item['total']) for item in monthly_totals}
        
        # Build complete 12-month array with zeros for missing months
        result = []
        for month_num in range(1, 13):
            result.append({
                'month': month_name[month_num],
                'month_num': month_num,
                'total': month_lookup.get(month_num, 0.0)
            })
        
        return Response(result)

    @action(detail=False, methods=['get'])
    def category_pie_chart(self, request):
        """
        Returns category-wise expense breakdown for a specific month.
        Query params: year, month (default: current month)
        Response: [{"category": "Food", "total": 500.00}, ...]
        """
        from datetime import datetime
        
        year = request.query_params.get('year', datetime.now().year)
        month = request.query_params.get('month', datetime.now().month)
        year = int(year)
        month = int(month)
        
        # Get expense items for the specified month
        qs = ExpenseItem.objects.filter(
            daily_expense__user=request.user,
            daily_expense__date__year=year,
            daily_expense__date__month=month
        )
        
        # Aggregate by category
        category_totals = qs.values(
            category=F('item__category__name')
        ).annotate(
            total=Sum('amount')
        ).filter(
            total__gt=0  # Only categories with expenses > 0
        ).order_by('-total')
        
        result = [
            {'category': item['category'], 'total': float(item['total'])}
            for item in category_totals
        ]
        
        return Response(result)

    @action(detail=False, methods=['get'])
    def tabular_report(self, request):
        """
        Returns pivot-table style report with items as columns.
        Query params: 
            - start_date, end_date (required)
            - group_by: 'daily' or 'monthly' (required)
        Response: {
            "columns": ["Date/Month", "Egg", "Milk", "Cinema", "Total"],
            "rows": [
                {"date": "2025-01-10", "Egg": 40, "Milk": 30, "Cinema": 0, "total": 70},
                ...
            ]
        }
        """
        from datetime import datetime
        from collections import defaultdict
        
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        group_by = request.query_params.get('group_by', 'daily')  # 'daily' or 'monthly'
        
        if not start_date or not end_date:
            return Response({'error': 'start_date and end_date are required'}, status=400)
        
        # Get all expense items in date range
        qs = ExpenseItem.objects.filter(
            daily_expense__user=request.user,
            daily_expense__date__gte=start_date,
            daily_expense__date__lte=end_date
        ).select_related('item', 'daily_expense')
        
        # Get all unique items for columns
        all_items = Item.objects.filter(user=request.user).order_by('name')
        item_names = [item.name for item in all_items]
        
        # Build data structure
        rows_dict = defaultdict(lambda: defaultdict(float))
        
        if group_by == 'daily':
            # Group by date
            for expense_item in qs:
                date_key = expense_item.daily_expense.date.strftime('%Y-%m-%d')
                item_name = expense_item.item.name
                rows_dict[date_key][item_name] += float(expense_item.amount)
            
            # Sort by date
            sorted_keys = sorted(rows_dict.keys())
            
            rows = []
            for date_key in sorted_keys:
                row = {'date': date_key}
                total = 0.0
                for item_name in item_names:
                    value = rows_dict[date_key].get(item_name, 0.0)
                    row[item_name] = value
                    total += value
                row['total'] = total
                rows.append(row)
            
            columns = ['Date'] + item_names + ['Total']
            
        else:  # monthly
            # Group by month
            for expense_item in qs:
                date = expense_item.daily_expense.date
                month_key = f"{date.year}-{date.month:02d}"
                item_name = expense_item.item.name
                rows_dict[month_key][item_name] += float(expense_item.amount)
            
            # Sort by month
            sorted_keys = sorted(rows_dict.keys())
            
            rows = []
            from calendar import month_name
            for month_key in sorted_keys:
                year, month = month_key.split('-')
                month_label = f"{month_name[int(month)]} {year}"
                
                row = {'month': month_label, 'month_key': month_key}
                total = 0.0
                for item_name in item_names:
                    value = rows_dict[month_key].get(item_name, 0.0)
                    row[item_name] = value
                    total += value
                row['total'] = total
                rows.append(row)
            
            columns = ['Month'] + item_names + ['Total']
        
        return Response({
            'columns': columns,
            'rows': rows,
            'group_by': group_by
        })
