from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator
from django.core.exceptions import ValidationError
from django.utils import timezone
from decimal import Decimal


class Debt(models.Model):
    BORROWED = 'BORROWED'
    GIVEN = 'GIVEN'
    TYPE_CHOICES = [
        (BORROWED, 'Borrowed'),
        (GIVEN, 'Given'),
    ]

    PENDING = 'PENDING'
    CLOSED = 'CLOSED'
    STATUS_CHOICES = [
        (PENDING, 'Pending'),
        (CLOSED, 'Closed'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    person_name = models.CharField(max_length=100, db_index=True)
    amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    status = models.CharField(
        max_length=10, 
        choices=STATUS_CHOICES, 
        default=PENDING,
        db_index=True
    )
    amount_settled = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    due_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    closed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
        ]

    def clean(self):
        """Model-level validation"""
        super().clean()
        
        # Validate amount_settled doesn't exceed amount
        if self.amount_settled > self.amount:
            raise ValidationError({
                'amount_settled': 'Settlement amount cannot exceed total amount'
            })
        
        # Prevent modification of closed debts (except through settlement)
        if self.pk:  # Only check for existing instances
            old_instance = Debt.objects.get(pk=self.pk)
            if old_instance.status == self.CLOSED and not self._allow_closed_update:
                raise ValidationError('Closed debts cannot be modified')
            
            # Prevent type changes after creation
            if old_instance.type != self.type:
                raise ValidationError({'type': 'Transaction type cannot be changed after creation'})

    def save(self, *args, **kwargs):
        # Allow closed update flag for settlement operations
        if not hasattr(self, '_allow_closed_update'):
            self._allow_closed_update = False
            
        # Auto-close when outstanding reaches zero
        if self.outstanding_amount == Decimal('0.00') and self.status == self.PENDING:
            self.status = self.CLOSED
            self.closed_at = timezone.now()
        
        # Set closed_at timestamp
        if self.status == self.CLOSED and not self.closed_at:
            self.closed_at = timezone.now()
        elif self.status == self.PENDING:
            self.closed_at = None
            
        super().save(*args, **kwargs)

    @property
    def outstanding_amount(self):
        """Calculate outstanding amount"""
        return self.amount - self.amount_settled

    @property
    def days_pending(self):
        """Calculate days since creation for pending debts"""
        if self.status == self.PENDING:
            delta = timezone.now() - self.created_at
            return delta.days
        return None

    def __str__(self):
        return f"{self.person_name} - ${self.amount}"


class Settlement(models.Model):
    """Track settlement history for complete audit trail"""
    debt = models.ForeignKey(Debt, related_name='settlements', on_delete=models.CASCADE)
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    settled_date = models.DateTimeField(auto_now_add=True, db_index=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['-settled_date']
        indexes = [
            models.Index(fields=['debt', 'settled_date']),
        ]

    def __str__(self):
        return f"Settlement of ${self.amount} for {self.debt.person_name}"
