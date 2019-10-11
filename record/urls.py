from django.urls import path

from . import views

urlpatterns = [
    path('', views.record_snapshot, name='record_snapshot'),
    path('login', views.login, name='login'),
]