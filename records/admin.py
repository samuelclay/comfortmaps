from django.contrib import admin
from .models import Snapshot
from .models import SnapshotRatingScale
from .models import UserSession

admin.site.register(Snapshot)
admin.site.register(SnapshotRatingScale)
admin.site.register(UserSession)
