$(document).ready(function() {
	// Expand Panel
	$("#uspopen").click(function(){
		$("div#usppanel").slideDown("slow");
	});	

	// Collapse Panel
	$("#uspclose").click(function(){
		$("div#usppanel").slideUp("slow");	
	});		
	// Switch buttons from "Log In | Register" to "Close Panel" on click
	$("#usptoggle a").click(function () {
		$("#usptoggle a").toggle();
	});		
		
});
 function envia(){ 
  window.open('http://www5.usp.br/?s=' + document.busca.q.value + '&busca=g' ,'_blank');
 }
 function envia2(){ 
 valor = escape(document.busca.q.value);
  window.open('http://sistemas.usp.br/urania/pessoaListar?incfonema=sim&codund=0&nomabvset=&incalu=aluno&incfun=funcionario&incdoc=docente&texto=' + valor + '','_blank');
 }
