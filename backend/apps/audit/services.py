from .models import AuditLog


def record(*, brand, actor, action, target=None, metadata=None, request=None) -> AuditLog:
    ip = None
    if request is not None:
        ip = request.META.get("REMOTE_ADDR")
    return AuditLog.objects.create(
        brand=brand,
        actor=actor,
        action=action,
        target_type=type(target).__name__ if target is not None else "",
        target_id=getattr(target, "public_id", "") if target is not None else "",
        metadata=metadata or {},
        ip_address=ip,
    )
