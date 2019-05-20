$(document).ready(function() {
    var dialogContainer = $('#dialogContainer');
    var referencesTable = $('table.compilation-of-references');

    $(document).ready(function() {
        var buttons = referencesTable.find('.btn-follow-reference');
        buttons.each(function(index, element) {
            var doi = $(element).data('doi');
            var googleScholarUrl = $(element).data('gsurl');

            if (!doi && !googleScholarUrl) {
                $(element).remove();
            }
        });
    });

    referencesTable.on('click', 'button.btn-follow-reference', function(evt) {
        evt.preventDefault();

        var button = $(this);
        
        var content = $('<div>').addClass('list-group.follow-reference-links');

        var doi = button.data('doi');

        if (doi) {
            var doiOrgUrl = 'https://doi.org/' + doi;

            var crossRefLink = $('<a>').addClass('list-group-item').attr('href', doiOrgUrl)
                                       .append($('<h4>').addClass('list-group-item-heading').text('CrossRef'),
                                               $('<p>').addClass('list-group-item-text').text('Follow this reference with CrossRef'))
                                       .appendTo(content);
            
            var doiOrgLink = $('<a>').addClass('list-group-item').attr('href', doiOrgUrl)
                                     .append($('<h4>').addClass('list-group-item-heading').text('DOI.org'),
                                             $('<p>').addClass('list-group-item-text').text('Follow this reference with DOI.org'))
                                     .appendTo(content);
            
        }

        var googleScholarUrl = button.data('gsurl');
        if (googleScholarUrl) {
            var googleScholarLink = $('<a>').addClass('list-group-item').attr('href', URI.decode(googleScholarUrl))
                                            .append($('<h4>').addClass('list-group-item-heading').text('Google Scholar'),
                                                    $('<p>').addClass('list-group-item-text').text('Follow this reference with Google Scholar'))
                                            .appendTo(content);

        }
            
        //dialogContainer.html(content);

        //var DialogTypes = [
        //    BootstrapDialog.TYPE_DEFAULT,
        //    BootstrapDialog.TYPE_INFO,
        //    BootstrapDialog.TYPE_PRIMARY,
        //    BootstrapDialog.TYPE_SUCCESS,
        //    BootstrapDialog.TYPE_WARNING,
        //    BootstrapDialog.TYPE_DANGER
        //];

        BootstrapDialog.show({
            size: BootstrapDialog.SIZE_NORMAL,
            cssClass: 'gateway-dialog',
            message: content,
            buttons: [{
                label: 'Close',
                cssClass: 'btn-default',
                action: function(dialogRef) {
                    dialogRef.close();
                }
            }],
            title: 'Follow Reference',
            draggable: false,
            type: BootstrapDialog.TYPE_PRIMARY,
            closable: true,
            closeByBackdrop: false,
            closeByKeyboard: true,
            animate: true
        });

        //dialogContainer.dialog({
        //    modal: true,
        //    autoOpen: false,
        //    dialogClass: 'gateway-dialog',
        //    title: 'Follow Reference',
        //    resizable: false,
        //    draggable: false,
        //    buttons: [{
        //        text: 'Close',
        //        "class": 'btn btn-default',
        //        click: function() {
        //            $(this).dialog('close');
        //        }
        //    }],
        //    close: function(event, ui) {
        //    }
        //});

        //dialogContainer.dialog('open');
    });
});
