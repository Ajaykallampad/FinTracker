from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, Q, Count
from django.db import transaction
from decimal import Decimal
from .models import Debt, Settlement
from .serializers import DebtSerializer, DebtListSerializer, SettlementSerializer
from datetime import datetime


class DebtViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        """Use optimized serializer for list views"""
        if self.action == 'list':
            return DebtListSerializer
        return DebtSerializer

    def get_queryset(self):
        """Base queryset with user filtering"""
        queryset = Debt.objects.filter(user=self.request.user)
        
        # Apply person filter if provided
        person = self.request.query_params.get('person', None)
        if person:
            queryset = queryset.filter(person_name__icontains=person)
        
        # Apply status filter if provided
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset

    def list(self, request, *args, **kwargs):
        """Custom list with sorting by outstanding amount for pending"""
        queryset = self.get_queryset()
        
        # Sort pending by highest outstanding, others by created_at
        pending_debts = queryset.filter(status=Debt.PENDING).order_by('-amount_settled', '-created_at')
        closed_debts = queryset.filter(status=Debt.CLOSED).order_by('-closed_at')
        
        # Combine querysets
        combined = list(pending_debts) + list(closed_debts)
        
        serializer = self.get_serializer(combined, many=True)
        return Response({'results': serializer.data})

    def perform_create(self, serializer):
        """Auto-assign user on creation"""
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Get only pending debts, sorted by highest outstanding"""
        queryset = self.get_queryset().filter(status=Debt.PENDING)
        
        # Sort by outstanding amount (descending) - we need to calculate it
        debts = list(queryset)
        debts.sort(key=lambda d: d.outstanding_amount, reverse=True)
        
        serializer = DebtListSerializer(debts, many=True)
        
        # Calculate total outstanding
        total_outstanding = sum(d.outstanding_amount for d in debts)
        
        return Response({
            'count': len(debts),
            'total_outstanding': float(total_outstanding),
            'results': serializer.data
        })

    @action(detail=False, methods=['get'])
    def closed(self, request):
        """Get closed debts grouped by month"""
        queryset = self.get_queryset().filter(status=Debt.CLOSED).order_by('-closed_at')
        
        # Group by month
        groups = {}
        for debt in queryset:
            if debt.closed_at:
                month_key = debt.closed_at.strftime('%Y-%m')
                month_display = debt.closed_at.strftime('%B %Y')
                
                if month_key not in groups:
                    groups[month_key] = {
                        'month': month_key,
                        'month_display': month_display,
                        'debts': [],
                        'count': 0
                    }
                
                groups[month_key]['debts'].append(debt)
                groups[month_key]['count'] += 1
        
        # Convert to list and serialize
        result = []
        for month_key in sorted(groups.keys(), reverse=True):
            group = groups[month_key]
            group['debts'] = DebtListSerializer(group['debts'], many=True).data
            result.append(group)
        
        return Response({'groups': result})

    @action(detail=True, methods=['post'])
    def settle(self, request, pk=None):
        """Partially or fully settle a debt"""
        debt = self.get_object()
        
        # Validate debt is pending
        if debt.status == Debt.CLOSED:
            return Response(
                {'error': 'Cannot settle a closed debt'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get settlement amount from request
        settlement_amount = request.data.get('amount')
        notes = request.data.get('notes', '')
        
        try:
            settlement_amount = Decimal(str(settlement_amount))
        except (ValueError, TypeError, KeyError):
            return Response(
                {'error': 'Invalid settlement amount'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate settlement amount
        if settlement_amount <= 0:
            return Response(
                {'error': 'Settlement amount must be positive'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if settlement_amount > debt.outstanding_amount:
            return Response(
                {'error': f'Settlement amount exceeds outstanding balance of ${debt.outstanding_amount}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Perform atomic settlement
        with transaction.atomic():
            # Lock the debt row to prevent race conditions
            debt = Debt.objects.select_for_update().get(pk=pk, user=request.user)
            
            # Create settlement record
            Settlement.objects.create(
                debt=debt,
                amount=settlement_amount,
                notes=notes
            )
            
            # Update debt
            debt._allow_closed_update = True
            debt.amount_settled += settlement_amount
            debt.save()  # Auto-closure happens in save() method
        
        # Refresh and return updated debt
        debt.refresh_from_db()
        serializer = DebtSerializer(debt)
        
        response_data = {
            'message': 'Debt fully settled and closed' if debt.status == Debt.CLOSED else 'Partial settlement recorded',
            'debt': serializer.data
        }
        
        return Response(response_data)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Enhanced summary with person filter support"""
        queryset = self.get_queryset()
        
        # Total borrowed and given
        borrowed_total = queryset.filter(type=Debt.BORROWED).aggregate(
            total=Sum('amount')
        )['total'] or Decimal('0.00')
        
        given_total = queryset.filter(type=Debt.GIVEN).aggregate(
            total=Sum('amount')
        )['total'] or Decimal('0.00')
        
        # Total settled (across all debts)
        total_settled = queryset.aggregate(
            total=Sum('amount_settled')
        )['total'] or Decimal('0.00')
        
        # Calculate total outstanding (sum of all outstanding amounts)
        pending_debts = queryset.filter(status=Debt.PENDING)
        total_outstanding = sum(debt.outstanding_amount for debt in pending_debts)
        
        # Breakdown by type and status
        borrowed_pending = queryset.filter(
            type=Debt.BORROWED, status=Debt.PENDING
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        
        borrowed_settled_amount = queryset.filter(
            type=Debt.BORROWED
        ).aggregate(total=Sum('amount_settled'))['total'] or Decimal('0.00')
        
        given_pending = queryset.filter(
            type=Debt.GIVEN, status=Debt.PENDING
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        
        given_settled_amount = queryset.filter(
            type=Debt.GIVEN
        ).aggregate(total=Sum('amount_settled'))['total'] or Decimal('0.00')
        
        return Response({
            'total_borrowed': float(borrowed_total),
            'total_given': float(given_total),
            'total_outstanding': float(total_outstanding),
            'total_settled': float(total_settled),
            'borrowed_breakdown': {
                'pending': float(borrowed_pending),
                'settled': float(borrowed_settled_amount)
            },
            'given_breakdown': {
                'pending': float(given_pending),
                'settled': float(given_settled_amount)
            }
        })

    @action(detail=False, methods=['get'])
    def persons(self, request):
        """Get unique person names for filter dropdown"""
        persons = Debt.objects.filter(
            user=request.user
        ).values_list('person_name', flat=True).distinct().order_by('person_name')
        
        return Response({'persons': list(persons)})
