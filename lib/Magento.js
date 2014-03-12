/*

	▓█████   ██████  ▄████▄        ▄▄▄██▀▀▀██████ 	╔═╗┌─┐┌┐┌┌┐┌┌─┐┌─┐┌┬┐┌─┐┌┬┐╔╗ ┬ ┬┌─┐┬┌┐┌┌─┐┌─┐┌─┐  ╔╦╗┌─┐┌┬┐┬ ┬┬  ┌─┐
	▓█   ▀ ▒██    ▒ ▒██▀ ▀█          ▒██ ▒██    ▒ 	║  │ │││││││├┤ │   │ ├┤  ││╠╩╗│ │└─┐││││├┤ └─┐└─┐  ║║║│ │ │││ ││  ├┤ 
	▒███   ░ ▓██▄   ▒▓█    ▄         ░██ ░ ▓██▄   	╚═╝└─┘┘└┘┘└┘└─┘└─┘ ┴ └─┘─┴┘╚═╝└─┘└─┘┴┘└┘└─┘└─┘└─┘  ╩ ╩└─┘─┴┘└─┘┴─┘└─┘
	▒▓█  ▄   ▒   ██▒▒▓▓▄ ▄██▒     ▓██▄██▓  ▒   ██▒	|- Central point for ConnectedBusiness manipulation
	░▒████▒▒██████▒▒▒ ▓███▀ ░ ██▓  ▓███▒ ▒██████▒▒	
	░░ ▒░ ░▒ ▒▓▒ ▒ ░░ ░▒ ▒  ░ ▒▓▒  ▒▓▒▒░ ▒ ▒▓▒ ▒ ░	
	 ░ ░  ░░ ░▒  ░ ░  ░  ▒    ░▒   ▒ ░▒░ ░ ░▒  ░ ░	
	   ░   ░  ░  ░  ░         ░    ░ ░ ░ ░  ░  ░  
	   ░  ░      ░  ░ ░        ░   ░   ░       ░  
	                ░          ░       
          
*/

var User=require('./Magento/user.js');
var Order=require('./Magento/order.js');
var templates=require('./Magento/templates.js'); // SOAP templates?
var connection, Request, user, order, log;

module.exports=function Mage(conn, req, lg){
	connection=conn; Request=req; log=lg;
	
	user=new User(connection,Request,templates,log);
	order=new Order(connection,Request,templates,user,log);
	
	return {
		user:user,
		order:order
	}
}