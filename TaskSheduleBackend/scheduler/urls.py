from django.urls import path
from .views import (
    TaskListCreateView, TaskRetrieveUpdateDestroyView, TaskToggleView, TaskExecutionLogListView, StatsView,run_task_now,
)

urlpatterns = [
    path('tasks/', TaskListCreateView.as_view()),
    path('tasks/<int:pk>/', TaskRetrieveUpdateDestroyView.as_view()),
    path('tasks/<int:pk>/toggle/', TaskToggleView.as_view()),
    path('tasks/<int:pk>/run/', run_task_now, name='task-run'),
    path('logs/', TaskExecutionLogListView.as_view()),
    path('stats/', StatsView.as_view()),
]

