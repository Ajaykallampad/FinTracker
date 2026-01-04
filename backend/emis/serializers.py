from rest_framework import serializers
from .models import EMI, Installment

class InstallmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Installment
        fields = '__all__'
        read_only_fields = ('emi',)

class EMISerializer(serializers.ModelSerializer):
    installments = InstallmentSerializer(many=True, read_only=True)
    progress = serializers.SerializerMethodField()
    
    class Meta:
        model = EMI
        fields = '__all__'
        read_only_fields = ('user', 'installments')

    def get_progress(self, obj):
        total = obj.installments.count()
        paid = obj.installments.filter(status='PAID').count()
        return round((paid / total) * 100, 2) if total > 0 else 0
