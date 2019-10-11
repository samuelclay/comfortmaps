from django.contrib import admin
from .models import Snapshot
from .models import SnapshotRatingScale

admin.site.register(Snapshot)
admin.site.register(SnapshotRatingScale)
