# Generated by Django 3.0.3 on 2020-04-08 17:54

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('records', '0006_data_photo_uploaded'),
    ]

    operations = [
        migrations.AddField(
            model_name='snapshot',
            name='width',
            field=models.IntegerField(default=488),
        ),
    ]
