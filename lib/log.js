/*

	▓█████   ██████  ▄████▄        ▄▄▄██▀▀▀██████ 	╦  ┌─┐┌─┐┌─┐┬┌┐┌┌─┐  ╔╦╗┌─┐┌┬┐┬ ┬┬  ┌─┐
	▓█   ▀ ▒██    ▒ ▒██▀ ▀█          ▒██ ▒██    ▒ 	║  │ ││ ┬│ ┬│││││ ┬  ║║║│ │ │││ ││  ├┤
	▒███   ░ ▓██▄   ▒▓█    ▄         ░██ ░ ▓██▄   	╩═╝└─┘└─┘└─┘┴┘└┘└─┘  ╩ ╩└─┘─┴┘└─┘┴─┘└─┘
	▒▓█  ▄   ▒   ██▒▒▓▓▄ ▄██▒     ▓██▄██▓  ▒   ██▒	|- Handles all logging procedures
	░▒████▒▒██████▒▒▒ ▓███▀ ░ ██▓  ▓███▒ ▒██████▒▒
	░░ ▒░ ░▒ ▒▓▒ ▒ ░░ ░▒ ▒  ░ ▒▓▒  ▒▓▒▒░ ▒ ▒▓▒ ▒ ░	
	 ░ ░  ░░ ░▒  ░ ░  ░  ▒    ░▒   ▒ ░▒░ ░ ░▒  ░ ░	
	   ░   ░  ░  ░  ░         ░    ░ ░ ░ ░  ░  ░  
	   ░  ░      ░  ░ ░        ░   ░   ░       ░  
	                ░          ░       
          
*/
var config;
var colors=require('colors');
var fs=require('fs');

module.exports=function Log(cfg){
	config=cfg;
	
	return {
		doLog:function(type,procedure,data){
			doLog(type,procedure,data);
		}
	}
}

function doLog(type,procedure,data){
	var d=new Date();
	var dat="["+type+"] "+dateString()+" - "+procedure+" - "+data;
	var cType;
	switch (type){
		case 'info':cType=type.cyan;break;
		case 'warn':cType=type.yellow;break;
		case 'error':cType=type.red;break;
	}
	var cDat="["+cType+"] "+dateString()+" - "+procedure+" - "+data;
	
	fs.appendFile(config.logFile,dat,function(err){
		if (err) throw err;
		console.log(cDat);
	});
}

function dateString(){
	var d=new Date(); var h=d.getHours(); var m=d.getMinutes(); var s=d.getSeconds(); var a=h>=12?'pm':'am';
	h=h%12; h=h?h:12; m=m>9?m:"0"+m; s=s>9?s:"0"+s;
	return (d.getMonth()+1)+"/"+d.getDate()+"/"+((d.getFullYear()).toString()).substr(2,2)+" "+h+":"+m+":"+s+" "+a;
}