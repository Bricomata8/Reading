var jQueryScriptOutputted = false;
var widgetPath = 'http://localhost:8081/estantevirtual/estante/widget/';

/*function readCookie(name)
{
	var cookiename = name + "=";
	var ca = document.cookie.split(';');

	for(var i=0;i < ca.length;i++)
	{
		var c = ca[i];
		while (c.charAt(0)==' ') c = c.substring(1,c.length);
		if (c.indexOf(cookiename) == 0) return c.substring(cookiename.length,c.length);
	}
	return null;
}*/

function initJQuery() {
    
    //if the jQuery object isn't available
    if (typeof(jQuery) == 'undefined') {
    
        if (! jQueryScriptOutputted) {
            //only output the script once..
            jQueryScriptOutputted = true;
            
            //output the script (load it from google api)
            document.write("<scr" + "ipt type=\"text/javascript\" src=\"https://ajax.googleapis.com/ajax/libs/jquery/1.6.2/jquery.min.js\"></scr" + "ipt>");
        }
        setTimeout("initJQuery()", 50);
    } else {
        if($.ui){
        // jQuery UI is loaded
        }else {
            $.getScript(widgetPath + '../site/lib/jquery/jquery-ui.min.js');
        }
        
        $("head").append("<link>");
        css = $("head").children(":last");
        css.attr({
            rel:  "stylesheet",
            type: "text/css",
            href: widgetPath + "../site/lib/jquery/css/flick/jquery-ui.css"
        });
        
        $(function() {
            $.getScript(widgetPath + 'cookies.js', function(){
            $.getScript(widgetPath + 'geraNomeCurto.js', function(){
                var autor = $('input[name="evAutor"]').val();
                var titulo = $('input[name="evTitulo"]').val();
                var ano = $('input[name="evAno"]').val();
                var nome = '';
                if(autor && ano)
                    nome = geraNomeCurto(autor, ano);
                var usuario = readCookie('ev_user');
                var ticket = readCookie('ev_ticket');
                $.post(widgetPath + 'index.php', 
                    {
                        nome: nome, 
                        autor: autor,
                        titulo: titulo,
                        ano: ano,
                        url: $(location).attr('href'),
                        formato: 'widget',
                        username: usuario,
                        ticket: ticket
                    },
                    function(data){
                        //alert('ok');
                        $('#estante').html(data);
                    }
                )
                .error(function(XMLHttpRequest, textStatus, errorThrown) { 
                    alert(textStatus);
                });
            });
            });
        });
    }
}
initJQuery();
