from app.tasks.celery_app import celery_app


@celery_app.task(name="send_order_email_task")
def send_order_email_task(order_id: int, user_id: int) -> str:
    # Placeholder for email provider integration.
    return f"Queued confirmation email for order={order_id} user={user_id}"


@celery_app.task(name="generate_order_summary_task")
def generate_order_summary_task(order_id: int, user_id: int, total_amount: float) -> str:
    # Placeholder for heavy analytical processing.
    return (
        f"Generated summary for order={order_id} user={user_id} "
        f"total_amount={total_amount:.2f}"
    )


@celery_app.task(name="notify_admin_new_order_task")
def notify_admin_new_order_task(order_id: int, user_id: int, total_amount: float) -> str:
    # Placeholder for admin notification workflow.
    return (
        f"Notified admin about order={order_id} user={user_id} "
        f"total_amount={total_amount:.2f}"
    )
