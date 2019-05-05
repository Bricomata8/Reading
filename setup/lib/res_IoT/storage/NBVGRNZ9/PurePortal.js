function loadNews(cols, rows) {
	if (!cols)
		cols = 3;
	if (!rows)
		rows = 100;
	$.get('https://servicesPublic.tees.ac.uk/PureServices/Download/ResearchNews', null, function (a) { processNews(a, cols, rows); });
}

function processNews(xml, cols, rows) {
	var ps = '<div class="page-section tees-research-news"><div class="container"><div class="row"><div class="cols-1"><h3>Research News</h3></div>{0}</div></div></div>';
	var newsItem = '<div class="cols cols-{class}" style="width:{width}%;"><a href="{link}"><div class="newstitle">{title}</div></a><div class="newsbox">{desc}</div></div>';
	var rowSpacer = '<div class="newsRowSpacer"></div>';

	var splits = xml.split('<item>');
	var items = [];
	var j = 0;
	for (j = 0; j < splits.length; j++) {
		if (splits[j].indexOf('</item>') > 0)
			items.push(splits[j].split('</item>')[0]);
	}

	var allItems = '';
	var newItem = null;
	var title = null;
	var url = null;
	var desc = null;
	var itemWidth = (100 / cols).toString().substring(0, 6);
	var max = cols * rows;
	max = items.length > max ? max : items.length;

	for (j = 0; j < max; j++) {
		title = getTagContents('title', items[j]);
		url = getTagContents('link', items[j]);
		desc = getTagContents('description', items[j]);

		if (j > 0 && j % cols == 0)
			allItems += rowSpacer;

		newItem = newsItem.format('{title}', title).format('{desc}', desc).format('{link}', url).format('{class}', cols).format('{width}', '--**--;'); //itemWidth);
		allItems += newItem;
	}

	if (allItems && allItems.length) {
		ps = ps.split('{0}').join(allItems);
		var ctrl = $(ps);
		$('.page-section.tees-research-news').remove();
		ctrl.insertAfter('.page-section .welcome');
	}
}

function getTagContents(tagName, xml) {
	var start = xml.indexOf('<' + tagName + '>');
	var fin = xml.indexOf('</' + tagName + '>');

	if (start < 0)
		return null;

	if (fin < 0)
		fin = xml.length - 1;


	return xml.substr(start + tagName.length + 2, fin - start - (tagName.length + 2));
}

String.prototype.format = function (tag, replaceWith) {
	var me = this;
	return me.split(tag).join(replaceWith);
}

$(window).load(function () { loadNews(3, 1); });