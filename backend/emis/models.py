from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator
from django.core.exceptions import ValidationError
from datetime import timedelta
from decimal import Decimal

class EMI(models.Model):
    ACTIVE = 'ACTIVE'
    COMPLETED = 'COMPLETED'
    STATUS_CHOICES = [
        (ACTIVE, 'Active'),
        (COMPLETED, 'Completed'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=100)
    start_date = models.DateField()
    end_date = models.DateField()
    total_installments = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    installment_amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default=ACTIVE)
    created_at = models.DateTimeField(auto_now_add=True)

    def clean(self):
        if self.start_date and self.end_date and self.start_date >= self.end_date:
            raise ValidationError("Start date must be before end date.")

    def save(self, *args, **kwargs):
        self.clean()
        is_new = self.pk is None
        super().save(*args, **kwargs)
        if is_new:
            self.generate_installments()

    def generate_installments(self):
        """Evenly space installments between start and end date."""
        if self.total_installments == 1:
            Installment.objects.create(
                emi=self,
                installment_number=1,
                due_date=self.start_date,
                amount=self.installment_amount
            )
            return

        total_days = (self.end_date - self.start_date).days
        interval = total_days / (self.total_installments - 1)
        
        for i in range(self.total_installments):
            due_date = self.start_date + timedelta(days=round(i * interval))
            Installment.objects.create(
                emi=self,
                installment_number=i + 1,
                due_date=due_date,
                amount=self.installment_amount
            )

    @property
    def total_amount(self):
        return self.installment_amount * self.total_installments

    def __str__(self):
        return self.title

class Installment(models.Model):
    PENDING = 'PENDING'
    PAID = 'PAID'
    STATUS_CHOICES = [
        (PENDING, 'Pending'),
        (PAID, 'Paid'),
    ]

    emi = models.ForeignKey(EMI, related_name='installments', on_delete=models.CASCADE)
    installment_number = models.PositiveIntegerField()
    due_date = models.DateField()
    amount = models.DecimalField(max_digits=10, decimal_places=2, editable=False)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default=PENDING)
    paid_date = models.DateField(null=True, blank=True)

    class Meta:
        ordering = ['installment_number']
        unique_together = ('emi', 'installment_number')
    
    def __str__(self):
        return f"{self.emi.title} - Installment {self.installment_number}"

