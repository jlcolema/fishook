;(function(global, $){
    //es5 strict mode
    "use strict";

    var Forms = global.Forms = global.Forms || {};

    // Internal
    var datatables = {}; // Stored tables
    var body = $('body');
    var timeout;

    // ----------------------------------------------------------------------

    Forms.datatable = function(pane) {
        if (!pane || pane.length == 0) return false;

        // find all jQgrid
        pane.find('script.datatable').each(function(index, elem){
            elem = $(elem);

            if (!elem.parent().data('datatable')) {
                elem.parent().data('datatable', new Datatable(elem));
            }
        });
    };

    // ----------------------------------------------------------------------

    function Datatable(scriptElem) {
        var self = this;

        self.settings = $.extend({
            // These are the defaults.
            name: '',
            url: '',
            pagination: 'yes',
            columns: null,
            disabled: 'no'
        }, JSON.parse(scriptElem.html()) );

        if (self.settings.disabled == 'yes') {
            return;
        }

        self.table = scriptElem.parent().find('table');
        self.mainWrapper = scriptElem.closest('.datatable-wrapper');

        // Some Settings
        var tableName = self.settings.name ? self.settings.name : self.settings.url;
        var pagination = (self.settings.pagination == 'no') ? false : true;
        var limitPerPage = self.settings.page_length ? self.settings.page_length : 10;
        var saveState = (self.settings.save_state == 'yes') ? true : false
        var lengthmenu = pagination ? 'l' : '';
        var paginationlinks = pagination ? 'p' : '';
        var totalitems = pagination ? 'i' : '';
        var ajaxUrl = self.settings.url;

        // Misc
        var tableDom = 'R<"toptable">t<"bottomtable" '+lengthmenu+paginationlinks+totalitems+'>';
        var pageLength = pagination ? limitPerPage : -1;

        // Columns
        self.generateVisCols(self.settings.fields);
        var tableColumns = self.parseFields(self.settings.fields);

        //self.table.bind('processing.dt', toggleLoadingIndicator);
        self.table.on('init.dt', $.proxy(self.onInitDt, self));
        self.table.on('draw.dt', $.proxy(self.onDraw, self));

        var dtConfig = {
            paginationType : 'simple', //'full_numbers',
            dom: tableDom,
            ajax: $.proxy(self.ajaxPost, self),
            columns: tableColumns,
            pageLength: pageLength,
            serverSide: true,
            language: {
                lengthMenu: 'Show _MENU_ records',
                info: '_START_ - _END_ of _TOTAL_'
            },
            lengthMenu: [[10, 25, 50, -1], ['10', '25', '50', "All"]],
            //order: [[1,'desc']],
            order: [],

            rowCallback: $.proxy(self.rowCallback, self),

            // State Loading
            //stateSave: saveState,
            //stateDuration: 60 * 60 * 24,
            //stateSaveParams: $.proxy(dtStateSaveParams, self),
            //stateLoadParams: $.proxy(dtStateLoadParams, self)
        }

        self.tableobj = self.table.DataTable(dtConfig);

        datatables[tableName] = self;
    }

    // ----------------------------------------------------------------------

    Datatable.prototype.table = null;
    Datatable.prototype.tableobj = null;
    Datatable.prototype.settings = null;
    Datatable.prototype.mainWrapper = null;

    // ----------------------------------------------------------------------

    Datatable.prototype.refresh = function() {
        this.tableobj.draw();
    };

    // ----------------------------------------------------------------------

    Datatable.prototype.onInitDt = function(evt, settings) {
        var self = this;
    };

    // ----------------------------------------------------------------------

    Datatable.prototype.onDraw = function(evt, settings) {
        var self = this;
    };

    // ----------------------------------------------------------------------

    Datatable.prototype.generateVisCols = function(fields) {
        var self = this;
        var visColsElem = self.mainWrapper.find('.datatable-viscols .scroll-wrap ul');
        visColsElem.empty();

        for (var handle in fields) {
            var checked = (typeof(fields[handle].visible) == 'undefined' || fields[handle].visible) ? 'checked' : '';
            visColsElem.append('<a href="#"><input type="checkbox" ' + checked + '> ' + fields[handle].label + '</a>')
        }
    };

    // ----------------------------------------------------------------------

    Datatable.prototype.parseFields = function(fields) {
        var self = this;
        var cols = [];

        for (var handle in fields) {
            var field = fields[handle];

            var col = {};
            col.data = handle;
            col.name = handle;
            col.title = field.label;
            col.width = (typeof(field.width) != 'undefined') ? field.width : null;
            col.className = (typeof(field.class) != 'undefined') ? field.class : null;
            col.visible = (typeof(field.visible) != 'undefined') ? field.visible : true;
            col.orderable = (typeof(field.sortable) != 'undefined') ? field.sortable : false;

            if (field.name == 'id') {
                col.contentPadding = 'mmm';
            }

            if (field.type == 'checker') {
                col.className = 'checker';
                col.width = 25;
                col.title = '<input type="checkbox">';
                col.defaultContent = '<input type="checkbox">';
                col.orderable = false;
            }

            cols.push(col);
        }

        return cols;
    };

    // ----------------------------------------------------------------------

    Datatable.prototype.ajaxPost = function(data, callback, settings) {
        // Local Caching
        var self = this;
        var table = self.table;

        // Fixed Post
        var fixedPost = table.data('fixed_post_data');
        if (fixedPost) {
            for (var key in fixedPost) {
                data[key] = fixedPost[key];
            }
        }

        // Fixed Data (just like fixed_post_data)
        if (self.settings.fixed_data) {
            for (var key in self.settings.fixed_data) {
                data[key] = self.settings.fixed_data[key];
            }
        }

        // Fixed Filters
        if (self.settings.fixed_filters) {

            if (!data.filters) {
                data.filters = {};
            }

            for (var key in self.settings.fixed_filters) {
                data.filters[key] = self.settings.fixed_filters[key];
            }
        }

        // Send the AJAX request
        $.ajax({
            dataType:'json',
            type:'POST',
            url: self.settings.url,
            data: JSON.stringify(data),
            contentType : 'application/json',
            success:function(rdata){

                for (var i = rdata.data.length - 1; i >= 0; i--) {
                    //rdata.data[i].checker = '<input type="checkbox">';
                }

                // Give it back
                callback(rdata);
            }
        });
    };

    // ----------------------------------------------------------------------

    Datatable.prototype.rowCallback = function(row, data, index) {
        var self = this;

        /*
        if ($.inArray(data.DT_RowId, this.selected) !== -1 ) {
            $(row).addClass('selected').find('.checker input').prop('checked', true);
        }
        */
    };

    // ----------------------------------------------------------------------

    // Trigger it right away
    Forms.datatable(body.find('.datatable-wrapper').parent());

    // ----------------------------------------------------------------------

}(window, jQuery));