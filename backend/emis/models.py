from django.db import models
from django.contrib.auth.models import User
from dateutil.relativedelta import relativedelta

class EMI(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=100)
    start_date = models.DateField()
    end_date = models.DateField()
    total_months = models.IntegerField()
    monthly_amount = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        super().save(*args, **kwargs)
        if is_new:
            self.generate_installments()

    def generate_installments(self):
        current_date = self.start_date
        for i in range(self.total_months):
            Installment.objects.create(
                emi=self,
                due_date=current_date,
                amount=self.monthly_amount
            )
            current_date = current_date + relativedelta(months=1)

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
    due_date = models.DateField()
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default=PENDING)
    paid_date = models.DateField(null=True, blank=True)

    class Meta:
        ordering = ['due_date']
    
    def __str__(self):
        return f"{self.emi.title} - {self.due_date}"
