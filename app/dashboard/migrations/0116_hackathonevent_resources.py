# Generated by Django 2.2.4 on 2020-05-27 13:17

import django.contrib.postgres.fields
import django.contrib.postgres.fields.jsonb
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('dashboard', '0115_merge_20200527_0856'),
    ]

    operations = [
        migrations.AddField(
            model_name='hackathonevent',
            name='resources',
            field=django.contrib.postgres.fields.ArrayField(base_field=django.contrib.postgres.fields.jsonb.JSONField(blank=True, default=dict, null=True), blank=True, default=list, size=None),
        ),
    ]
