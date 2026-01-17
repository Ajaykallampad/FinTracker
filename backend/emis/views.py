from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.utils import timezone
from .models import EMI, Installment
from .serializers import EMISerializer, InstallmentSerializer

class EMIViewSet(viewsets.ModelViewSet):
    serializer_class = EMISerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return EMI.objects.filter(user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class InstallmentViewSet(viewsets.ModelViewSet):
    serializer_class = InstallmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Installment.objects.filter(emi__user=self.request.user)

    @action(detail=True, methods=['post'])
    @transaction.atomic
    def mark_paid(self, request, pk=None):
        installment = self.get_object()
        emi = installment.emi

        if emi.status == EMI.COMPLETED:
            return Response({"error": "This EMI is already completed."}, status=status.HTTP_400_BAD_REQUEST)
        
        if installment.status == Installment.PAID:
            return Response({"error": "Installment is already paid."}, status=status.HTTP_400_BAD_REQUEST)

        # Update installment
        installment.status = Installment.PAID
        installment.paid_date = timezone.now().date()
        installment.save()

        # Check if all installments are paid
        if not emi.installments.filter(status=Installment.PENDING).exists():
            emi.status = EMI.COMPLETED
            emi.save()

        return Response(InstallmentSerializer(installment).data)

