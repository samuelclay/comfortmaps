# Generated by Django 2.2.6 on 2020-02-20 22:58

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('records', '0002_initial_scale'),
    ]

    operations = [
        migrations.AddField(
            model_name='snapshot',
            name='photo_id',
            field=models.TextField(default='missing', max_length=32),
            preserve_default=False,
        ),
    ]
