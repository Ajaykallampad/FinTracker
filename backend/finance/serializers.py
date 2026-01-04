from rest_framework import serializers
from .models import Category, Item, DailyExpense, ExpenseItem

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'
        read_only_fields = ('user',)

class ItemSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    class Meta:
        model = Item
        fields = '__all__'
        read_only_fields = ('user',)

class ExpenseItemSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source='item.name', read_only=True)
    category_name = serializers.CharField(source='item.category.name', read_only=True)
    
    class Meta:
        model = ExpenseItem
        fields = ['id', 'item', 'item_name', 'category_name', 'amount']

class DailyExpenseSerializer(serializers.ModelSerializer):
    expenses = ExpenseItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = DailyExpense
        fields = ['id', 'date', 'expenses', 'created_at']
        read_only_fields = ('user', 'created_at')
