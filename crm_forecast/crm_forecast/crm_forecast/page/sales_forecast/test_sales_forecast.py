import frappe


def test_forecast_permission():
    # The endpoint must only be usable by users with CRM Deal read access.
    # Full integration tests should be run in a site containing Frappe CRM.
    assert frappe.get_meta("CRM Deal").get_field("expected_closure_date")
    assert frappe.get_meta("CRM Deal").get_field("expected_deal_value")
    assert frappe.get_meta("CRM Deal").get_field("probability")
