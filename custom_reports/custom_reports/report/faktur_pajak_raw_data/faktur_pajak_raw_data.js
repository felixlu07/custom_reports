frappe.query_reports["Faktur Pajak Raw Data"] = {
	"filters": [
		{
			"fieldname":"date_from",
			"label": __("Date From"),
			"fieldtype": "Date",
			"default": frappe.datetime.add_months(frappe.datetime.nowdate(), -2),
			"reqd": 1
		},
		{
			"fieldname":"date_to",
			"label": __("Date To"),
			"fieldtype": "Date",
			"default": frappe.datetime.nowdate(),
			"reqd": 1
		}
	],
	"onload": function(report) {
		report.page.add_action_item(__("Reconcile Rows"), async function() {
			console.log("Reconcile Rows button clicked");
		});
	}
}
