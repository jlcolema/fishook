if (typeof window.Forms == 'undefined') window.Forms = {};

;(function(global, $){
    //es5 strict mode
    "use strict";

    if (typeof window.jQuery == 'undefined') {
        alert("The Forms Module requires jQuery 1.3 or higher. \n(jQuery not found)");
        return;
    }

    if (typeof global.Forms == 'undefined') global.Forms = {};
    global.Forms.Conditionals = {};

    // ----------------------------------------------------------------------

    $(document).ready(function(){

        if (typeof $.fn.closest == 'undefined') {
            alert("The Forms Module requires jQuery 1.3 or higher. \n(closest method not found)");
        }

        var FormField, Input;

        // Find all Forms
        Forms.dform = $('div.dform');

        // Did are there any conditionals stored?
        for (var Field in Forms.Conditionals){
            var FIELD_ID = Field.substr(3);
            // Does is Exists?
            if (document.getElementById('forms_field_'+FIELD_ID) === null) continue;

            // just in case
            if(typeof Forms.Conditionals[Field].conditionals == 'undefined') continue;

            for (var i = 0; i < Forms.Conditionals[Field].conditionals.length; i++) {
                var Cond = Forms.Conditionals[Field].conditionals[i];
                FormField = $('#forms_field_'+Cond.field);
                Input = FormField.find(':input[name^="fields\\['+Cond.field+'\\]"]'); // Matches field names with array
                //if (Input.data('form_event_added') == true) continue;
                if (Input.length === 0) {
                    // Maybe paginated?
                    Input = Forms.dform.closest('form').find(':input[name^="fields\\['+Cond.field+'\\]"]');
                    if (Input.length === 0) continue;
                    else {
                        FormField = Input.parent();
                    }
                }

                Input.data('form_event_added', true);
                if (Input[0].nodeName == 'SELECT') Input.bind('change.forms_'+Cond.field, {'condkey':i, 'formfield':FormField, 'senderfield':Field},Forms.ExecuteConditional).trigger('change');
                else if (Input[0].type == 'radio') Input.bind('click.forms_'+Cond.field, {'condkey':i, 'formfield':FormField, 'senderfield':Field},Forms.ExecuteConditional).filter(':checked').trigger('click');
                else if (Input[0].type == 'checkbox') Input.bind('click.forms_'+Cond.field, {'condkey':i, 'formfield':FormField, 'senderfield':Field},Forms.ExecuteConditional).filter(':checked').trigger('chnage');
                else Input.bind('keyup.forms_'+Cond.field, {'condkey':i, 'formfield':FormField, 'senderfield':Field},Forms.ExecuteConditional).trigger('keyup');

            }
        }

        // Disable commas etc
        Forms.dform.find('div.dform_cart_product').find('.user_defined').bind('keydown', function(e){

            var decimal_sep = 1.1;
            decimal_sep = decimal_sep.toLocaleString().substring(1, 2);

            // Comma
            if (e.which == 188) {
                e.preventDefault();
                return false;
            }

            // Dot
            if (e.which == 190 || e.which == 110) {
                if ($(this).val().indexOf('.') != -1) {
                    e.preventDefault();
                    return false;
                }
                else return true;
            }

            if (e.which == 8 || e.which == 46) return true; // Backspace & Delete

            // Arrows
            if (e.which >= 37 && e.which <= 40) return true;

            if ((e.which >= 48 && e.which <= 57) || (e.which >= 96 && e.which <= 105)) {
                return;
            }

            e.preventDefault();
            return false;
        });

        if (Forms.dform.find('span.forms_cart_total').length > 0) {
            Forms.dform.find('div.dform_cart_product').bind('click keyup change', Forms.CalculateCartTotal);
            Forms.dform.find('div.dform_cart_coupons').bind('click keyup change', Forms.CalculateCartTotal);
            Forms.dform.find('div.dform_cart_quantity').bind('click keyup change', Forms.CalculateCartTotal);
            Forms.dform.find('div.dform_cart_product_options').bind('click keyup change', Forms.CalculateCartTotal);
            Forms.dform.find('div.dform_cart_product_options_multi').bind('change', Forms.CalculateCartTotal);
            Forms.dform.find('div.dform_cart_shipping').bind('click keyup change', Forms.CalculateCartTotal);
            Forms.CalculateCartTotal();
        }

        // Products Multi!
        Forms.dform.find('.dform_cart_product_options_multi').delegate('td.del a', 'click', removeTrRow);
        Forms.dform.find('.dform_cart_product_options_multi').delegate('.addrow', 'click', addTrRowOptionMulti);
        Forms.dform.find('.dform_cart_product_options_multi').each(function(i, elem){
            syncOrderNumbersOptionMulti($(elem));
        });

    });

    // ----------------------------------------------------------------------

    function removeTrRow(e) {
        e.preventDefault();
        var parent = $(e.target).closest('.dform_element');
        $(e.target).closest('tr').remove();

        syncOrderNumbersOptionMulti(parent);
    }

    // ----------------------------------------------------------------------

    function addTrRowOptionMulti(e) {
        e.preventDefault();
        var parent = $(e.target).closest('.dform_element');
        var html = parent.find('script.rowtmpl').html();
        parent.find('table tbody').append(html);

        syncOrderNumbersOptionMulti(parent);
    }

    // ----------------------------------------------------------------------

    function syncOrderNumbersOptionMulti(parent) {
        //console.log(parent);
        parent.find('.optionrow').each(function(index, row){
            row = $(row);

            row.find(':input').each(function(findex,felem){
                if (!felem.getAttribute('name')) return false;

                // Get it's attribute and change it
                var attr = $(this).attr('name').replace(/\[options\]\[.*?\]/, '[options][' + (index+1) + ']');
                $(this).attr('name', attr);
            });
        });
    }

    // ----------------------------------------------------------------------


}(window, (window.jQuery ? window.jQuery : {}) ));


// ********************************************************************************* //


// ********************************************************************************* //





Forms.AddConditional = function(FieldID, Cond){
    Forms.Conditionals['ID_'+FieldID] = Cond;
};

//********************************************************************************* //

Forms.ExecuteConditional = function(Event){
    if (typeof(Event.data) == 'undefined') return;
    if (typeof(Event.data.condkey) == 'undefined') return;
    if (typeof(Forms.Conditionals[Event.data.senderfield].conditionals[Event.data.condkey]) == 'undefined') return;
    var Cond = Forms.Conditionals[Event.data.senderfield].conditionals[Event.data.condkey];
    var Values = [];
    var Passed = false;

    // Is it a radio button?
    if (Event.target.type == 'radio' && Event.target.nodeName == 'INPUT') {
        Values.push(Event.data.formfield.find(':input[name^="fields\\['+Cond.field+'\\]"]').filter(':checked').val());
    } else if (Event.target.type == 'checkbox' && Event.target.nodeName == 'INPUT') {
        Event.data.formfield.find(':input[name^="fields\\['+Cond.field+'\\]"]').filter(':checked').each(function(ii, ee){
            Values.push($(ee).val());
        });
    } else  {
        Values.push(Event.data.formfield.find(':input[name^="fields\\['+Cond.field+'\\]"]').val());
    }

    Cond.value = $.trim(Cond.value).toLowerCase();

    // Trim all values
    for (var i = Values.length - 1; i >= 0; i--) {
        Values[i] = $.trim(Values[i]).toLowerCase();

        // If it's empty, kill it..
        if (Values[i] == false) {
            //Values.splice(i, 1);
        }
    }

    if (Values.length > 0) {
        switch(Cond.operator) {
            case 'is':
                for (var i = Values.length - 1; i >= 0; i--) {
                    if (Values[i] == Cond.value) Passed = true;
                }
                break;
            case 'isnot':
                for (var i = Values.length - 1; i >= 0; i--) {
                    if (Values[i] != Cond.value) Passed = true;
                }
                break;
            case 'greater_then':
                for (var i = Values.length - 1; i >= 0; i--) {
                    if (parseFloat(Values[i]) > parseFloat(Cond.value)) Passed = true;
                }
                break;
            case 'less_then':
                for (var i = Values.length - 1; i >= 0; i--) {
                    if (parseFloat(Values[i]) < parseFloat(Cond.value)) Passed = true;
                }
                break;
            case 'contains':
                for (var i = Values.length - 1; i >= 0; i--) {
                    if (Values[i].toLowerCase().indexOf(Cond.value.toLowerCase()) != -1) Passed = true;
                }
                break;
            case 'starts_with':
                for (var i = Values.length - 1; i >= 0; i--) {
                    if (Values[i].toLowerCase().lastIndexOf(Cond.value.toLowerCase(), 0) === 0) Passed = true;
                }
                break;
            case 'ends_with':
                for (var i = Values.length - 1; i >= 0; i--) {
                    if (Values[i].toLowerCase().slice(-Cond.value.toLowerCase().length) == Cond.value.toLowerCase() ) Passed = true;
                }
                break;
        }
    }

    Cond.passed = Passed;
    Forms.FinalizeConditional(Event.data.senderfield);
};

//********************************************************************************* //

Forms.FinalizeConditional = function(FIELD){
    var FIELD_ID = FIELD.substr(3);
    var Field = $('#forms_field_'+FIELD_ID);
    var Cond = Forms.Conditionals[FIELD];

    if (Cond.options.match == 'all'){
        var PassedAll = true;
        for (var i = Cond.conditionals.length - 1; i >= 0; i--) {
            if (typeof(Cond.conditionals[i].passed) == 'undefined') PassedAll = false;
            if (Cond.conditionals[i].passed == false) PassedAll = false;
        }

        if (PassedAll){
            if (Cond.options.display == 'show') Field.show();
            if (Cond.options.display == 'hide') Field.hide();
        } else {
            if (Cond.options.display == 'show') Field.hide();
            if (Cond.options.display == 'hide') Field.show();
        }
    } else  {
        var PassedAny = false;

        for (var i = Cond.conditionals.length - 1; i >= 0; i--) {
            if (typeof(Cond.conditionals[i].passed) == 'undefined') PassedAny = false;
            if (Cond.conditionals[i].passed == true) PassedAny = true;
        }

        if (PassedAny == true){
            if (Cond.options.display == 'show') Field.show();
            if (Cond.options.display == 'hide') Field.hide();
        } else {
            if (Cond.options.display == 'show') Field.hide();
            if (Cond.options.display == 'hide') Field.show();
        }
    }

    Forms.CalculateCartTotal();
};

//********************************************************************************* //

Forms.CalculateCartTotal = function(e){

    Forms.form_elements = Forms.dform.find('div.dform_element:visible');

    Forms.Products = [];
    Forms.Products_Shipping = 0;
    Forms.Products_FeesMarkup = [];

    // Loop over all fields
    Forms.form_elements.each(function(i, elem){
        elem = $(elem);

        // Product?
        if (elem.hasClass('dform_cart_product')) {
            Forms.ParseCart_Products(elem); return;
        }

        // Product Options
        if (elem.hasClass('dform_cart_product_options')) {
            Forms.ParseCart_Options(elem); return;
        }

        // Product Options Multi
        if (elem.hasClass('dform_cart_product_options_multi')) {
            Forms.ParseCart_OptionsMulti(elem); return;
        }

        // Quantity?
        if (elem.hasClass('dform_cart_quantity')) {
            Forms.ParseCart_Quantity(elem); return;
        }

        // Shipping
        if (elem.hasClass('dform_cart_shipping')) {
            Forms.ParseCart_Shipping(elem); return;
        }

        // Fees & Markup
        if (elem.hasClass('dform_cart_fees_markup')) {
            Forms.ParseCart_FeesMarkup(elem); return;
        }

        // Coupons
        if (elem.hasClass('dform_cart_coupons')) {
            Forms.ParseCart_Coupons(elem); return;
        }

    });

    var TotalCart = 0;
    var startTotal = Forms.dform.find('span.forms_cart_total').data('start_total');

    if (startTotal) {
        TotalCart = parseFloat(Forms.dform.find('span.forms_cart_total').data('start_total'));
    }

    for (var i = Forms.Products.length - 1; i >= 0; i--) {
        var OptionsTotal = 0, ProductTotal = 0, LineTotal = 0;

        if (!Forms.Products[i].price) continue;
        if (!Forms.Products[i].qty) continue;

        if (Forms.Products[i].option) {
            for (var ii = Forms.Products[i].option.length - 1; ii >= 0; ii--) {
                OptionsTotal += parseFloat(Forms.Products[i].option[ii]);
            }
        }

        ProductTotal = (parseFloat(OptionsTotal) + parseFloat(Forms.Products[i].price));

        if (Forms.Products[i].qty) LineTotal += (parseFloat(Forms.Products[i].qty) * parseFloat(ProductTotal));
        else LineTotal += parseFloat(ProductTotal);

        if (Forms.Products[i].extraPrice) {
            LineTotal += Forms.Products[i].extraPrice;
        }

        TotalCart += parseFloat(LineTotal);
    }

    TotalCart += parseFloat(Forms.Products_Shipping);

    if (Forms.Products_Coupons) {
        if (Forms.Products_Coupons.substr(-1) == '%') {
            TotalCart -= (TotalCart / 100) * Forms.Products_Coupons.slice(0,-1);
        } else {
            TotalCart -= parseFloat(Forms.Products_Coupons);
        }
    }

    if (Forms.Products_FeesMarkup) {
        for (var i = 0; i < Forms.Products_FeesMarkup.length; i++) {

            if (Forms.Products_FeesMarkup[i].substr(-1) == '%') {
                TotalCart += (TotalCart / 100) * Forms.Products_FeesMarkup[i].slice(0,-1);
            } else {
                TotalCart += parseFloat(Forms.Products_FeesMarkup[i]);
            }
        }
    }

    if (TotalCart < 0) {
        TotalCart = 0;
    }

    var totalCart = parseFloat(TotalCart).toFixed(2);

    Forms.dform.closest('form').data('cart_total', totalCart);
    Forms.dform.find('span.forms_cart_total').html(totalCart);

    if (e) {
        Forms.dform.find('.dform_cart_total').find('input').attr('value', totalCart).trigger('keyup');
    }
};

//********************************************************************************* //

Forms.ParseCart_Products = function(elem){
    var Product = {};
    var Selected;

    // Single Product?
    if (elem.find('input.single_product').val() == 'single' || elem.find('input.single_product').val() == 'entry_product' ) {
        Product.price = elem.find('input.single_product').attr('data-price');

        if (elem.find('input.cart_quantity').length > 0) {
            Product.qty = $.trim(elem.find('input.cart_quantity').val());
            Product.qty_field = true;
        } else {
            Product.qty = 1;
            Product.qty_field = false;
        }

        Product.fieldtype = 'single_product';
        Forms.Products.push(Product);
        return;
    }

    // Radio?
    if (elem.find('ul.radios').length > 0) {
        Selected = elem.find('input[type=radio]:checked');
        if (Selected.length === 0) return;
        Product.price = Selected.closest('li').attr('data-price');

        if (elem.find('input.cart_quantity').length > 0) {
            Product.qty = $.trim(elem.find('input.cart_quantity').val());
            Product.qty_field = true;
        } else {
            Product.qty = 1;
            Product.qty_field = false;
        }

        Product.fieldtype = 'radio';
        Forms.Products.push(Product);
        return;
    }

    // Checkbox
    if (elem.find('ul.checkboxes').length > 0) {
        Selected = elem.find('input[type=checkbox]:checked');
        Selected.each(function(i, el){
            el = $(el).closest('li');
            Product = {};
            Product.price = el.attr('data-price');
            if (el.find('input.cart_quantity').length > 0) {
                Product.qty = $.trim(el.find('input.cart_quantity').val());
                Product.qty_field = true;
            } else {
                Product.qty = 1;
                Product.qty_field = false;
            }
            Product.fieldtype = 'checkbox';
            Forms.Products.push(Product);
        });
        return;
    }

    // Dropdown
    if (elem.find('select').length > 0) {
        Selected = elem.find('select option:selected');
        if (Selected.length === 0) return;
        Product.price = Selected.attr('data-price');
        Product.qty = 1;
        Product.qty_field = false;
        Product.fieldtype = 'dropdown';
        Forms.Products.push(Product);
        return;
    }

    // User Defined
    if (elem.find('input.user_defined').length > 0) {
        Product.price = elem.find('input.user_defined').val();
        Product.qty = 1;
        Product.qty_field = false;
        Product.fieldtype = 'user_defined';
        Forms.Products.push(Product);
        return;
    }
};

//********************************************************************************* //

Forms.ParseCart_Quantity = function(elem){
    var Qty = elem.find('input,select').val();

    for (var i = 0; i < Forms.Products.length; i++) {
        if (!Forms.Products[i].qty || !Forms.Products[i].qty_field) {
            Forms.Products[i].qty = Qty;
        }
    }
};

//********************************************************************************* //

Forms.ParseCart_Options = function(elem){

    var Options = [];
    var Selected;

    // Radio?
    if (elem.find('ul.radios').length > 0) {
        Selected = elem.find('input[type=radio]:checked');
        if (Selected.length === 0) return;
        Options.push(Selected.parent().attr('data-price'));
    }

    // Checkbox
    else if (elem.find('ul.checkboxes').length > 0) {
        Selected = elem.find('input[type=checkbox]:checked');
        Selected.each(function(i, el){
            el = $(el).parent();
            Options.push(el.attr('data-price'));
        });
    }

    // Dropdown
    else if (elem.find('select').length > 0) {
        Selected = elem.find('select option:selected');
        if (Selected.length === 0) return;
        Options.push(Selected.attr('data-price'));
    }

    if (Options.length === 0) return;

    for (var i = 0; i < Forms.Products.length; i++) {
        if (!Forms.Products[i].option) Forms.Products[i].option = Options;
    }
};

//********************************************************************************* //

Forms.ParseCart_OptionsMulti = function(elem){

    var product = Forms.Products[Forms.Products.length -1];
    var totalExtra=0, totalQty=0;
    var price, qty;

    if (!product.extraPrice) {
        product.extraPrice = 0;
    }

    elem.find('.optionrow').each(function(i, row){
        row = $(row);
        product.price = parseFloat(product.price);
        product.qty = parseFloat(product.qty);
        price = parseFloat(row.find('.option select option').filter(':selected').data('price'));
        qty = parseFloat(row.find('.qty select').val());

        price = qty * price;

        totalExtra += price;
        totalQty += qty;

    });

    product.extraPrice += totalExtra;
    product.qty = totalQty; // Override main qty
    product.qty_field = true;
};

//********************************************************************************* //

Forms.ParseCart_Shipping = function(elem) {
    var Selected;

    // Single Ship?
    if (elem.find('input.single_ship').val() == 'single') {
        Forms.Products_Shipping = elem.find('input.single_ship').attr('data-price');
        return;
    }

    // Radio?
    if (elem.find('ul.radios').length > 0) {
        Selected = elem.find('input[type=radio]:checked');
        if (Selected.length === 0) return;
        Forms.Products_Shipping = Selected.parent().attr('data-price');
        return;
    }

    // Dropdown
    if (elem.find('select').length > 0) {
        Selected = elem.find('select option:selected');
        if (Selected.length === 0) return;
        Forms.Products_Shipping = Selected.attr('data-price');
        return;
    }

};

//********************************************************************************* //

Forms.ParseCart_FeesMarkup = function(elem) {

    Forms.Products_FeesMarkup.push(elem.find('.fee_markup').data('price').toString() );
};

//********************************************************************************* //

Forms.ParseCart_Coupons = function(elem) {

    // If it's disabled continue on!
    var attr = elem.find('input[type=text]').attr('disabled');
    if (typeof attr !== 'undefined' && attr !== false) return;

    Forms.Products_Coupons = null;
    var code = elem.find('input[type=text]').val();
    var coupons = jQuery.parseJSON(elem.find('.dd-coupons').html());
    var final_coupon;

    if (typeof(coupons[code]) != 'undefined') {
        coupons[code].code = jQuery.trim( coupons[code].code );
        if (!coupons[code].code) return;

        Forms.Products_Coupons = coupons[code].discount;

        elem.find('input[type=text]').attr('disabled', 'disabled').attr('value', coupons[code].label + ' (-'+coupons[code].discount+')');
        elem.find('input[type=hidden]').attr('value', code);
    }

};

//********************************************************************************* //

