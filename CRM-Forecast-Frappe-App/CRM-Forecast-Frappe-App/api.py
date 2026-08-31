import frappe
from frappe import _


def _open_statuses():
    """Return CRM Deal Status names that represent an open pipeline."""
    statuses = frappe.get_all(
        "CRM Deal Status",
        fields=["name", "type"],
        order_by="position asc, name asc",
    )
    return [s.name for s in statuses if s.type not in ("Won", "Lost")]


def _month_start(value):
    return frappe.utils.getdate(value).replace(day=1)


@frappe.whitelist()
def get_forecast(start_date=None, months=6, owner=None):
    """
    Return open CRM Deals grouped by expected_closure_date month.

    Permissions are enforced through frappe.get_list("CRM Deal").
    """
    if not frappe.has_permission("CRM Deal", ptype="read"):
        frappe.throw(_("You do not have permission to view CRM Deals."), frappe.PermissionError)

    today = frappe.utils.getdate()
    start = _month_start(start_date or today)
    months = max(1, min(int(months or 6), 24))
    end = frappe.utils.add_months(start, months)

    filters = [
        ["expected_closure_date", ">=", start],
        ["expected_closure_date", "<", end],
    ]

    open_statuses = _open_statuses()
    if open_statuses:
        filters.append(["status", "in", open_statuses])

    if owner:
        filters.append(["deal_owner", "=", owner])

    fields = [
        "name",
        "organization",
        "expected_deal_value",
        "probability",
        "expected_closure_date",
        "status",
        "deal_owner",
        "currency",
    ]

    deals = frappe.get_list(
        "CRM Deal",
        filters=filters,
        fields=fields,
        order_by="expected_closure_date asc, modified desc",
        limit_page_length=0,
    )

    # Return owner choices from records the current user can read.
    owners = sorted(
        {
            d.deal_owner
            for d in frappe.get_list(
                "CRM Deal",
                fields=["deal_owner"],
                filters=(
                    [["status", "in", open_statuses]]
                    if open_statuses
                    else []
                ),
                limit_page_length=0,
            )
            if d.deal_owner
        }
    )

    return {
        "start_date": str(start),
        "end_date": str(end),
        "months": months,
        "deals": deals,
        "owners": owners,
    }
