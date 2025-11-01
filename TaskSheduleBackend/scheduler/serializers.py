from rest_framework import serializers
from .models import Task, TaskExecutionLog
from croniter import croniter
from django.utils import timezone

class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = '__all__'

    def validate_cron_expression(self, value):
        if not croniter.is_valid(value):
            raise serializers.ValidationError('Invalid cron expression')
        return value

    def create(self, validated_data):
        task = super().create(validated_data)
        # compute next_run_time on creation
        task.update_next_run_time(from_time=timezone.now())
        return task

    def update(self, instance, validated_data):
        cron_changed = 'cron_expression' in validated_data and validated_data['cron_expression'] != instance.cron_expression
        task = super().update(instance, validated_data)
        if cron_changed or task.next_run_time is None:
            task.update_next_run_time(from_time=timezone.now())
        return task

class TaskExecutionLogSerializer(serializers.ModelSerializer):
    task_name = serializers.CharField(source='task.name', read_only=True)

    class Meta:
        model = TaskExecutionLog
        fields = '__all__'

