$.ajaxSetup({
    headers: {
        'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
    }
});
function saveComment(refId, refType, parentId) {
    $.ajax({
        url: '/ajax/saveComment',
        method: 'post',
        data: {refId: refId, refType:refType, parentId:parentId},
        success: function (data) {
            $('#ajaxContent').html(data);
            $('#editChapter').modal('show');
        }
    });
}
function showComment(parentId) {
//    alert('#commentDiv'+parentId);
    if($('#commentDiv'+parentId).is(":hidden")){
        $('#commentDiv'+parentId).show();
    }else{
        $('#commentDiv'+parentId).hide();
    }
}
