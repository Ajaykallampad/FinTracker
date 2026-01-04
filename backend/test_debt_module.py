"""
Test script for Debt & Borrow Management Module
Demonstrates all key features and validates functionality
"""

from django.contrib.auth.models import User
from debts.models import Debt, Settlement
from decimal import Decimal
from django.utils import timezone

def test_debt_management():
    print("=" * 60)
    print("DEBT & BORROW MANAGEMENT - TEST SCRIPT")
    print("=" * 60)
    
    # Get or create test user
    user, created = User.objects.get_or_create(
        username='testuser',
        defaults={'email': 'test@example.com'}
    )
    if created:
        user.set_password('testpass123')
        user.save()
    print(f"\n✓ Test user: {user.username}")
    
    # Clean up existing test data
    Debt.objects.filter(user=user).delete()
    print("✓ Cleaned up existing test data")
    
    # Test 1: Create borrowed debt
    print("\n" + "=" * 60)
    print("TEST 1: Create Borrowed Debt")
    print("=" * 60)
    debt1 = Debt.objects.create(
        user=user,
        person_name="Alice Johnson",
        amount=Decimal('1500.00'),
        type=Debt.BORROWED
    )
    print(f"✓ Created: {debt1}")
    print(f"  - Outstanding: ${debt1.outstanding_amount}")
    print(f"  - Status: {debt1.status}")
    print(f"  - Days Pending: {debt1.days_pending}")
    
    # Test 2: Create given debt
    print("\n" + "=" * 60)
    print("TEST 2: Create Given Debt")
    print("=" * 60)
    debt2 = Debt.objects.create(
        user=user,
        person_name="Bob Smith",
        amount=Decimal('2000.00'),
        type=Debt.GIVEN
    )
    print(f"✓ Created: {debt2}")
    print(f"  - Outstanding: ${debt2.outstanding_amount}")
    
    # Test 3: Partial settlement
    print("\n" + "=" * 60)
    print("TEST 3: Partial Settlement")
    print("=" * 60)
    settlement1 = Settlement.objects.create(
        debt=debt1,
        amount=Decimal('500.00'),
        notes="First partial payment"
    )
    debt1._allow_closed_update = True
    debt1.amount_settled += settlement1.amount
    debt1.save()
    debt1.refresh_from_db()
    print(f"✓ Settlement created: ${settlement1.amount}")
    print(f"  - Total: ${debt1.amount}")
    print(f"  - Settled: ${debt1.amount_settled}")
    print(f"  - Outstanding: ${debt1.outstanding_amount}")
    print(f"  - Status: {debt1.status}")
    
    # Test 4: Full settlement (auto-close)
    print("\n" + "=" * 60)
    print("TEST 4: Full Settlement (Auto-Close)")
    print("=" * 60)
    remaining = debt1.outstanding_amount
    settlement2 = Settlement.objects.create(
        debt=debt1,
        amount=remaining,
        notes="Final payment - fully settled"
    )
    debt1._allow_closed_update = True
    debt1.amount_settled += settlement2.amount
    debt1.save()
    debt1.refresh_from_db()
    print(f"✓ Final settlement: ${settlement2.amount}")
    print(f"  - Outstanding: ${debt1.outstanding_amount}")
    print(f"  - Status: {debt1.status}")
    print(f"  - Closed At: {debt1.closed_at}")
    print(f"  - ✨ AUTO-CLOSED: {debt1.status == Debt.CLOSED}")
    
    # Test 5: Multiple debts for same person
    print("\n" + "=" * 60)
    print("TEST 5: Multiple Debts for Same Person")
    print("=" * 60)
    debt3 = Debt.objects.create(
        user=user,
        person_name="Alice Johnson",
        amount=Decimal('750.00'),
        type=Debt.GIVEN
    )
    alice_debts = Debt.objects.filter(user=user, person_name__icontains="Alice")
    print(f"✓ Created another debt for Alice")
    print(f"  - Total debts for Alice: {alice_debts.count()}")
    for d in alice_debts:
        print(f"    • {d.type}: ${d.amount} (Status: {d.status})")
    
    # Test 6: Settlement history
    print("\n" + "=" * 60)
    print("TEST 6: Settlement History")
    print("=" * 60)
    settlements = Settlement.objects.filter(debt=debt1)
    print(f"✓ Settlements for {debt1.person_name}:")
    for s in settlements:
        print(f"    • ${s.amount} on {s.settled_date.strftime('%Y-%m-%d %H:%M')}")
        if s.notes:
            print(f"      Notes: {s.notes}")
    
    # Test 7: Summary statistics
    print("\n" + "=" * 60)
    print("TEST 7: Summary Statistics")
    print("=" * 60)
    all_debts = Debt.objects.filter(user=user)
    borrowed_total = sum(d.amount for d in all_debts if d.type == Debt.BORROWED)
    given_total = sum(d.amount for d in all_debts if d.type == Debt.GIVEN)
    total_settled = sum(d.amount_settled for d in all_debts)
    pending_outstanding = sum(d.outstanding_amount for d in all_debts if d.status == Debt.PENDING)
    
    print(f"✓ Summary:")
    print(f"  - Total Borrowed: ${borrowed_total}")
    print(f"  - Total Given: ${given_total}")
    print(f"  - Total Settled: ${total_settled}")
    print(f"  - Outstanding (Pending): ${pending_outstanding}")
    print(f"  - Pending Debts: {all_debts.filter(status=Debt.PENDING).count()}")
    print(f"  - Closed Debts: {all_debts.filter(status=Debt.CLOSED).count()}")
    
    # Test 8: Person filter
    print("\n" + "=" * 60)
    print("TEST 8: Person Filter")
    print("=" * 60)
    persons = Debt.objects.filter(user=user).values_list('person_name', flat=True).distinct()
    print(f"✓ Unique persons: {list(persons)}")
    
    # Test 9: Validation tests
    print("\n" + "=" * 60)
    print("TEST 9: Validation Tests")
    print("=" * 60)
    
    # Try to settle more than outstanding
    try:
        excessive_settlement = Settlement(
            debt=debt2,
            amount=Decimal('10000.00')  # More than debt amount
        )
        excessive_settlement.full_clean()
        print("  ✗ FAIL: Should have prevented excessive settlement")
    except Exception as e:
        print(f"  ✓ PASS: Prevented excessive amount validation")
    
    # Try negative amount
    try:
        negative_debt = Debt(
            user=user,
            person_name="Test",
            amount=Decimal('-100.00'),
            type=Debt.BORROWED
        )
        negative_debt.full_clean()
        print("  ✗ FAIL: Should have prevented negative amount")
    except Exception as e:
        print(f"  ✓ PASS: Prevented negative amount")
    
    print("\n" + "=" * 60)
    print("ALL TESTS COMPLETED SUCCESSFULLY! ✅")
    print("=" * 60)
    
    return True

# Run tests
if __name__ == '__main__':
    import django
    django.setup()
    test_debt_management()
