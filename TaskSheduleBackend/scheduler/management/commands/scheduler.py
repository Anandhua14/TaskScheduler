import time
import random
from django.core.management.base import BaseCommand
from django.utils import timezone
from scheduler.models import Task, TaskExecutionLog
from croniter import croniter

BACKOFF_SCHEDULE = [1, 2, 4, 8, 16, 32, 64]  # exponential retry delays in seconds


class Command(BaseCommand):
    help = 'Runs the task scheduler loop.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS(' Scheduler started (Press Ctrl+C to exit).'))

        while True:
            now = timezone.now()
            self.stdout.write(f"\n⏰ Checking tasks at {now.strftime('%H:%M:%S')} ...")

            # Get all enabled tasks ordered by next run time
            all_tasks = Task.objects.filter(enabled=True).order_by('next_run_time')

            if not all_tasks.exists():
                self.stdout.write("⚠️  No active tasks found.")
                time.sleep(10)
                continue

            due_tasks = [t for t in all_tasks if t.next_run_time and t.next_run_time <= now]
            pending_tasks = [t for t in all_tasks if t.next_run_time and t.next_run_time > now]

            self.stdout.write(f"🟢 Due tasks: {len(due_tasks)}, ⏳ Pending tasks: {len(pending_tasks)}")

            # Reset pending task statuses if needed
            for task in pending_tasks:
                if task.status not in ['Pending', 'Running', 'Waiting']:
                    task.status = 'Pending'
                    task.save()

            # Handle due tasks
            for task in due_tasks:
                # 🔍 Dependency check
                if task.dependency:
                    parent_task = task.dependency
                    last_parent_log = (
                        TaskExecutionLog.objects.filter(task=parent_task)
                        .order_by('-finished_at')
                        .first()
                    )

                    if not last_parent_log:
                        self.stdout.write(f"⚠️  Skipping {task.name}: dependency '{parent_task.name}' has never run.")
                        continue

                    if last_parent_log.status != 'Success':
                        self.stdout.write(f"⛔ Skipping {task.name}: dependency '{parent_task.name}' not successful (last: {last_parent_log.status}).")
                        continue

                # Skip if already running
                if task.status == 'Running':
                    self.stdout.write(f"⏳ Skipping {task.name} (already running)")
                    continue

                # 🚀 Run task
                task.status = 'Running'
                task.last_run_time = now
                task.save()

                started_at = timezone.now()
                self.stdout.write(f"🚀 Running task: {task.name}")

                # Simulate random outcome
                outcome = random.choices(
                    ['Success', 'Failed', 'Retrying'],
                    weights=[0.5, 0.3, 0.2]
                )[0]

                finished_at = timezone.now()
                duration = (finished_at - started_at).total_seconds()

                if outcome == 'Success':
                    task.retry_count = 0
                    task.status = 'Success'
                    task.update_next_run_time()
                    message = ' Task completed successfully.'

                elif outcome == 'Retrying':
                    task.status = 'Retrying'
                    if task.retry_count < task.max_retries:
                        delay = BACKOFF_SCHEDULE[min(task.retry_count, len(BACKOFF_SCHEDULE) - 1)]
                        task.next_run_time = timezone.now() + timezone.timedelta(seconds=delay)
                        task.retry_count += 1
                        message = f" Retrying after {delay}s (retry {task.retry_count}/{task.max_retries})."
                    else:
                        task.status = 'Failed'
                        message = ' Max retries reached.'
                        task.update_next_run_time()

                else:  # Failed
                    task.status = 'Failed'
                    if task.retry_count < task.max_retries:
                        delay = BACKOFF_SCHEDULE[min(task.retry_count, len(BACKOFF_SCHEDULE) - 1)]
                        task.next_run_time = timezone.now() + timezone.timedelta(seconds=delay)
                        task.retry_count += 1
                        message = f"⚠️ Task failed. Will retry after {delay}s (retry {task.retry_count}/{task.max_retries})."
                    else:
                        message = ' Task failed and max retries reached.'
                        task.update_next_run_time()

                task.save()

                TaskExecutionLog.objects.create(
                    task=task,
                    started_at=started_at,
                    finished_at=finished_at,
                    duration_seconds=duration,
                    status=task.status,
                    message=message
                )

                self.stdout.write(f"📋 {task.name}: {task.status}. {message}")

            self.stdout.write("🕒 Waiting 10 seconds before next check...\n")
            time.sleep(10)
