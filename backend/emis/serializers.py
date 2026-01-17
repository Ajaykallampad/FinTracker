from rest_framework import serializers
from .models import EMI, Installment

class InstallmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Installment
        fields = ['id', 'installment_number', 'due_date', 'amount', 'status', 'paid_date']
        read_only_fields = ['id', 'installment_number', 'due_date', 'amount']

class EMISerializer(serializers.ModelSerializer):
    installments = InstallmentSerializer(many=True, read_only=True)
    total_amount = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    remaining_amount = serializers.SerializerMethodField()
    progress = serializers.SerializerMethodField()
    
    class Meta:
        model = EMI
        fields = [
            'id', 'title', 'start_date', 'end_date', 'total_installments', 
            'installment_amount', 'total_amount', 'remaining_amount', 
            'status', 'progress', 'installments', 'created_at'
        ]
        read_only_fields = ('user', 'status', 'installments', 'created_at')

    def get_remaining_amount(self, obj):
        total_paid = obj.installments.filter(status='PAID').count()
        remaining_installments = obj.total_installments - total_paid
        return remaining_installments * obj.installment_amount

    def get_progress(self, obj):
        total = obj.total_installments
        if total == 0:
            return 0
        paid = obj.installments.filter(status='PAID').count()
        return round((paid / total) * 100, 2)

