from rest_framework import viewsets, permissions
from .models import EMI, Installment
from .serializers import EMISerializer, InstallmentSerializer

class EMIViewSet(viewsets.ModelViewSet):
    serializer_class = EMISerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return EMI.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class InstallmentViewSet(viewsets.ModelViewSet):
    serializer_class = InstallmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Installment.objects.filter(emi__user=self.request.user)
