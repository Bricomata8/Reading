$(document).ready(function() {
$('#citacion').click(function()
		{
			//window.alert("entro");
		var texto = "";
		var metas = document.getElementsByTagName('meta'); 
		var autores = [];
		var fecha = "";
		var titulo = "";
		var url = "";
		var tipodoc = "";
		var resultadohtml = "";
		var resultadohtmlv = "";
		for (i=0; i<metas.length; i++) { 
			//DC.creator
			if (metas[i].getAttribute("name") == "DC.creator") 
			{ 
				texto = texto + "Autor: " + metas[i].getAttribute("content") + "<br/>"; 
				autores.push(metas[i].getAttribute("content"));
			}
			//DCTERMS.issued
			if (metas[i].getAttribute("name") == "DCTERMS.issued") 
			{ 
				texto = texto + "Fecha: " + metas[i].getAttribute("content") + "<br/>"; 
				fecha = metas[i].getAttribute("content");
			}		
			//DC.title
			if (metas[i].getAttribute("name") == "DC.title") 
			{ 
				texto = texto + "Titulo: " + metas[i].getAttribute("content") + "<br/>"; 
				titulo = metas[i].getAttribute("content");
			}			
			//citation_abstract_html_url
			if (metas[i].getAttribute("name") == "citation_abstract_html_url") 
			{ 
				texto = texto + "URL: " + metas[i].getAttribute("content") + "<br/>"; 
				url = metas[i].getAttribute("content");
			}	
			//DC.type
			if (metas[i].getAttribute("name") == "DC.type") 
			{ 
				tipodoc = metas[i].getAttribute("content");
			}				
		} 
		//window.alert(autores[0] + " si " + autores[1] + "fecha " + fecha + "URL " + url + "titulo" + titulo + " tipodoc " + tipodoc);
		if (tipodoc == "bachelorThesis" || tipodoc == "masterThesis" || tipodoc == "doctoralThesis" || tipodoc == "Article" )
		{
			var titulo = "Tesis";
			if (tipodoc == "Article")
			{
				titulo = "Articulo";
			}
			var apellidos = [];
			var nombres = [];
			var iniciales = [];
			var inicialesv = [];
			for (i=0; i < autores.length; i++) { 
				indice = autores[i].indexOf(",");
				otroindice = indice + 2;
				nombres.push(autores[i].substring(otroindice));
				apellidos.push(autores[i].substring(0, indice));
				var nombresa = "";
				var nombresav = "";
				for (j=0; j < nombres[i].length; j++)
				{
					caracter = nombres[i].charAt(j);
					if (caracter == caracter.toUpperCase() && caracter != " ")
					{
						if (nombresa == "")
						{
							nombresa = caracter + ".";
							nombresav = caracter;
						}else
						{
							nombresa = nombresa + " " + caracter + ".";
							nombresav = nombresav + caracter;
						}
					}
				}
				//nombresav = nombresav + ".";
				iniciales.push(nombresa);
				inicialesv.push(nombresav);
				//resultadohtml = resultadohtml + "Apellidos: '" + apellidos[i] + "'"
				//resultadohtml = resultadohtml + "Nombres: '" + nombres[i] + "'"
			}
			for (i=0; i < apellidos.length; i++)
			{
				if (i == 0)
				{
					resultadohtml += apellidos[i] + ", " + iniciales[i];
					resultadohtmlv += "1. " + apellidos[i] + " " + inicialesv[i];
				}
				else
				{
					resultadohtml += ", &amp; " + apellidos[i] + ", " + iniciales[i];
					resultadohtmlv += ", " + apellidos[i] + " " + inicialesv[i];
					if (i == (apellidos.length - 1))
					{
						resultadohtmlv += ".";
					}
				}
			}
			var hoy = new Date();
			var dd = hoy.getDate();
			var mm = hoy.getMonth() + 1;
			var mes="";
			switch (mm)
			{
				case 1:
					mes = "Enero";
					break;
				case 2:
					mes = "Febrero";
					break;
				case 3:
					mes = "Marzo";
					break;
				case 4:
					mes = "Abril";
					break;
				case 5:
					mes = "Mayo";
					break;
				case 6:
					mes = "Junio";
					break;
				case 7:
					mes = "Julio";
					break;
				case 8:
					mes = "Agosto";
					break;
				case 9:
					mes = "Septiembre";
					break;
				case 10:
					mes = "Octubre";
					break;
				case 11:
					mes = "Noviembre";
					break;
				case 12:
					mes = "Diciembre";
					break;
					
			}
			var yyyy = hoy.getFullYear();
			resultadohtml += " (" + fecha + "). <i>" + titulo + "</i>. Recuperado a partir de " + url;
			resultadohtmlv += " " + titulo + " [Internet]. " + fecha + " [citado el " + dd + " de " + mes + " de " + yyyy + "]. Recuperado a partir de: " + url;
			//" (" + fecha + "). <i>" + titulo + "</i>. Recuperado a partir de " + url;
			//window.alert(resultadohtml);
			/*$( "#basicModal" ).dialog({
				autoOpen: false
			});
			*/
			$( "#basicModal" ).html("<p> <font face='Georgia' size='3'>" + "<b>APA</b> <br/>" + resultadohtml + "<br/><b>Vancouver</b><br/>" + resultadohtmlv + "</font></p>");
			//$( "#basicModal" ).title("funciona");
			$( "#basicModal" ).dialog({
				modal: true,
				title: "Citacion - " + titulo,
				height: 300,
				width: 700
			});
		}

		});
});		
