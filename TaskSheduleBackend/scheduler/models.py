from django.db import models
from django.utils import timezone
from croniter import croniter

import random

TASK_STATUS_CHOICES = [
    ("Pending", "Pending"),
    ("Running", "Running"),
    ("Success", "Success"),
    ("Failed", "Failed"),
    ("Retrying", "Retrying"),
]

class Task(models.Model):
    name = models.CharField(max_length=255)
    task_type = models.CharField(max_length=100)
    cron_expression = models.CharField(max_length=100)
    
    #  Dependency (self-referential)
    dependency = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='dependents'
    )

    status = models.CharField(
        max_length=10,
        choices=TASK_STATUS_CHOICES,
        default="Pending"
    )
    enabled = models.BooleanField(default=True)
    retry_count = models.PositiveIntegerField(default=0)
    max_retries = models.PositiveIntegerField(default=3)
    last_run_time = models.DateTimeField(null=True, blank=True)
    next_run_time = models.DateTimeField(null=True, blank=True)
    
    #  New: Track creation time
    created_at = models.DateTimeField(default=timezone.now)

    def update_next_run_time(self, from_time=None):
        base_time = from_time or timezone.now()
        try:
            self.next_run_time = croniter(self.cron_expression, base_time).get_next(timezone.datetime)
        except Exception:
            self.next_run_time = None
        self.save()

    def __str__(self):
        return self.name

    #  Optional: Prevent circular dependency
    def clean(self):
        if self.dependency == self:
            raise ValidationError("A task cannot depend on itself.")
        # Prevent indirect circular dependencies
        parent = self.dependency
        while parent:
            if parent == self:
                raise ValidationError("Circular dependency detected.")
            parent = parent.dependency


class TaskExecutionLog(models.Model):
    STATUS_CHOICES = TASK_STATUS_CHOICES

    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='logs')
    started_at = models.DateTimeField()
    finished_at = models.DateTimeField()
    duration_seconds = models.FloatField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES)
    message = models.TextField(blank=True)

    def __str__(self):
        return f"{self.task.name} at {self.started_at}: {self.status}"
