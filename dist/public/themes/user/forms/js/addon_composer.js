;(function(global, $){
    //es5 strict mode
    "use strict";

    var Forms = global.Forms = global.Forms || {};
    var columnFields =['columns_4', 'columns_3', 'columns_2', 'fieldset'];

    var wrapper = $('.forms-composer');
    if (!wrapper.length) return;

    var formWrapper = wrapper.closest('.forms-wrapper');
    var composerWrapper = wrapper.find('.composer-wrapper');
    var fieldsWrapper = wrapper.find('.fields-wrapper');
    var newFields = {};
    //DOM.RightBar = DOM.Wrapper.find('div.col3');

    // ----------------------------------------------------------------------

    fieldsWrapper.on('keyup', '.fields-filter', filterFields);
    fieldsWrapper.on('click', 'li', addFieldByClick);
    composerWrapper.on('click', '.field-settings', 'click', openFieldSettings);
    composerWrapper.on('click', '.field-remove', 'click', removeField);
    composerWrapper.on('click', '.field-move', 'click', function(){return false;});
    composerWrapper.on('dblclick', '.forms-elem', openFieldSettings);

    // ----------------------------------------------------------------------

    prefetchFields();
    fetchDbFields();
    activateSortable();

    // ----------------------------------------------------------------------

    // Add :Contains (case-insensitive)
    $.expr[':'].Contains = function(a,i,m){
        return (a.textContent || a.innerText || "").toUpperCase().indexOf(m[3].toUpperCase())>=0;
    };

    function filterFields(evt) {
         if (!evt.target.value){
            fieldsWrapper.find('li').show();
        } else {
            fieldsWrapper.find('li:not(:Contains(' + evt.target.value + '))').slideUp();
            fieldsWrapper.find('li:Contains(' + evt.target.value + ')').slideDown();
        }
    }

    // ----------------------------------------------------------------------

    function prefetchFields() {
        composerWrapper.find('.loading-prefetch-fields .loading').html(new Spinner({left:'-32px', top:'11px'}).spin().el);

        var params = formWrapper.find(':input').serializeArray();

        fieldsWrapper.find('li').each(function(index, elem){
            params.push({name:'fields[]', value:elem.getAttribute('data-field')});
        });

        $.ajax({
            url:Forms.MCP_AJAX_URL + '&ajax_method=prefetch_fields',
            data:params, type:'POST', dataType:'json',
            error: function(){
                alert('Failed to load Default Forms Fields.. See XHR Response.');
            },
            success: function(rdata){
                composerWrapper.find('.loading-prefetch-fields').hide();
                for (var name in rdata.fields){
                    newFields[name] = rdata.fields[name];
                }
            }
        });
    }

    // ----------------------------------------------------------------------

    function fetchDbFields() {
        composerWrapper.find('.loading-db-fields .loading').html(new Spinner({left:'-32px', top:'11px'}).spin().el);

        var params = formWrapper.find(':input').serializeArray();

        $.ajax({
            url: Forms.MCP_AJAX_URL + '&ajax_method=fetch_db_fields',
            data: params, type: 'POST', dataType: 'json',
            error: function(){
                alert('Failed to load DB Fields.. Refreshing the page might help. DO NOT SAVE THE FORM!');
            },
            success:function(rdata){
                composerWrapper.find('.loading-db-fields').hide();

                if (!rdata || !rdata.fields || rdata.fields.length === 0) {
                    composerWrapper.find('.first-drop').show();
                    activateDraggable();
                    return;
                }

                var fields = [];
                for (var i = 0; i < rdata.fields.length; i++) {
                    fields.push(rdata.fields[i]);
                }

                composerWrapper.find('> .composer-sortable').append(fields.join(''));

                activateDraggable();
                activateSortable();
                syncOrderNumbers();
            }
        });
    }

    // ----------------------------------------------------------------------

    function activateSortable(pane) {
        if (!pane) var pane = composerWrapper;
        pane.find('.composer-sortable').each(function(index, elem){

            $(elem).sortable({
                handle: '.field-move',
                placeholder : 'sortable_placeholder',
                connectWith: '.composer-sortable',
                items: '> .forms-elem',
                helper: function(evt){
                    var field = $(evt.target).closest('.forms-elem').data('fieldtype');
                    var html = "<div class='dragging_field' style='width:175px;height:20px;background:#ECF1F4;margin:0'>"+fieldsWrapper.find('.field_'+ field).html()+"</div>";
                    return $(html);
                },
                cursorAt: {right:85, top:10},
                stop: function(){
                    setTimeout(function(){
                        syncOrderNumbers();
                    }, 300);
                }
            });

        });
    }

    // ----------------------------------------------------------------------

    function activateDraggable(pane) {

        fieldsWrapper.find('.sort').each(function(index, elem){
            elem = $(elem);
            elem.data('original_state', elem.html());

            elem.sortable({
                //handle: '.field-move',
                placeholder : 'sortable_placeholder',
                connectWith: '.composer-sortable',
                /*helper: function(evt){
                    return $( "<div class='dragging_field' style='width:175px;height:20px;background:#ECF1F4;margin:0'>"+$(evt.target).html()+"</div>" );
                },*/
                stop: function(evt, ui){

                    // Is it a draggable?
                    if (ui.item.hasClass('draggable') === true){

                        // Hide forst drop!
                        composerWrapper.find('.first-drop').hide();

                        var fieldtype = $(ui.item).data('field');
                        var field = $(newFields[fieldtype]);
                        field.attr('data-fieldhash', (Math.random()*10));

                        // Replace with the new item
                        ui.item.replaceWith(field);

                        if ($.inArray(fieldtype, columnFields) >= 0) activateSortable();
                    }

                    elem.html(elem.data('original_state'));

                    // Wait a bit before syncing numbers
                    setTimeout(function(){
                        syncOrderNumbers();
                    }, 300);

                }
            });
        });
    }

    // ----------------------------------------------------------------------

    function addFieldByClick(evt) {

        // Add the new Field
        addField(evt.currentTarget.getAttribute('data-field'));

        // Scroll the page to the newly created page..slowlyyyy
        $('html,body').animate({scrollTop: composerWrapper.find('.forms-elem:last').offset().top - 40}, 900);

        // Wait and animate the background
        setTimeout(function(){
            composerWrapper.find('.forms-elem:last').stop().css('background-color', '#FFF6A9').animate({ backgroundColor: 'transparent'}, 2000, null, function(){
                $(this).css({'background-color' : ''});
            });
        }, 300);
    }

    // ----------------------------------------------------------------------

    function addField(handle) {
        if (typeof(newFields[handle]) == 'undefined') return;
        composerWrapper.find('.first-drop').hide();

        var field = $(newFields[handle]);
        field.attr('data-fieldhash', (Math.random()*10));
        composerWrapper.find('.composer-sortable').append(field);
        field = composerWrapper.find('.forms-elem:last');

        if ($.inArray(handle, columnFields) >= 0) activateSortable(field);

        // Sync Order Numbers
        syncOrderNumbers();
        //Forms.ActivatePopOver(DOM);

        // Trigger ShowHides!
        setTimeout(function(){
            composerWrapper.find('input.ShowHideSubmitBtn').filter(':checked').click();
        }, 300);

    };

    // ----------------------------------------------------------------------

    function removeField(evt) {
        evt.preventDefault();

        $(evt.target).closest('.forms-elem').slideUp('800', function(){

            if ( composerWrapper.find('.forms-elem').length === 1) {
                composerWrapper.find('.first-drop').show();
            }

            $(this).remove();
        });
    }

    // ----------------------------------------------------------------------

    function syncOrderNumbers(pane) {
        if (!pane) pane = composerWrapper.children('.composer-sortable');
        pane.each(function(){
            $(this).children('.forms-elem').each(function(index,elem){
                var Settings = $(elem).find('.settings-input');
                var attr;

                if (Settings.length == 1) {
                    attr = Settings.attr('name').replace(/\[fields\]\[.*/, '[fields][' + (index+1) + '][field]');
                    Settings.attr('name', attr);
                } else {
                    var SettingsChildren = Settings.slice(0, -1);
                    var LastSettings = Settings.filter(':last');

                    SettingsChildren.each(function(ii, ee){
                        var Elem = $(ee);
                        var ColNum = Elem.closest('.column').data('number');
                        var attrr = Elem.attr('name').replace(/\[fields\]\[.*/, '[fields][' + (index+1) + '][columns]['+ColNum+'][]');
                        Elem.attr('name', attrr);
                    });

                    attr = LastSettings.attr('name').replace(/\[fields\]\[.*/, '[fields][' + (index+1) + '][field]');
                    LastSettings.attr('name', attr);
                }
            });

        });
    }

    // ----------------------------------------------------------------------

    function openFieldSettings(evt) {
        evt.preventDefault();

        var parent = $(evt.target).closest('.forms-elem');
        var settings = $( $.base64Decode(parent.children('.settings-html').html()) );

        // Open the modal
        var modal = $('.modal-forms-fieldsettings-open');
        modal.trigger('modal:open');
        modal.find('.box:first').html(settings);
        modal.data('forms-elem', parent);

        // Trigger group toggles
        modal.find('*[data-group-toggle]:checked').each(function(index, elem){
            EE.cp.form_group_toggle(elem);
        });

        if (!modal.data('events_bound')) {
            choicesActivate(modal);
            modal.on('click', '.settings-save', saveField);
            modal.data('events_bound', true);
        }

        modal.find('.choice-enable-values').trigger('change');
        modal.find('.forms-shide').on('change', toggleShide).trigger('change');
        modal.find('.field_hash').attr('value', parent.data('fieldhash'));

        var allFields = getFieldsByHash();
        modal.find('.forms-conditionals tbody tr').each(function(index, elem){
            elem = $(elem).find('td:first');
            elem.find('select').html(allFields).find("option[value='"+elem.find('select').data('selected')+"']").attr('selected',true);
        });
    }

    // ----------------------------------------------------------------------

    function saveField(evt) {
        evt.preventDefault();

        var modal = $(evt.currentTarget).closest('.modal-wrap');
        var formsElem = modal.data('forms-elem');

        var saveBtn = modal.find('.settings-save');
        saveBtn.addClass('work').attr('value', saveBtn.data('work-text'));

        var params = modal.find(':input').serializeArray();
        params.push.apply(params, formWrapper.find(':input').serializeArray());

        $.post(Forms.MCP_AJAX_URL + '&ajax_method=save_field', params, function(rdata){
            var newElem = $(rdata);

            if ($.inArray(formsElem.data('fieldtype'), columnFields) < 0)  {
                formsElem.replaceWith(newElem);
            }

            modal.trigger('modal:close');

            syncOrderNumbers();
            activateSortable();
        });
    }

    // ----------------------------------------------------------------------

    function choicesActivate(pane) {
        pane.on('click', '.choice-add', choicesAddOption);
        pane.on('click', '.choice-remove', choicesRemoveOption);
        pane.on('click', '.choice-remove-all', choicesRemoveAll);

        pane.on('change', '.choice-enable-values', choicesEnableValues);
        pane.find('.choice-enable-values').trigger('change');
    }

    function choicesAddOption(evt){
        evt.preventDefault();

        // Make the clone and clear all fields
        var clone = $(evt.target).closest('tr').clone();
        clone.find('input[type=text]').val('');
        clone.find('input[type=radio]').removeAttr('checked');

        // Add it
        $(evt.target).closest('tr').after(clone);
        choicesSyncOrderNumbers($(evt.target).closest('.forms-choices'));
    }

    function choicesRemoveOption(evt){
        evt.preventDefault();
        var parent = $(evt.target).closest('.forms-choices');

        // Last field? We can't delete it!
        if (parent.find('tbody tr').length == 1) return false;

        // Kill, with animation
        $(evt.target).closest('tr').fadeOut('fast', function(){
            $(this).remove();
        });
    }

    function choicesRemoveAll(evt) {
        $(evt.target).closest('.forms-choices').find('.choice-remove').not(':first').click();
        return false;
    }

    function choicesEnableValues(evt) {
        var tab = $(this).closest('.tab');
        tab.find('.choice-value').hide();

        if ($(evt.currentTarget).find('input:checked').val() == 'yes') {
            tab.find('.choice-value').show();
        }
    }

    function choicesSyncOrderNumbers(pane){

        pane.each(function(index, elem){
            $(elem).find('tbody tr').each(function(trIndex, trElem){

                $(trElem).find('input, textarea, select').each(function(subIndex, subElem){
                    var attr = $(subElem).attr('name');
                    attr = attr.replace(/\[choices\]\[.*?\]/, '[choices][' + trIndex + ']');
                    attr = attr.replace(/\[conditionals\]\[.*?\]/, '[conditionals][' + trIndex + ']');
                    attr = attr.replace(/\[values\]\[.*?\]/, '[values][' + trIndex + ']');
                    attr = attr.replace(/\[labels\]\[.*?\]/, '[labels][' + trIndex + ']');
                    $(subElem).attr('name', attr);
                });

                $(trElem).find('tr:first').find('input').attr('value', trIndex);

            });
        });
    }

    // ----------------------------------------------------------------------

    function toggleShide(evt) {
        var target = $(evt.currentTarget).find('input:checked');
        var value = target.val();
        var parent = target.closest('.tab');
        parent.find('.shide').hide();

        parent.find('.s-' + value).show();
    }

    // ----------------------------------------------------------------------

    function getFieldsByHash(){
        var fields = [];
        var acceptedFields =['text_input', 'radio', 'checkbox', 'select', 'textarea', 'email', 'numbers', 'email_route', 'cart_product', 'cart_shipping', 'cart_total'];

        composerWrapper.find('.forms-elem').each(function(index, elem){
            if ($.inArray(elem.getAttribute('data-fieldtype'), acceptedFields) == -1) return;

            var prefx = (elem.parentElement.getAttribute('data-number')) ? '&#160;&#160;&#160;' : '';
            fields.push('<option value="'+elem.getAttribute('data-fieldhash')+'">'+prefx + elem.getAttribute('data-fieldlabel')+'</option>');
        });

        return fields.join('');
    };




    //********************************************************************************* //



//********************************************************************************* //


//********************************************************************************* //

Forms.RefreshFields = function(DOM, CustomParent){

    var FormSettings = DOM.RightBar.find(':input').serializeArray();
    var Elements = CustomParent ? CustomParent.find('.forms-elem') : composerWrapper.find('.forms-elem');

    if (Elements.length == 0) return;

    // Loop over all fields and you thing
    Elements.each(function(i, e){
        var Parent = $(e);
        var Settings = $( $.base64Decode(Parent.children('.settingshtml').html()) );

        Parent.addClass('transparent');

        // Find Columns
        var Columns = {};
        if (Parent.find('.forms-elem').length > 0){
            Parent.find('.column').each(function(i, e){
                var Elems = $(e).find('.forms-elem').clone();
                Columns['COL_'+e.getAttribute('data-number')] = (Elems);
            });
        }

        var Params = Settings.find(':input').serializeArray();
        Params = Params.concat(FormSettings);
        Params.push({name:'ajax_method', value:'save_field'});
        Params.push({name:'settings[field_hash]', value:Parent[0].getAttribute('data-fieldhash')});

        setTimeout(function(){
            $.post(Forms.MCP_AJAX_URL, Params, function(rData){
                var NewParent = $(rData);
                Parent.replaceWith(NewParent);

                for (var Col in Columns){
                    NewParent.find('.column[data-number='+Col.substr(4)+']').html(Columns[Col]);
                }

                setTimeout(function(){
                    Forms.RefreshFields(DOM, NewParent);
                }, (i*300));

                syncOrderNumbers(DOM);
                activateSortable(DOM);
            });
        }, (i*200));

    });
};

//********************************************************************************* //




//********************************************************************************* //

//********************************************************************************* //




Forms.ChoicesBulkAdd = function(e){
    e.preventDefault();

    var ModalWrapper = $('div.ModalWrapper:first');

    ModalWrapper.load(Forms.MCP_AJAX_URL + '&ajax_method=choices_ajax_ui', function(){
        ModalWrapper.modal();

        // Fill in the Textarea
        ModalWrapper.find('.left a').click(function(E){
            E.preventDefault();
            $('#FormsChoicesText').html( $(E.target).find('span').html() );
        });

        ModalWrapper.find('.btn-primary').click(function(E){
            E.preventDefault();

            var Lines = $('#FormsChoicesText').val().split("\n");
            var Choices = {};

            if (Lines.length === 0) {
                return false;
            }

            for (var i in Lines) {
                Lines[i] = Lines[i].split(' : ');
                if (typeof(Lines[i][1]) != 'undefined') {
                    Choices[ Lines[i][0] ] = Lines[i][1];
                } else Choices[ Lines[i][0] ] = Lines[i][0];
            }

            var Tbody = $(e.target).closest('table').find('tbody');


            for (var Val in Choices){
                Tbody.find('tr:first').clone()
                .find('input[type=radio]').removeAttr('checked').closest('tr')
                .find('td:eq(2)').find('input').val(Val).closest('tr')
                .find('td:eq(1)').find('input').val(Choices[Val]).closest('tr')
                .appendTo(Tbody);
            }

            ModalWrapper.modal('hide');

            setTimeout(function(){
                choicesSyncOrderNumbers(Tbody.parent());
            }, 500);

        });
    });
};

//********************************************************************************* //



//********************************************************************************* //


//********************************************************************************* //

//********************************************************************************* //


//********************************************************************************* //


Forms.ToggleWysiwyg = function(e){
    var parent = $(e.target).closest('.field_settings');
    var val = parent.find('.wysiwyg_toggler input:checked').val();
    var target = parent.find('.wysiwyg_target textarea');

    if (val == 'no') {
        if (target.is(':hidden')) {
            target.redactor('destroy');
        }
        return;
    }

    target.redactor({
        minHeight: 300,
        convertDivs: false
    });
};

    // ----------------------------------------------------------------------

}(window, jQuery));