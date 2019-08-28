/* 
 * Draw Chart for S-Space
 * 
 * @ author khw
 * @ date 2017-03-22 
 */

var mapChart;
var articlesChart;
var downloadChart;
var postTypeChart;
var itemChart;

(function ($) {

	Highcharts.setOptions({
		global: {
			useUTC: false
		},
		lang: {
			decimalPoint: '.',
			thousandsSep: ','
		}
	});
	
	mapChart = function(data, type) {
		
		var max_axis = type == 0 ? 100000 : 1000000;
		
		Highcharts.mapChart('chart', {
	        title: {
		        text: 'Articles Downloaded from the World'
	        },

	        mapNavigation: {
	            enabled: true,
	            buttonOptions: {
	                verticalAlign: 'bottom',
	                align: 'right',
	            },
	            enableDoubleClickZoomTo: true
	        },

	        colorAxis: {
	            min: 1,
	            max: max_axis,
	            type: 'logarithmic'
	        },
	        
	        legend: {
                layout: 'vertical',
                align: 'left',
                verticalAlign: 'bottom'
            },
            
	        series: [{
	            data: data,
	            mapData: Highcharts.maps['custom/world'],
	            joinBy: ['iso-a2', 'code'],
	            name: 'Download',
	            states: {
	                hover: {
	                    color: '#a4edba'
	                }
	            },
	            tooltip: {
	                valueSuffix: null
	            }
	        }]
	    });
	}
	
	articlesChart = function(data, type) {
		
		var title = type == 0 ? "Monthly" : "Yearly";
		var format = type == 0 ? "%Y - %b" : "%Y";
		
		Highcharts.chart('chart', {
		    chart: {
		        type: 'spline'
		    },
		    title: {
		        text: title + ' Aritcles Posted'
		    },
		    subtitle: {
		        text: null
		    },
		    xAxis: {
		        type: 'datetime',
		        dateTimeLabelFormats: {
		        	month: '%b',
		        	year: '%Y'
		        },
		        labels: {
		            style: {
		                fontSize: '13px'
		            }
		        }
		    },
		    yAxis: {
		        min: 0,
		        title: {
		            text: null
		        }
		    },
		    legend: {
		        enabled: false
		    },
		    tooltip: {
		    	formatter: function() {
		    		return Highcharts.dateFormat(format, new Date(this.x)) + '<br>' +
		    		'<b>' + Highcharts.numberFormat(this.y, 0,'.',',') + '</b> Articles'
		    	}
		    },
		    series: [{
		        name: 'Articles',
		        data: data,
		        dataLabels: {
		            enabled: false
		        }
		    }]
		});
	}
	
	downloadChart = function(data, type) {
		
		var title = type == 0 ? "Monthly" : "Yearly";
		var format = type == 0 ? "%Y - %b" : "%Y";
		
		Highcharts.chart('chart', {
		    chart: {
		        type: 'column'
		    },
		    title: {
		        text: title + ' Aritcles Downloaded'
		    },
		    subtitle: {
		        text: null
		    },
		    xAxis: {
		        type: 'datetime',
		        labels: {
		            style: {
		                fontSize: '13px'
		            }
		        }
		    },
		    yAxis: {
		        min: 0,
		        title: {
		            text: null
		        }
		    },
		    legend: {
		        enabled: false
		    },
		    tooltip: {
		    	formatter: function() {
		    		return Highcharts.dateFormat(format, new Date(this.x))  + '<br>' + 
		    		'<b>' + Highcharts.numberFormat(this.y, 0,'.',',') + '</b> Download'
		    	}
		    },
		    series: [{
		        name: 'Downloads',
		        data: data
		    }]
		});
	}
	
	postTypeChart = function(data, total) {
		Highcharts.chart('chart', {
			chart: {
	            plotBackgroundColor: null,
	            plotBorderWidth: null,
	            plotShadow: false,
				type: 'pie'
			},
		    title: {
		        text: Highcharts.numberFormat(total, 0,'.',','),
		        align: 'center',
		        verticalAlign: 'middle',
		        y: 25
		    },
		    subtitle: {
		    	text: 'Items Type',
		    	style: {
		    		fontSize: '18px',
		    		color: '#333'
		    	},
		    	y: 5
		    },
		    tooltip: {
		        pointFormat: '{series.name}: <b>{point.y}({point.percentage:.1f}%)</b>'
		    },
		    plotOptions: {
		        pie: {
		            dataLabels: {
		                enabled: false
		            },
		            size: 300,
		            startAngle: -90,
		            endAngle: 90,
		            center: ['50%', '90%'],
	            	showInLegend: true
		        },
		    },
		    series: [{
		        //type: 'pie',
		        name: 'Type',
		        innerSize: '50%',
		        data: data
		    }]
		});
	}
	
	itemChart = function(view, download) {
		Highcharts.chart('chart', {
			chart : {
				type : 'bar'
			},
			title : {
				text : null
			},
			subtitle : {
				text : null
			},
			xAxis : {
				categories : [ 'Item' ],
				title : {
					text : null
				}
			},
			yAxis : {
				min : 0,
				title : {
					text : null
				},
				labels : {
					overflow : 'justify'
				}
			},
			tooltip : {
				valueSuffix : null
			},
			plotOptions : {
				bar : {
					dataLabels : {
						enabled : false
					}
				}
			},
			legend : {
				align : 'center',
				verticalAlign : 'bottom',
				x : 0,
				y : 0,
				floating : false,
				borderWidth : 1,
				backgroundColor : ((Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF'),
				shadow : true
			},
			credits : {
				enabled : false
			},
			series : [ {
				name : 'view',
				data : [view],
				color : '#d0b383'
			}, {
				name : 'download',
				data : [download],
				color : '#b9df7c'
			} ]
		});
	}
})(jQuery.noConflict());