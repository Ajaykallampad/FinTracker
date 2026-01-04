from rest_framework import serializers
from .models import Debt, Settlement
from decimal import Decimal


class SettlementSerializer(serializers.ModelSerializer):
    """Serializer for settlement history"""
    class Meta:
        model = Settlement
        fields = ['id', 'amount', 'settled_date', 'notes']
        read_only_fields = ['id', 'settled_date']

    def validate_amount(self, value):
        """Ensure settlement amount is positive"""
        if value <= 0:
            raise serializers.ValidationError("Settlement amount must be positive")
        return value


class DebtSerializer(serializers.ModelSerializer):
    """Full debt serializer with nested settlements"""
    outstanding_amount = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        read_only=True
    )
    days_pending = serializers.IntegerField(read_only=True, allow_null=True)
    settlements = SettlementSerializer(many=True, read_only=True)

    class Meta:
        model = Debt
        fields = [
            'id', 'person_name', 'amount', 'type', 'status',
            'amount_settled', 'outstanding_amount', 'due_date',
            'created_at', 'closed_at', 'days_pending', 'settlements'
        ]
        read_only_fields = ['user', 'created_at', 'closed_at', 'amount_settled']

    def validate(self, attrs):
        """Custom validation for debt updates"""
        # Prevent type changes after creation
        if self.instance and 'type' in attrs:
            if self.instance.type != attrs['type']:
                raise serializers.ValidationError({
                    'type': 'Transaction type cannot be changed after creation'
                })
        
        # Prevent modification of closed debts
        if self.instance and self.instance.status == Debt.CLOSED:
            raise serializers.ValidationError('Closed debts cannot be modified')
        
        return attrs

    def validate_amount(self, value):
        """Ensure amount is positive"""
        if value <= 0:
            raise serializers.ValidationError("Amount must be positive")
        return value


class DebtListSerializer(serializers.ModelSerializer):
    """Optimized serializer for list views (excludes settlement history)"""
    outstanding_amount = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        read_only=True
    )
    days_pending = serializers.IntegerField(read_only=True, allow_null=True)

    class Meta:
        model = Debt
        fields = [
            'id', 'person_name', 'amount', 'type', 'status',
            'amount_settled', 'outstanding_amount', 'due_date',
            'created_at', 'closed_at', 'days_pending'
        ]
        read_only_fields = ['user', 'created_at', 'closed_at', 'amount_settled']
