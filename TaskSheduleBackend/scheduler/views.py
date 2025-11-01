import random
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db.models import Min
from .models import Task, TaskExecutionLog
from .serializers import TaskSerializer, TaskExecutionLogSerializer


#  List + Create Tasks
class TaskListCreateView(generics.ListCreateAPIView):
    queryset = Task.objects.all().order_by('-created_at')
    serializer_class = TaskSerializer


#  Retrieve + Update + Delete Single Task
class TaskRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer


#  Enable / Disable (toggle) a task
class TaskToggleView(APIView):
    def post(self, request, pk):
        try:
            task = Task.objects.get(pk=pk)
        except Task.DoesNotExist:
            return Response({'error': 'Task not found'}, status=status.HTTP_404_NOT_FOUND)

        task.enabled = not task.enabled
        task.save()
        return Response({'id': task.id, 'enabled': task.enabled}, status=status.HTTP_200_OK)


#  Get all execution logs
class TaskExecutionLogListView(generics.ListAPIView):
    queryset = TaskExecutionLog.objects.all().select_related('task').order_by('-started_at')
    serializer_class = TaskExecutionLogSerializer


#  Manual “Run Now” API
@api_view(["POST"])
def run_task_now(request, pk):
    """
    Run a task immediately, respecting dependency rules and updating logs.
    """
    try:
        task = Task.objects.get(pk=pk)
    except Task.DoesNotExist:
        return Response({"error": "Task not found"}, status=status.HTTP_404_NOT_FOUND)

    #  Check if dependency task exists and has succeeded
    if task.dependency:
        last_parent_log = (
            TaskExecutionLog.objects.filter(task=task.dependency)
            .order_by('-finished_at')
            .first()
        )
        if not last_parent_log or last_parent_log.status != 'Success':
            return Response(
                {"error": f"Dependency '{task.dependency.name}' not successful yet."},
                status=status.HTTP_400_BAD_REQUEST
            )

    #  Simulate execution
    started_at = timezone.now()
    outcome = random.choices(
        ['Success', 'Failed', 'Retrying'],
        weights=[0.6, 0.25, 0.15]
    )[0]
    finished_at = timezone.now()
    duration = (finished_at - started_at).total_seconds()

    #  Update Task State
    if outcome == 'Success':
        task.retry_count = 0
        task.status = 'Success'
        task.update_next_run_time()
        message = ' Task executed successfully.'
    elif outcome == 'Retrying':
        task.status = 'Retrying'
        task.retry_count += 1
        task.next_run_time = timezone.now() + timezone.timedelta(seconds=10)
        message = f" Retrying after 10s (retry {task.retry_count}/{task.max_retries})."
    else:
        task.status = 'Failed'
        message = ' Task failed.'
        task.update_next_run_time()

    task.last_run_time = timezone.now()
    task.save()

    #  Create Execution Log
    TaskExecutionLog.objects.create(
        task=task,
        started_at=started_at,
        finished_at=finished_at,
        duration_seconds=duration,
        status=task.status,
        message=message
    )

    #  Return response
    return Response({
        "id": task.id,
        "name": task.name,
        "status": task.status,
        "message": message,
        "next_run_time": task.next_run_time,
    }, status=status.HTTP_200_OK)


#  Stats Endpoint (Dashboard)
class StatsView(APIView):
    def get(self, request):
        total_tasks = Task.objects.count()
        success_count = TaskExecutionLog.objects.filter(status='Success').count()
        fail_count = TaskExecutionLog.objects.filter(status='Failed').count()
        retry_count = TaskExecutionLog.objects.filter(status='Retrying').count()
        pending_count = TaskExecutionLog.objects.filter(status='Pending').count()
        upcoming = Task.objects.filter(
            enabled=True,
            next_run_time__gt=timezone.now()
        ).order_by('next_run_time').aggregate(next_run=Min('next_run_time'))

        return Response({
            'total_tasks': total_tasks,
            'success_count': success_count,
            'fail_count': fail_count,
            'retry_count': retry_count,
            'pending_count': pending_count,
            'next_scheduled_run': upcoming['next_run']
        })
