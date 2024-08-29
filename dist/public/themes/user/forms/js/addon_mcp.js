;(function(global, $){
    //es5 strict mode
    "use strict";

    var Forms = global.Forms = global.Forms || {};
    $('body').on('click', '.fentry-open', openFormSubmission);

    $('.select2-multiple').select2();

    // ----------------------------------------------------------------------

    function openFormSubmission(evt) {
        evt.preventDefault();
        var id = $(evt.currentTarget).data('id');

        // Open the modal
        var modal = $('.modal-fentry-open');
        modal.trigger('modal:open');

        $.ajax({
            url: Forms.MCP_AJAX_URL + '&ajax_method=show_fentry&fentry_id=' + id,
            method: 'POST', dataType: 'html',
            data: {},
            error: function(xhr) {

            },
            success: function(rdata) {
                modal.find('.box:first').html(rdata);
            }
        });
    }

    // ----------------------------------------------------------------------

}(window, jQuery));