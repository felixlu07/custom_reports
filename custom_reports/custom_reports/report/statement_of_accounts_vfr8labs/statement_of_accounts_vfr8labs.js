// Copyright (c) 2018, Frappe Technologies Pvt. Ltd. and Contributors
// License: GNU General Public License v3. See license.txt

frappe.query_reports["Statement of Accounts vFr8labs"] = {
	"filters": [
		{
			"fieldname": "report_date",
			"label": __("Posting Date"),
			"fieldtype": "Date",
			"default": frappe.datetime.get_today()
		},

	
		
		{
			"fieldname": "ageing_based_on",
			"label": __("Ageing Based On"),
			"fieldtype": "Select",
			"options": 'Posting Date\nDue Date',
			"default": "Due Date"
		},
		{
			"fieldname": "range1",
			"label": __("Ageing Range 1"),
			"fieldtype": "Int",
			"default": "30",
			"reqd": 1
		},
		{
			"fieldname": "range2",
			"label": __("Ageing Range 2"),
			"fieldtype": "Int",
			"default": "60",
			"reqd": 1
		},
		{
			"fieldname": "range3",
			"label": __("Ageing Range 3"),
			"fieldtype": "Int",
			"default": "90",
			"reqd": 1
		},
		{
			"fieldname": "range4",
			"label": __("Ageing Range 4"),
			"fieldtype": "Int",
			"default": "120",
			"reqd": 1
		},
		{
			"fieldname":"company",
			"label": __("Company"),
			"fieldtype": "Link",
			"options": "Company",
			"default": frappe.defaults.get_user_default("Company"),
			"reqd": 1
		},
		{
			"fieldname":"finance_book",
			"label": __("Finance Book"),
			"fieldtype": "Link",
			"options": "Finance Book"
		},
		{
			"fieldname":"from_date",
			"label": __("From Date"),
			"fieldtype": "Date",
			"default": frappe.datetime.add_months(frappe.datetime.get_today(), -1),
			"reqd": 1,
			"width": "60px"
		},
		{
			"fieldname":"to_date",
			"label": __("To Date"),
			"fieldtype": "Date",
			"default": frappe.datetime.get_today(),
			"reqd": 1,
			"width": "60px"
		},
		{
			"fieldname":"account",
			"label": __("Account"),
			"fieldtype": "MultiSelectList",
			"options": "Account",
			get_data: function(txt) {
				return frappe.db.get_link_options('Account', txt, {
					company: frappe.query_report.get_filter_value("company")
				});
			}
		},
		{
			"fieldname":"voucher_no",
			"label": __("Voucher No"),
			"fieldtype": "Data",
			on_change: function() {
				frappe.query_report.set_filter_value('group_by', "Group by Voucher (Consolidated)");
			}
		},
		{
			"fieldtype": "Break",
		},
		{
			"fieldname":"party_type",
			"label": __("Party Type"),
			"fieldtype": "Link",
			"options": "Party Type",
			"default": "Customer"
			// on_change: function() {
			// 	frappe.query_report.set_filter_value('party', "");
			// }
		},
		{
			"fieldname": "party",
			"label": __("Party"),
			"fieldtype": "Link",
			"options": "Customer",
		
			
			// get_data: function(txt) {
			// 	if (!frappe.query_report.filters) return;
			
			// 	let party_type = frappe.query_report.get_filter_value('party_type');
			// 	console.log("Party Type:", party_type);
			// 	if (!party_type) return;
			
			// 	return frappe.db.get_link_options(party_type, txt);
			// },
			
			
			on_change: function() {
				
				var party_type = frappe.query_report.get_filter_value('party_type');
				var party = frappe.query_report.get_filter_value('party');
			
				if (!party_type || !party) {
					frappe.query_report.set_filter_value('party_name', "");
					frappe.query_report.set_filter_value('tax_id', "");
					return;
				} else {
					var fieldname = erpnext.utils.get_party_name(party_type) || "name";
					frappe.db.get_value(party_type, party, fieldname, function(value) {
						frappe.query_report.set_filter_value('party_name', value[fieldname]);
						frappe.db.get_value("Customer", party, "customer_primary_address", function(addr_value) {
							frappe.query_report.set_filter_value('party_address', addr_value["customer_primary_address"]);
						}); // add the missing closing parenthesis here
					});
					if (party_type === "Customer" || party_type === "Supplier") {
						frappe.db.get_value(party_type, party, "tax_id", function(value) {
							frappe.query_report.set_filter_value('tax_id', value["tax_id"]);
						});
					}
				
			}
		}},
		{
			"fieldname":"party_name",
			"label": __("Party Name"),
			"fieldtype": "Data",		
			"hidden": 0
		},
		{
			"fieldname":"party_address",
			"label": __("Party Address"),
			"fieldtype": "Data",		
			"hidden": 0
		},
		{
			"fieldname":"group_by",
			"label": __("Group by"),
			"fieldtype": "Select",
			"options": [
				"",
				{
					label: __("Group by Voucher"),
					value: "Group by Voucher",
				},
				{
					label: __("Group by Voucher (Consolidated)"),
					value: "Group by Voucher (Consolidated)",
				},
				{
					label: __("Group by Account"),
					value: "Group by Account",
				},
				{
					label: __("Group by Party"),
					value: "Group by Party",
				},
			],
			"default": "Group by Voucher (Consolidated)"
		},
		{
			"fieldname":"tax_id",
			"label": __("Tax Id"),
			"fieldtype": "Data",
			"hidden": 1
		},
		{
			"fieldname": "presentation_currency",
			"label": __("Currency"),
			"fieldtype": "Select",
			"options": erpnext.get_presentation_currency_list()
		},
		{
			"fieldname":"cost_center",
			"label": __("Cost Center"),
			"fieldtype": "MultiSelectList",
			get_data: function(txt) {
				return frappe.db.get_link_options('Cost Center', txt, {
					company: frappe.query_report.get_filter_value("company")
				});
			}
		},
		{
			"fieldname":"project",
			"label": __("Project"),
			"fieldtype": "MultiSelectList",
			get_data: function(txt) {
				return frappe.db.get_link_options('Project', txt, {
					company: frappe.query_report.get_filter_value("company")
				});
			}
		},
		{
			"fieldname": "include_dimensions",
			"label": __("Consider Accounting Dimensions"),
			"fieldtype": "Check",
			"default": 1
		},
		{
			"fieldname": "show_opening_entries",
			"label": __("Show Opening Entries"),
			"fieldtype": "Check"
		},
		{
			"fieldname": "include_default_book_entries",
			"label": __("Include Default Book Entries"),
			"fieldtype": "Check"
		},
		{
			"fieldname": "show_cancelled_entries",
			"label": __("Show Cancelled Entries"),
			"fieldtype": "Check"
		},
		// {
		// 	"fieldname": "omit_outstanding",
		// 	"label": __("Omit Entries with No Outstanding"),
		// 	"fieldtype": "Check"
		// },
		{
			"fieldname": "show_net_values_in_party_account",
			"label": __("Show Net Values in Party Account"),
			"fieldtype": "Check"
		}
	],
	"onload": function(report) {
		// Call the get_data_for_custom_field API with the desired payload
		frappe.call({
			method: "frappe.desk.query_report.get_data_for_custom_field",
			args: {
				// report_name: report.report_name,
				// filters: report.get_filter_values(),
				// fieldname: "job_no",
				doctype: "Sales Invoice",
				field: "job_no" // Add the field argument here
			},
			callback: function(r) {
				if (r.message) {
					var custom_field_data = r.message;
					var main_report_data = report.data;
	
					// Iterate through the custom field data and join it to the main report
					for (var key in custom_field_data) {
						var value = custom_field_data[key];

						// Find the corresponding row in the main report data using the voucher number (key)
						var row_index = -1;
						for (var i = 0; i < main_report_data.length; i++) {
							if (main_report_data[i]["voucher_no"] == key) {
								row_index = i;
								break;
							}
						}

						console.log("Row index: ", row_index);
                    	console.log("Main report row: ", main_report_data[row_index]);

						// If a row was found, add a new column with the value from the dictionary
						if (row_index >= 0) {
							main_report_data[row_index]["custom_field_column"] = value;
						}
					}
					console.log("Main report data with custom field: ", main_report_data);


					report.trigger_refresh();
				}
			}
		});
	},


}



erpnext.utils.add_dimensions('Statement of Accounts vFr8labs', 15)
