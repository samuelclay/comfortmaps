from django.urls import path

from . import views

urlpatterns = [
    path('', views.rating_scale, name='rating-scale'),
    path('snapshot/', views.record_snapshot, name='record-snapshot'),
    path('snapshot/photo/<slug:photo_id>/', views.record_photo, name='record-photo'),
    path('map/', views.map, name='map'),
    path('snapshots_from_point.<slug:format>', views.snapshots_from_point, name='snapshots-from-point'),
]