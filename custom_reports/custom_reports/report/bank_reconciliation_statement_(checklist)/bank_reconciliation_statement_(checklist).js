// Copyright (c) 2023, Frappe Technologies Pvt. Ltd. and contributors
// For license information, please see license.txt
/* eslint-disable */

frappe.query_reports["Bank Reconciliation Statement (Checklist)"] = {
    get_datatable_options(options) {
        return Object.assign(options, {
            checkboxColumn: function(row) {
                // Show checkbox only if posting_date has value
                 return !!(row.payment_doctype && row.posting_date);
            }
        });
    },
	

    onload: function(report) {
	    // Add a div to display the total debit, credit, and updated reconcile selection
		const total_div = $('<div class="totals" style="margin-bottom: 10px; margin-top: 20px;text-align: center; font-size: 18px;"><b>Total Debit Selected:</b> <span class="total-debit">0</span> | <b>Total Credit Selected:</b> <span class="total-credit">0</span> | <b>Updated Reconcile Selection:</b> <span class="updated-reconcile">0</span></div>');
		frappe.after_ajax(() => {
			report.page.wrapper.prepend(total_div);
		});
	
		// Update the total debit, credit, and updated reconcile selection values
		function update_totals() {
			let checked_rows_indexes = report.datatable.rowmanager.getCheckedRows();
			let checked_rows = checked_rows_indexes.map(i => report.data[i]);
	
			let total_debit = 0;
			let total_credit = 0;
	
			checked_rows.forEach(row => {
				total_debit += row.debit || 0;
				total_credit += row.credit || 0;
			});
	
			let calculated_bank_statement_balance_debit = 0;
			let calculated_bank_statement_balance_credit = 0;
			report.data.forEach(row => {
				if (row.payment_entry === "Calculated Bank Statement balance") {
					calculated_bank_statement_balance_debit = row.debit;
					calculated_bank_statement_balance_credit = row.credit; 
				}
			});
	
			let updated_reconcile = (total_debit + calculated_bank_statement_balance_debit) - (total_credit + calculated_bank_statement_balance_credit );
	
			$('.total-debit').text(total_debit.toFixed(2));
			$('.total-credit').text(total_credit.toFixed(2));
			$('.updated-reconcile').text(updated_reconcile.toFixed(2));
		}
	
		// Attach event listener to checkboxes
		frappe.after_ajax(() => {
			report.page.wrapper.on('click', 'input[type="checkbox"]', function(evt) {
				update_totals();
			});
		});

			
				  
        // Reconcile Rows action
        report.page.add_action_item(__("Reconcile Rows"), async function() {
            let checked_rows_indexes = report.datatable.rowmanager.getCheckedRows();
            let checked_rows = checked_rows_indexes.map(i => report.data[i]);
            let account = frappe.query_report.get_filter_value('account');

            for (let row of checked_rows) {
                let payment_doctype = row.payment_document;
                let payment_name = row.payment_entry;
                let reconciled_against = await frappe.db.get_value(payment_doctype, payment_name, "reconciled_against");

                if (reconciled_against && reconciled_against.message.reconciled_against) {
                    console.log(`Row ${payment_doctype} ${payment_name} already has reconciled_against, skipping.`);
                    continue;
                }

                // Proceed with your existing reconciliation logic
                
                let deposit = row?.debit > 0 ? row.debit : 0;
				let withdrawal = row?.credit > 0 ? row.credit : 0;
				// let unallocated_amount = row?.credit > 0 ? row.credit : row.debit;
				let allocatedamount = row?.credit > 0 ? row.credit : row.debit;

                let bank_transaction_doc = {
					"doctype": "Bank Transaction",
					"docstatus": 1,
					"naming_series": "ACC-BTN-.YYYY.-",
					"date": frappe.datetime.nowdate(),
					"status": "Reconciled",
					"bank_account": account,
					"company": row.company,
					"deposit": deposit,
					"withdrawal": withdrawal,
					"currency": row.currency,
					"description": null,
					"reference_number": null,
					"transaction_id": null,
					"allocated_amount": allocatedamount,
					"unallocated_amount": null,
					"party_type": null,
					"party": null,
					"payment_entries": [
						{
							"payment_document": payment_doctype,
							"payment_entry": payment_name,
							"allocated_amount": allocatedamount
						}
					]
				};

				let success = false;
        		while (!success) {	
					try {
						let response = await frappe.call({
							method: "frappe.desk.form.save.savedocs",
							args: {
								doc: JSON.stringify(bank_transaction_doc),
								action: "Submit"
							}
						});

						// Get the name of the created Bank Transaction document
						let bank_transaction_name = response.docs[0].name;
						console.log(`Created Bank Transaction ${bank_transaction_name}`);

						// Update the reconciled_against field in the Payment Entry document
						let payment_doctype = row.payment_document;
						let payment_name = row.payment_entry;				

						await frappe.db.set_value(payment_doctype, payment_name, "reconciled_against", bank_transaction_name);
						console.log(`Set reconciled_against for ${payment_doctype} ${payment_name} to ${bank_transaction_name}`);
						
						success = true;
					
				
				} catch (error) {
					console.error(`Error while calling API for ${payment_doctype} ${payment_name}:`, error);
				}
			}
        }
		location.reload();
		frappe.msgprint(`Marked selected transactions as reconciled. Corresponding matching bank transactions under the "Reconciled Against" column have been created.`);
		}),



	   	// Reverse Reconciliation action
		report.page.add_action_item(__("Reverse Reconciliation"), async function() {
			let checked_rows_indexes = report.datatable.rowmanager.getCheckedRows();
			let checked_rows = checked_rows_indexes.map(i => report.data[i]);

			for (let row of checked_rows) {
				let payment_doctype = row.payment_document;
				let payment_name = row.payment_entry;
				let reconciled_against = await frappe.db.get_value(payment_doctype, payment_name, "reconciled_against");

				if (!reconciled_against || !reconciled_against.message.reconciled_against) {
					console.log(`Row ${payment_doctype} ${payment_name} has no reconciled_against, skipping.`);
					continue;
				}

				let bank_transaction_name = reconciled_against.message.reconciled_against;

				try {

					// Clear the reconciled_against field in the Payment Entry document
					await frappe.db.set_value(payment_doctype, payment_name, "reconciled_against", null);
					console.log(`Cleared reconciled_against for ${payment_doctype} ${payment_name}`);
					// Cancel the Bank Transaction document
					await frappe.call({
						method: "frappe.client.cancel",
						args: {
							doctype: "Bank Transaction",
							name: bank_transaction_name,
						},
					});

					console.log(`Cancelled Bank Transaction ${bank_transaction_name}`);

					// Delete the Bank Transaction document
					await frappe.call({
						method: "frappe.client.delete",
						args: {
							doctype: "Bank Transaction",
							name: bank_transaction_name,
						},
					});

					console.log(`Deleted Bank Transaction ${bank_transaction_name}`);

					// Clear the reconciled_against field in the Payment Entry document
					await frappe.db.set_value(payment_doctype, payment_name, "reconciled_against", null);
					console.log(`Cleared reconciled_against for ${payment_doctype} ${payment_name}`);
				} catch (error) {
					console.error(`Error while calling API for ${payment_doctype} ${payment_name}:`, error);
				}
			}

			// Reload the page and display the message only after the loop is completed
			location.reload()
			frappe.msgprint(`Cleared reconcilation for selected transactions. The corresponding mapped bank transaction(s) have also been deleted.`);
		});

},

		
	
		
	"filters": [
		{
			"fieldname":"company",
			"label": __("Company"),
			"fieldtype": "Link",
			"options": "Company",
			"reqd": 1,
			"default": frappe.defaults.get_user_default("Company")
		},
		{
			"fieldname":"account",
			"label": __("Bank Account"),
			"fieldtype": "Link",
			"options": "Account",
			"default": frappe.defaults.get_user_default("Company")?
				locals[":Company"][frappe.defaults.get_user_default("Company")]["default_bank_account"]: "",
			"reqd": 1,
			"get_query": function() {
				var company = frappe.query_report.get_filter_value('company')
				return {
					"query": "erpnext.controllers.queries.get_account_list",
					"filters": [
						['Account', 'account_type', 'in', 'Bank, Cash'],
						['Account', 'is_group', '=', 0],
						['Account', 'disabled', '=', 0],
						['Account', 'company', '=', company],
					]
				}
			}
		},
		{
			"fieldname":"report_date",
			"label": __("Date"),
			"fieldtype": "Date",
			"default": frappe.datetime.get_today(),
			"reqd": 1
		},
		{
			"fieldname":"include_pos_transactions",
			"label": __("Include POS Transactions"),
			"fieldtype": "Check"
		},
	]
};
		
