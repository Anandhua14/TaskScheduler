# Task Scheduler System (Django Backend)

A full-featured Django backend for managing and executing scheduled tasks with cron expressions, dependency resolution, retries with exponential backoff, and RESTful APIs for controlling tasks and logs.

## Features
- Create, edit, delete, enable/disable, and view scheduled tasks with cron syntax
- Support for task dependencies (tasks only run if parent succeeds)
- Status tracking: Pending, Running, Success, Failed, Retrying
- Exponential backoff retries on failure (1, 2, 4, 8... minutes)
- Execution log for every run with timing, outcome, and messages
- APIs to manage tasks, logs, and get system stats/metrics
- Scheduler run loop via a Django management command

## Setup
1. **Clone/download this repository**

2. **Create and activate a virtual environment:**
    - Windows:
      ```
      python -m venv venv
      venv\Scripts\activate
      ```
    - Linux/macOS:
      ```
      python3 -m venv venv
      source venv/bin/activate
      ```

3. **Install dependencies:**
    ```
    pip install django djangorestframework croniter
    ```

4. **Run migrations:**
    ```
    python manage.py migrate
    ```

5. **Create superuser (optional, for Django admin):**
    ```
    python manage.py createsuperuser
    ```

## API Usage

| Endpoint                    | Methods       | Description                                  |
|----------------------------|--------------|----------------------------------------------|
| `/api/tasks/`               | GET, POST     | List or create scheduled tasks               |
| `/api/tasks/{id}/`          | GET, PUT, DELETE | Retrieve, update, or delete a task       |
| `/api/tasks/{id}/toggle/`   | POST          | Enable/disable a scheduled task              |
| `/api/logs/`                | GET           | List execution logs                          |
| `/api/stats/`               | GET           | System/task stats (success, fail, next run)  |

All endpoints accept and return JSON. See model fields in `scheduler/models.py` for all available fields for tasks and logs.

## Running the Scheduler

Start the scheduling loop (runs due tasks every minute):

```
python manage.py run_scheduler
```

- The scheduler executes due tasks (based on cron expressions, dependencies, and status).
- Handles random status (Pending, Running, Success, Failed, Retrying) for demonstration.
- Retries are managed automatically with exponential delays.
- All activity is logged and can be accessed from `/api/logs/` or the admin site.

## Django Admin
- Visit `/admin/` to manage tasks and view logs using Django admin interface (after creating a superuser).

## Customization
- Cron logic is implemented using `croniter` (see `Task.update_next_run_time`).
- Retry policy and outcomes can be adjusted in `run_scheduler.py`.

## License
MIT
