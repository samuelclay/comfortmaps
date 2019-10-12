from django.urls import path

from . import views

urlpatterns = [
    path('', views.rating_scale, name='rating-scale'),
    path('snapshot/', views.record_snapshot, name='record-snapshot'),
]