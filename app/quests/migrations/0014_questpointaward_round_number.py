# Generated by Django 2.2.3 on 2019-10-22 18:19

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('quests', '0013_questpointaward_action'),
    ]

    operations = [
        migrations.AddField(
            model_name='questpointaward',
            name='round_number',
            field=models.IntegerField(default=1),
        ),
    ]
