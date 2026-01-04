from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from finance.views import CategoryViewSet, ItemViewSet, DailyExpenseViewSet
from debts.views import DebtViewSet
from emis.views import EMIViewSet, InstallmentViewSet

router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'items', ItemViewSet, basename='item')
router.register(r'daily-expenses', DailyExpenseViewSet, basename='daily-expense')
router.register(r'debts', DebtViewSet, basename='debt')
router.register(r'emis', EMIViewSet, basename='emi')
router.register(r'installments', InstallmentViewSet, basename='installment')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('core.urls')),
    path('api/', include(router.urls)),
]
