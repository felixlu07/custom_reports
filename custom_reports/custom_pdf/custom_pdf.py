from frappe.utils.pdf import get_pdf as original_get_pdf

def get_pdf(html, options=None, output=None):
    print("Custom get_pdf function called")  # Debugging print statement
    # Set or update the margin values in options
    custom_options = {
        'margin-right': '5mm',
        'margin-left': '5mm',
        'margin-top': '5mm',
        'margin-bottom': '5mm'
    }
    if options:
        options.update(custom_options)
    else:
        options = custom_options

    # Call the original get_pdf function with updated options
    return original_get_pdf(html, options, output)
