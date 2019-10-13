from django.contrib.gis.admin import OSMGeoAdmin
from django.contrib import admin
from .models import Snapshot
from .models import SnapshotRatingScale

@admin.register(Snapshot)
class SnapshotAdmin(OSMGeoAdmin):
    list_display = ('user', 'location')
    
# admin.site.register(Snapshot)
admin.site.register(SnapshotRatingScale)
