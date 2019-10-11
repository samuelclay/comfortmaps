# Generated by Django 2.2.6 on 2019-10-11 03:19

import datetime
from django.conf import settings
import django.contrib.postgres.fields
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='SnapshotRatingScale',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('names', django.contrib.postgres.fields.ArrayField(base_field=models.CharField(max_length=1024), size=None)),
                ('values', django.contrib.postgres.fields.ArrayField(base_field=models.CharField(max_length=1024), size=None)),
            ],
        ),
        migrations.CreateModel(
            name='UserSession',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('session_id', models.CharField(max_length=1024)),
                ('last_seen', models.DateTimeField(default=datetime.datetime.now, verbose_name='date session last seen')),
                ('date', models.DateTimeField(default=datetime.datetime.now, verbose_name='date session created')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='Snapshot',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('rating', models.IntegerField()),
                ('date', models.DateTimeField(default=datetime.datetime.now, verbose_name='date snapshot taken')),
                ('rating_scale', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='record.SnapshotRatingScale')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
