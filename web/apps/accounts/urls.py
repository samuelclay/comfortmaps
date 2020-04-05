from django.urls import path

from . import views

urlpatterns = [
    path('login/', views.login_user, name='login'),
    path('login_ajax/', views.login_user_ajax, name='login-ajax'),
]
