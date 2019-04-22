//CKEDITOR.config.htmlEncodeOutput = false;

$.ajaxSetup({
    headers: {
        'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
    }
});
function editChapter(id) {
    $.ajax({
        url: '/ajaxadmin/editchapter',
        method: 'post',
        data: {chapterId: id},
        success: function (data) {
            $('#ajaxContent').html(data);
            $('#editChapter').modal('show');
        }
    });
}

function addChapter(courseId) {
    $.ajax({
        url: '/ajaxadmin/addchapter',
        method: 'post',
        data: {'courseId':courseId},
        success: function (data) {
            $('#ajaxContent').html(data);
            $('#addChapter').modal('show');
        }
    });
}

function saveChapter(id) {
    var formValues = $('#editChapterForm').serialize();
    $.ajax({
        url: '/ajaxadmin/savechapter',
        method: 'post',
        dataType: "json",
        data: formValues,
        success: function (data) {
            if (data.id) {
                $('#chapter-name-' + data.id).html(data.name);
                $('#editChapter').modal('hide');
            }
        }
    });
}

function saveNewChapter() {
    var formValues = $('#addChapterForm').serialize();
    $.ajax({
        url: '/ajaxadmin/savenewchapter',
        method: 'post',
        dataType: "json",
        data: formValues,
        success: function (data) {
            if (data.id) {
                var newChapterContent = '<p><span  id="chapter-name-'+data.id+'">'+data.name+' </span>' +
                        '<a class="btn btn-default btn-xs" onclick="editChapter('+data.id+')"><i class="fa fa-edit"></i> Edit</a> ' +
                        '<a class="btn btn-default btn-xs" href="/admin/lectures?chapterId='+data.id+'"><i class="fa fa-book"></i> Lectures</a>' +
                    '</p>';
                $('#addChapter').modal('hide');
                $('#chapter-list').append(newChapterContent);
            }
        }
    });
}

function editLecture(id) {
    $.ajax({
        url: '/ajaxadmin/editlecture',
        method: 'post',
        data: {lectureId: id},
        success: function (data) {
            $('#ajaxContent').html(data);
            $('#editLecture').modal('show');
            $('textarea.ckeditor').each(function () {
                CKEDITOR.replace($(this).attr('id'));
            });
        }
    });
}

function addLecture(chapterId) {
    $.ajax({
        url: '/ajaxadmin/addlecture',
        method: 'post',
        data: {'chapterId':chapterId},
        success: function (data) {
            $('#ajaxContent').html(data);
            $('#editLecture').modal('show');
            $('textarea.ckeditor').each(function () {
                CKEDITOR.replace($(this).attr('id'));
            });
        }
    });
}

function viewLecture(id) {
    $.ajax({
        url: '/ajaxadmin/viewlecture',
        method: 'post',
        data: {lectureId: id},
        success: function (data) {
            $('#ajaxContent').html(data);
            $('#editLecture').modal('show');            
        }
    });
}


function saveLecture(id) {
    for ( instance in CKEDITOR.instances ){
        CKEDITOR.instances[instance].updateElement();
    }
    var formValues = $('#editLectureForm').serialize();
    $.ajax({
        url: '/ajaxadmin/savelecture',
        method: 'post',
        dataType: "json",
        data: formValues,
        success: function (data) {
            if (data.id) {
                $('#lecture-name-' + data.id).html(data.name);
                $('#editLecture').modal('hide');
            }
        }
    });
}

function saveNewLecture(id) {
    for ( instance in CKEDITOR.instances ){
        CKEDITOR.instances[instance].updateElement();
    }
    var formValues = $('#editLectureForm').serialize();
    $.ajax({
        url: '/ajaxadmin/savenewlecture',
        method: 'post',
        dataType: "json",
        data: formValues,
        success: function (data) {
            if (data.id) {
                $('#lecture-name-' + data.id).html(data.name);
                $('#editLecture').modal('hide');
            }
        }
    });
}
function addForum(id){
    $.ajax({
        url: '/ajaxcustomer/addforum',
        method: 'post',
        data: {userId: id},
        success: function (data) {
            $('#ajaxContent').html(data);
            $('#addForum').modal('show');            
        }
    });
}
function saveNewForum(){
    var formValues = $('#addForumForm').serialize();
    $.ajax({
        url: '/ajaxcustomer/addnewforum',
        method: 'post',
//        dataType: "json",
        data: formValues,
        success: function (data) {
            $('#addForum').modal('hide');   
            location.reload();
        }
    });
}
function replyToForum(id){
    $.ajax({
        url: '/ajaxcustomer/replytoforum',
        method: 'post',
        data: {forumId: id},
        success: function (data) {
            $('#ajaxContent').html(data);
            $('#replyToForum').modal('show');            
        }
    });
}
function saveForumReply(){
    var formValues = $('#addForumReply').serialize();
    $.ajax({
        url: '/ajaxcustomer/addforumreply',
        method: 'post',
        dataType: "json",
        data: formValues,
        success: function (data) {
            $('#replyToForum').modal('hide');   
            location.reload();
        }
    });
}
function replyToForumReply(id){
    $.ajax({
        url: '/ajaxcustomer/replytoforumreply',
        method: 'post',
        data: {replyId: id},
        success: function (data) {
            $('#ajaxContent').html(data);
            $('#replyToForumReply').modal('show');            
        }
    });
}
function saveReplyToForumReply(){
    var formValues = $('#addreplyToForumReply').serialize();
    $.ajax({
        url: '/ajaxcustomer/addreplytoforumreply',
        method: 'post',
        dataType: "json",
        data: formValues,
        success: function (data) {
            $('#replyToForum').modal('hide');   
            location.reload();
        }
    });
}

function likeReply(replyId,forumId){
    $.ajax({
        url: '/ajaxcustomer/likereply',
        method: 'post',
        dataType: "json",
        data: {replyId: replyId,forumId:forumId},
        success: function (data) {
//            location.reload();
        }
    });
}
function unLikeReply(replyId,forumId){
    $.ajax({
        url: '/ajaxcustomer/unlikereply',
        method: 'post',
        dataType: "json",
        data: {replyId: replyId,forumId:forumId},
        success: function (data) {
//            location.reload();
        }
    });
}
function saveComment(refId,refType,commentId){
    var formValues = $('#commentForm'+commentId).serialize();
    $("#submitCcommentBtn"+commentId).attr("disabled", true);
    $.ajax({
        url: '/ajaxcustomer/savecomment',
        method: 'post',
        dataType: "json",
        data: 'refId='+refId+'&refType='+refType+'&commentId='+commentId+'&'+formValues,
        success: function (data) {
            $('#comment'+commentId).val('');
            $("#submitCcommentBtn"+commentId).attr("disabled", false);
            $('#commentDiv'+commentId).append('<div class="alert alert-success" role="alert">Thanks for your response. Your comment is sent for approval.</div>');
        },
        complete: function(){
//            $.ajax({
//                url: '/ajaxcustomer/sendemailtocomment',
//                method: 'post',
//                dataType: "json",
//                data: 'refId='+refId+'&refType='+refType+'&commentId='+commentId+'&'+formValues,
//            });
        }
    });
}

function acceptComment(commentId){
    $.ajax({
        url: '/ajaxadmin/acceptcomment',
        method: 'post',
        dataType: "json",
        data: {commentId: commentId},
        success: function (data) {
            location.reload();
        }
    });
}

function rejectComment(commentId){
    $.ajax({
        url: '/ajaxadmin/rejectcomment',
        method: 'post',
        dataType: "json",
        data: {commentId: commentId},
        success: function (data) {
            location.reload();
        }
    });
}
function deleteCommentOnline(commentId){
    $.ajax({
        url: '/ajaxadmin/deletecomment',
        method: 'post',
        dataType: "json",
        data: {commentId: commentId},
        success: function (data) {
            location.reload();
        }
    });
}
function applyPromo(totalPrice){
    var promoCode = $("#promoCode").val();
    $.ajax({
        url: '/ajaxcustomer/checkPromo',
        method: 'post',
//        dataType: "json",
        data: {promoCode: promoCode,totalPrice:totalPrice},
        success: function (data) {
            if(data == '1'){
                location.href='/checkout';
            }else{
                $("#promationError").show();
                $("#promoCode").val('');
                $("#promoCode").focus();
                $("#promationError").html('Promotion has been expired');
            }
        }
    });
}
function removeCartItems(type,id){
    $.ajax({
        url: '/ajaxcustomer/removecartitems',
        method: 'post',
        dataType: "json",
        data: {type: type,id:id},
        success: function (data) {
            if(data == '1'){
                location.href='/checkout';
            }
        }
    });
}

function openLecture(courseId,lectureId){
    $.ajax({
        url: '/ajaxlecture/openlecture',
        method: 'post',
        data: 'courseId='+courseId+'&lectureId='+lectureId,
        success: function (data) {
            $("#lectureContent").html(data);
            if($('#lectureModal').is(':visible')){                    
            }else{
                 $("#lectureModal").modal('show');
            }
        }
    });
}

function likeComment(commentId){
    $.ajax({
        url: '/ajaxcustomer/likecomment',
        method: 'post',
        dataType: "json",
        data: 'commentId='+commentId,
        success: function (data) {
            $("#userVoteCount"+commentId).html(data.userVoteCount+" Votes");
        }
    });
}
function unlikeComment(commentId){
    $.ajax({
        url: '/ajaxcustomer/unlikecomment',
        method: 'post',
        dataType: "json",
        data: 'commentId='+commentId,
        success: function (data) {
            $("#userVoteCount"+commentId).html(data.userVoteCount+" Votes");
        }
    });
}

function editComment(commentId){
    $.ajax({
        url: '/ajaxcustomer/editcomment',
        method: 'post',
        data: 'commentId='+commentId,
        success: function (data) {
            $('#editCommentDiv').html(data);
            $('#editCommentModal').modal('show');
        }
    }); 
}
function updateComment(){
    var formValues = $('#updateCommentForm').serialize();
    $.ajax({
        url: '/ajaxcustomer/updatecomment',
        method: 'post',
        data: formValues,
        success: function (data) {
            location.reload();
        }
    }); 
}
function copyCommentLink(id){
    var $temp = $("<input>");
    $("body").append($temp);
    $temp.val($("#commentCopy"+id).val()).select();
    document.execCommand("copy");
    $temp.remove();
    $(".copy-success-mgs").hide();
    $("#copy-success"+id).show();
}
