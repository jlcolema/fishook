function bindSortable(o){var o="ul.nested-list";$(o).sortable({axis:"y",// Only allow vertical dragging
containment:"parent",// Contain to parent
handle:".list-reorder",// Set drag handle
items:"> li",// Only allow these to be sortable
sort:EE.sortable_sort_helper,// Custom sort handler
forcePlaceholderSize:!0})}function didLoad(){bindToolbar(),bindSortable(),EE.grid(document.getElementById("submenu"),EE.grid_field_settings.submenu);var o=$("div.box",modal).find('select[name="type"]'),e={name:$("div.box",modal).find('.col-group[data-group="name"]'),link:$("div.box",modal).find('.col-group[data-group="link"]'),addon:$("div.box",modal).find('.col-group[data-group="addon"]'),submenu:$("div.box",modal).find('.col-group[data-group="submenu"]')};o.on("change",function(){var o=$(this).val();switch(e.name.hide(),e.link.hide(),e.addon.hide(),e.submenu.hide(),o){case"link":case"submenu":e.name.show()}e[o].show().parent().find(".col-group:visible").removeClass("last").last().addClass("last")}).trigger("change"),
// Bind validation
EE.cp.formValidation.init(modal.find("form")),$("form",modal).on("submit",function(){return $.post(this.action,$(this).serialize(),function(o){"string"===$.type(o)?$("div.box",modal).html(o.body):(o.reorder_list&&($(".nestable").replaceWith(o.reorder_list),didLoad()),modal.trigger("modal:close"))}),!1})}function loadEditModal(o){var e=EE.item_edit_url.replace("###",o);$("div.box",modal).load(e,didLoad)}function loadCreateModal(){var o=EE.item_create_url;modal.trigger("modal:open"),$("div.box",modal).load(o,didLoad)}function bindToolbar(){var o=$("body"),e=$("button[rel=modal-menu-item]"),t="a[rel=modal-menu-edit]",a="a[rel=modal-menu-confirm-remove]";e.on("click",function(o){o.preventDefault(),loadCreateModal()}),o.on("click",t,function(o){o.preventDefault(),loadEditModal($(this).data("content-id"))}),o.on("click",a,function(o){var e=$("."+$(this).attr("rel"));$(this);o.preventDefault(),
// Add the name of the item we're deleting to the modal
$(".checklist",e).html("").append("<li>"+$(this).data("confirm")+"</li>"),$('input[name="item_id"]',e).val($(this).data("content-id")),e.find("form").submit(function(){return $.post(this.action,$(this).serialize(),function(o){e.trigger("modal:close");
// reset the form button
var t=$(".form-ctrls input.btn, .form-ctrls button.btn",e);t.removeClass("work"),t.val(t.data("submit-text")),o.reorder_list&&($(".nestable").replaceWith(o.reorder_list),didLoad())}),!1})})}var modal=$(".modal-menu-edit");bindToolbar(),bindSortable();