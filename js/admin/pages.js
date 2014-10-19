intelli.pagesUrl = intelli.config.admin_url + '/pages/';

function fillUrlBox()
{
	var externalUrl = $('#unique').prop('checked');
	var customUrl = $('#custom_url').val();
	var name = $('input[name="name"]').val();

	var params = {
		get: 'url',
		name: name,
		url: $('input[name="alias"]').val(),
		parent: $('#js-field-parent').val(),
		ext: $('input[name="extension"]').val()
	};

	if (externalUrl && '' != customUrl)
	{
		sendQuery(params);
	}
	else if (!externalUrl && '' != name)
	{
		sendQuery(params);
	}
}

function sendQuery(params)
{
	$.get(intelli.pagesUrl + 'read.json', params, function(response)
	{
		var $placeholder = $('.text-danger', '#js-alias-placeholder');
		if ('string' == typeof response.url)
		{
			$placeholder
				.text(response.url)
				.fadeIn();

			response.exists
				? $placeholder.append('<div class="alert alert-info" id="js-exist-url-alert">' + _t('custom_url_exist') + '</div>')
				: $('#js-exist-url-alert').remove();
		}
		else
		{
			$placeholder.fadeOut();
		}
	});
}

Ext.onReady(function()
{
	if (Ext.get('js-grid-placeholder'))
	{
		intelli.pages = new IntelliGrid(
		{
			columns: [
				'selection',
				'expander',
				{name: 'name', title: _t('name'), width: 150},
				{name: 'title', id: 'titleCol', title: _t('title'), width: 1, sortable: false},
				{name: 'url', title: _t('url'), width: 1},
				'status',
				{name: 'last_updated', title: _t('last_updated'), width: 170},
				'update',
				'delete'
			],
			expanderTemplate: '{content}',
			fields: ['content', 'default'],
			statuses: ['active', 'inactive', 'draft'],
			texts:
			{
				delete_single: _t('are_you_sure_to_delete_this_page'),
				delete_multiple: _t('are_you_sure_to_delete_selected_pages')
			},
		}, false);
		intelli.pages.toolbar = new Ext.Toolbar({items:[
		{
			emptyText: _t('name'),
			xtype: 'textfield',
			name: 'name',
			listeners: intelli.gridHelper.listener.specialKey
		},{
			emptyText: _t('fields_item_filter'),
			xtype: 'combo',
			typeAhead: true,
			editable: false,
			store: intelli.gridHelper.store.ajax(intelli.pagesUrl + 'read.json?get=plugins'),
			displayField: 'title',
			name: 'extras',
			valueField: 'value'
		},{
			handler: function(){intelli.gridHelper.search(intelli.pages)},
			id: 'fltBtn',
			text: '<i class="i-search"></i> ' + _t('search')
		},{
			handler: function(){intelli.gridHelper.search(intelli.pages, true)},
			text: '<i class="i-close"></i> ' + _t('reset')
		}]});

		intelli.pages.init();

		intelli.pages.grid.getView().getRowClass = function(record, rowIndex, rowParams, store)
		{
			if (1 == record.get('default'))
			{
				return 'grid-row-customly-highlighted';
			}

			return '';
		}
	}
	else
	{
		$('#js-delete-page').on('click', function()
		{
			Ext.Msg.confirm(_t('confirm'), _t('are_you_sure_to_delete_this_page'), function(btn, text)
			{
				if (btn == 'yes')
				{
					$.ajax(
					{
						data: {'id[]': $('input[name="id"]').val()},
						dataType: 'json',
						failure: function()
						{
							Ext.MessageBox.alert(_t('error'));
						},
						type: 'POST',
						url: intelli.pagesUrl + 'delete.json',
						success: function(response)
						{
							if ('boolean' == typeof response.result && response.result)
							{
								intelli.notifFloatBox({msg: response.message, type: response.result ? 'success' : 'error'});
								document.location = intelli.pagesUrl;
							}
						}
					});
				}
			});
		});
	}
});

$(function()
{
	$('input[name="preview"]').on('click', function()
	{
		$('#page_form').attr('target', '_blank');
		$('#js-csrf-protection-code').val($('input[name="prevent_csrf"]:first', '#csrf_for_preview').val());
	});

	$('input[name="save"]').on('click', function(e)
	{
		$('#page_form').removeAttr('target');
		$('#js-csrf-protection-code').val($('input[name="prevent_csrf"]:first', '#csrf_for_save').val());
	});

	$('input[name="unique"]').on('change', function()
	{
		var obj = $('input[name="preview"]');
		this.value == 1 ? obj.hide() : obj.show();

		if ($.trim($('input[name="name"]').val()).length > 0)
		{
			fillUrlBox();
		}

		var display = (1 == $(this).val()) ? 'none' : 'block';

		$('#url_field').css('display', (display == 'block' ? 'none' : 'block'));
		$('#ckeditor, #page_options').css('display', display);
	}).trigger('change');

	$('input[name="name"], input[name="alias"]').on('blur', fillUrlBox);
	$('#js-field-parent').on('change', fillUrlBox);

	// Page content language tabs
	$('a[data-toggle="tab"]', '#ckeditor').on('shown.bs.tab', function(e)
	{
		CKEDITOR.instances['contents['+$(this).text()+']']
			|| intelli.ckeditor('contents['+$(this).text()+']', {toolbar: 'Extended'});

		$('#js-active-language').val($(this).data('language'));
	});
	$('a[data-toggle="tab"]:first', '#ckeditor').trigger('shown.bs.tab');

	// page extension dropdown
	$('a', '#js-page-extension-list').on('click', function(e)
	{
		e.preventDefault();

		var text = $(this).text();
		var value  = $(this).data('extension');

		$('input[name="extension"]').val(value);
		$(this).parent().addClass('active').siblings().removeClass('active');
		$(this).closest('div').find('button').html(text + ' <span class="caret"></span>');

		fillUrlBox();
	});
});