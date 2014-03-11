/*
															  [ 1.8.1.0 ]											[ 13.2.3.36 ]
	▓█████   ██████  ▄████▄        ▄▄▄██▀▀▀██████ 	╔╦╗┌─┐┌─┐┌─┐┌┐┌┌┬┐┌─┐       ╔═╗┌─┐┌┐┌┌┐┌┌─┐┌─┐┌┬┐┌─┐┌┬┐╔╗ ┬ ┬┌─┐┬┌┐┌┌─┐┌─┐┌─┐
	▓█   ▀ ▒██    ▒ ▒██▀ ▀█          ▒██ ▒██    ▒ 	║║║├─┤│ ┬├┤ │││ │ │ │  ───  ║  │ │││││││├┤ │   │ ├┤  ││╠╩╗│ │└─┐││││├┤ └─┐└─┐
	▒███   ░ ▓██▄   ▒▓█    ▄         ░██ ░ ▓██▄   	╩ ╩┴ ┴└─┘└─┘┘└┘ ┴ └─┘       ╚═╝└─┘┘└┘┘└┘└─┘└─┘ ┴ └─┘─┴┘╚═╝└─┘└─┘┴┘└┘└─┘└─┘└─┘
	▒▓█  ▄   ▒   ██▒▒▓▓▄ ▄██▒     ▓██▄██▓  ▒   ██▒	|- Connects to Magento v2 API				   ╔╗╔┌─┐┌┬┐┌─┐  ╦╔═╗  ╦  ┬┌┐┌┬┌─
	░▒████▒▒██████▒▒▒ ▓███▀ ░ ██▓  ▓███▒ ▒██████▒▒	|- Modifies ConnectedBusiness through MSSQL	   ║║║│ │ ││├┤   ║╚═╗  ║  ││││├┴┐
	░░ ▒░ ░▒ ▒▓▒ ▒ ░░ ░▒ ▒  ░ ▒▓▒  ▒▓▒▒░ ▒ ▒▓▒ ▒ ░	|- Modifies Magento through API				   ╝╚╝└─┘─┴┘└─┘o╚╝╚═╝  ╩═╝┴┘└┘┴ ┴
	 ░ ░  ░░ ░▒  ░ ░  ░  ▒    ░▒   ▒ ░▒░ ░ ░▒  ░ ░												   3.5.14		-	  Steve Rolfe
	   ░   ░  ░  ░  ░         ░    ░ ░ ░ ░  ░  ░  
	   ░  ░      ░  ░ ░        ░   ░   ░       ░  
	                ░          ░       
           
*/

/*
┌┬──────────────┬┐ Configuration,  
││ Load Modules ││ SQL templates
└┴──────────────┴┘ and node_modules 
*/
var templates=require('./lib/templates.js'); // SQL-ready JSON templates
var config=require('./config.js'); // eSC / Magento / MSSQL configuration
var User=require('./lib/user.js');
var Order=require('./lib/order.js');

var soap=require('soap'); // Magento SOAP API
var Connection=require('tedious').Connection; // ConnectedBusiness MSSQL
var Request=require('tedious').Request;

/*
┌┬─────────────────────────┬┐ 
││ Connect to data sources ││ Connects to MSSQL
└┴─────────────────────────┴┘ & Magento SOAP v2 API
*/
var connection=new Connection(config.mssql); // Setup MSSQL connection - Keep alive until polling completed
var user=new User(connection, Request, templates); // Setup user module
var order=new Order(connection, Request, templates, user); // Setup SO module

// Connects to Magento, logs in and starts the polling procedure
soap.createClient(config.magento.url, function(err,client){
	client.login({username:config.magento.user, apiKey:config.magento.key}, function(err,result){
		pollMagento(client,result.loginReturn);
	});
});

/*
┌┬──────────────┬┐ 
││ Poll Magento ││ Lists sales order
└┴──────────────┴┘ updates since last poll
*/
function pollMagento(client,sessionId){
	// List sales orders updated since last update
	client.salesOrderList({sessionId:sessionId, filters:config.magento.pollFilter}, function(err,result){
		// Process list
		processOrders(client,sessionId,result.result.item);
	});
}

/*
┌┬──────────────────────┬┐ 
││ Process Magento Poll ││ 
└┴──────────────────────┴┘  
*/
function processOrders(client,sessionId,orderList){
	if (!Array.isArray(orderList)) orderList=new Array(orderList);
	
	// Iterate through orders, pull more information
	for (var i in orderList){
		client.salesOrderInfo({sessionId:sessionId, orderIncrementId:orderList[i].increment_id}, function(err,result){
			var so=result.result;
			
			// Lookup shipTo/billTo/contact codes, link properly
			user.lookupUser(so, function(cust,bill,ship){
				// Lookup SalesOrder
				order.lookupSalesOrder(so,cust,bill,ship,function(soCode){
					console.log(soCode);
				});
			});
		});
	}
}