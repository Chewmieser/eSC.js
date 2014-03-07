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
var templates=require('./templates.js'); // SQL-ready JSON templates
var config=require('./config.js'); // eSC / Magento / MSSQL configuration

var soap=require('soap'); // Magento SOAP API
var Connection=require('tedious').Connection; // ConnectedBusiness MSSQL
var Request=require('tedious').Request;

/*
┌┬─────────────────────────┬┐ 
││ Connect to data sources ││ Connects to MSSQL
└┴─────────────────────────┴┘ & Magento SOAP v2 API
*/
// Setup MSSQL connection - Keep alive until polling completed
var connection=new Connection(config.mssql);

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
			lookupUser(so, function(cust,bill,ship){
				// If all resolved, continue with SalesOrder creation		// -- VERIFY NOT IMPORTED! MODIFY IF IMPORTED
				var soTmp=templates.salesOrder(so,cust,bill,ship);
				
				// Resolve Bill-to
				resolveAddress(soTmp.BillToPostalCode,function(addr){
					soTmp.BillToState=addr.StateCode.value;
					soTmp.BillToCounty=addr.County.value;
					soTmp.BillToCountry=addr.CountryCode.value;
					soTmp.BillToCity=addr.City.value;
					
					// Resolve Ship-to
					resolveAddress(soTmp.ShipToPostalCode,function(addr){
						soTmp.ShipToState=addr.StateCode.value;
						soTmp.ShipToCounty=addr.County.value;
						soTmp.ShipToCountry=addr.CountryCode.value;
						soTmp.ShipToCity=addr.City.value;
						
						// Generate SQL for insertion
						console.log(soTmp);
					});
				});
			});
			
			// SKUs available directly in the SO - Cross-ref in CB to add itemCodes into SalesOrderDetail
			// console.log(so.items);
		});
	}
}

// Master lookup function - resolve all codes before callback
function lookupUser(so,callback){
	resolveCustomerCode(so,function(custCode){
		resolveShipToCode(so,custCode,function(shipCode){
			resolveContactCode(so,custCode,function(contCode){
				callback(custCode,contCode,shipCode);
			});
		});
	});
}

/*
┌┬──────────────────────────────────┬┐ 
││ Handle ConnectedBusiness lookups ││ 
└┴──────────────────────────────────┴┘  
*/
// Lookup Customer, resolve code
function resolveCustomerCode(so,callback){
	// Lookup CustomerCode by email address
	var resolveUser=new Request("SELECT CustomerCode FROM Customer WHERE Email='"+so.customer_email+"'",function(err,rowCount,custRows){
		if (rowCount==0 && !err){
			// Create customer if we couldn't find an existing customer
			createCustomer(so,callback);
		}
		
		if (rowCount>0){
			// Callback if customer was located
			callback(custRows[0].CustomerCode.value);
		}
	});
	
	connection.execSqlBatch(resolveUser);
}

// Lookup CustomerShipTo, resolve code
function resolveShipToCode(so,custCode,callback){
	// Lookup ShipToCode by street and CustomerCode
	var resolveShipCode=new Request("SELECT ShipToCode FROM CustomerShipTo WHERE Address LIKE '"+so.shipping_address.street+"' AND CustomerCode='"+custCode+"'",function(err,rowCount,shipRows){
		if (rowCount==0 && !err){
			// Create ShipTo with Customer if we couldn't find an existing shipTo
			createShipTo(custCode,so,callback);
		}
	
		if (rowCount>0){
			// Callback if ShipTo was located
			callback(shipRows[0].ShipToCode.value);
		}
	});

	connection.execSqlBatch(resolveShipCode);
}

// Lookup CRMContact, resolve code
function resolveContactCode(so,custCode,callback){
	// Lookup ContactCode by email and CustomerCode
	var resolveBillCode=new Request("SELECT ContactCode FROM CRMContact WHERE Email1='"+so.customer_email+"' AND EntityCode='"+custCode+"'",function(err,rowCount,contRows){
		if (rowCount==0 && !err){
			// Create Contact with Customer if we couldn't find an existing contact
			createContact(custCode,so,callback);
		}
		
		if (rowCount>0){
			// Callback if contact was located
			callback(contRows[0].ContactCode.value);
		}
	});
	
	connection.execSqlBatch(resolveBillCode);
}

function resolveAddress(postCode,callback){
	var getCode=new Request("SELECT StateCode, County, City, CountryCode, TimeZone FROM SystemPostalCode WHERE PostalCode='"+postCode+"'",function(err,rowCount,docRows){
		callback(docRows[0]);
	});
	
	connection.execSqlBatch(getCode);
}

function createCustomer(so,callback){
	// Create customerCode
	var genCode=new Request("DECLARE @docCode NVARCHAR(30);EXEC [dbo].GenerateDocumentCode @Transaction='CustomerDetail', @DocumentCode=@docCode output;SELECT @docCode;",function(err,rowCount,docRows){
		var customerCode=docRows[0][0].value;
		
		// Generate template
		var soTmp=templates.customer(customerCode,so);
		
		resolveAddress(soTmp.PostalCode,function(addr){
			soTmp.State=addr.StateCode.value;
			soTmp.County=addr.County.value;
			soTmp.Country=addr.CountryCode.value;
			soTmp.City=addr.City.value;
			
			// Finalize SQL
			var sql=templates.generateSQLByTemplate("INSERT","Customer",soTmp);
			
			var createCustomer=new Request(sql,function(err,rowCount,custRows){
				if (err){
					console.log(err);
				}else{
					// Generate account codes and callback when done
					createCustAcctCodes(customerCode,function(){
						callback(customerCode);
					});
				}
			});
			
			connection.execSqlBatch(createCustomer);
		});
	});
	
	connection.execSqlBatch(genCode);
}

function createCustAcctCodes(customerCode,callback){
	var code=new Request("INSERT INTO CustomerAccount (CustomerCode, PostingCode, PostingDescription, Category, AccountCode, AccountDescription, AccountGroup, AccountType, UserCreated, UserModified) VALUES ('"+customerCode+"','SOD-01','Expense - Confirmed Cost of Goods Sold','Sales Order Item Lines','5000-1','Cost of Goods, CDD','Expenses','Cost of Goods Sold','eSC','eSC');"+
						 "INSERT INTO CustomerAccount (CustomerCode, PostingCode, PostingDescription, Category, AccountCode, AccountDescription, AccountGroup, AccountType, UserCreated, UserModified) VALUES ('"+customerCode+"','SOD-03','Revenue - Sales','Sales Order Item Lines','4000-1','Revenue , CDD','Revenues','Sales','eSC','eSC');"+
						 "INSERT INTO CustomerAccount (CustomerCode, PostingCode, PostingDescription, Category, AccountCode, AccountDescription, AccountGroup, AccountType, UserCreated, UserModified) VALUES ('"+customerCode+"','SOD-04','Revenue - Returns','Sales Order Item Lines','4200-1','Sales Returns and Allowances, CDD','Revenues','Sales','eSC','eSC');"+
						 "INSERT INTO CustomerAccount (CustomerCode, PostingCode, PostingDescription, Category, AccountCode, AccountDescription, AccountGroup, AccountType, UserCreated, UserModified) VALUES ('"+customerCode+"','SOD-05','Revenue - Service / Non Stock','Sales Order Item Lines','4000-1','Revenue , CDD','Revenues','Sales','eSC','eSC');"+
						 "INSERT INTO CustomerAccount (CustomerCode, PostingCode, PostingDescription, Category, AccountCode, AccountDescription, AccountGroup, AccountType, UserCreated, UserModified) VALUES ('"+customerCode+"','SOH-01','Revenue - Freight','Sales Order Header','4100-1','Freight Revenue, CDD','Revenues','Sales','eSC','eSC');"+
						 "INSERT INTO CustomerAccount (CustomerCode, PostingCode, PostingDescription, Category, AccountCode, AccountDescription, AccountGroup, AccountType, UserCreated, UserModified) VALUES ('"+customerCode+"','SOH-02','Revenue - Other','Sales Order Header','7100-0','Other Income','Revenues','Other Income','eSC','eSC');",function(err,rowCount,acctRows){
							if (err){
								console.log(err);
							}else{
								callback();
							}
						});

	connection.execSqlBatch(code);
}

function createCustShipAcctCodes(customerCode,shipToCode,callback){
	var code=new Request("INSERT INTO CustomerAccount (CustomerCode, ShipToCode, PostingCode, PostingDescription, Category, AccountCode, AccountDescription, AccountGroup, AccountType, UserCreated, UserModified) VALUES ('"+customerCode+"','"+shipToCode+"','SOD-01','Expense - Confirmed Cost of Goods Sold','Sales Order Item Lines','5000-1','Cost of Goods, CDD','Expenses','Cost of Goods Sold','eSC','eSC');"+
						 "INSERT INTO CustomerAccount (CustomerCode, ShipToCode, PostingCode, PostingDescription, Category, AccountCode, AccountDescription, AccountGroup, AccountType, UserCreated, UserModified) VALUES ('"+customerCode+"','"+shipToCode+"','SOD-03','Revenue - Sales','Sales Order Item Lines','4000-1','Revenue , CDD','Revenues','Sales','eSC','eSC');"+
						 "INSERT INTO CustomerAccount (CustomerCode, ShipToCode, PostingCode, PostingDescription, Category, AccountCode, AccountDescription, AccountGroup, AccountType, UserCreated, UserModified) VALUES ('"+customerCode+"','"+shipToCode+"','SOD-04','Revenue - Returns','Sales Order Item Lines','4200-1','Sales Returns and Allowances, CDD','Revenues','Sales','eSC','eSC');"+
						 "INSERT INTO CustomerAccount (CustomerCode, ShipToCode, PostingCode, PostingDescription, Category, AccountCode, AccountDescription, AccountGroup, AccountType, UserCreated, UserModified) VALUES ('"+customerCode+"','"+shipToCode+"','SOD-05','Revenue - Service / Non Stock','Sales Order Item Lines','4000-1','Revenue , CDD','Revenues','Sales','eSC','eSC');"+
						 "INSERT INTO CustomerAccount (CustomerCode, ShipToCode, PostingCode, PostingDescription, Category, AccountCode, AccountDescription, AccountGroup, AccountType, UserCreated, UserModified) VALUES ('"+customerCode+"','"+shipToCode+"','SOH-01','Revenue - Freight','Sales Order Header','4100-1','Freight Revenue, CDD','Revenues','Sales','eSC','eSC');"+
						 "INSERT INTO CustomerAccount (CustomerCode, ShipToCode, PostingCode, PostingDescription, Category, AccountCode, AccountDescription, AccountGroup, AccountType, UserCreated, UserModified) VALUES ('"+customerCode+"','"+shipToCode+"','SOH-02','Revenue - Other','Sales Order Header','7100-0','Other Income','Revenues','Other Income','eSC','eSC');",function(err,rowCount,acctRows){
							if (err){
								console.log(err);
							}else{
								callback();
							}
						});

	connection.execSqlBatch(code);
}

function createShipTo(custCode,so,callback){
	// Create shipToCode
	var genCode=new Request("DECLARE @docCode NVARCHAR(30);EXEC [dbo].GenerateDocumentCode @Transaction='CustomerShipTo', @DocumentCode=@docCode output;SELECT @docCode;",function(err,rowCount,docRows){
		var shipToCode=docRows[0][0].value;
		
		// Generate template
		var soTmp=templates.customerShipTo(shipToCode,custCode,so);
		
		resolveAddress(soTmp.PostalCode,function(addr){
			soTmp.State=addr.StateCode.value;
			soTmp.County=addr.County.value;
			soTmp.Country=addr.CountryCode.value;
			soTmp.City=addr.City.value;
			
			// Finalize SQL
			var sql=templates.generateSQLByTemplate("INSERT","CustomerShipTo",soTmp);
			
			var createCustomerShipTo=new Request(sql,function(err,rowCount,custRows){
				if (err){
					console.log(err);
				}
				
				var fixCustShipTo=new Request("UPDATE Customer SET DefaultShipToCode='"+shipToCode+"' WHERE CustomerCode='"+custCode+"'",function(err,rowCount,rows){
					if (err){
						console.log(err);
					}else{
						// Generate account codes and callback when done
						createCustShipAcctCodes(custCode,shipToCode,function(){
							callback(shipToCode);
						});
					}
				})
				
				connection.execSqlBatch(fixCustShipTo);
			});
			
			connection.execSqlBatch(createCustomerShipTo);
		});
		
	});
	
	connection.execSqlBatch(genCode);
}

function createContact(custCode,so,callback){
	// Create contactCode
	var genCode=new Request("DECLARE @docCode NVARCHAR(30);EXEC [dbo].GenerateDocumentCode @Transaction='CustomerContact', @DocumentCode=@docCode output;SELECT @docCode;",function(err,rowCount,docRows){
		var contactCode=docRows[0][0].value;
		
		// Generate template
		var soTmp=templates.customerContact(contactCode,custCode,so);
		
		resolveAddress(soTmp.PostalCode,function(addr){
			soTmp.State=addr.StateCode.value;
			soTmp.County=addr.County.value;
			soTmp.Country=addr.CountryCode.value;
			soTmp.City=addr.City.value;
			soTmp.TimeZone=addr.TimeZone.value;
			
			// Finalize SQL
			var sql=templates.generateSQLByTemplate("INSERT","CRMContact",soTmp);
			
			var createCustomerContact=new Request(sql,function(err,rowCount,contRows){
				if (err){
					console.log(err);
				}
				
				var fixCustContact=new Request("UPDATE Customer SET DefaultContact='"+contactCode+"' WHERE CustomerCode='"+custCode+"'",function(err,rowCount,rows){
					if (err){
						console.log(err);
					}else{
						callback(contactCode);
					}
				})
				
				connection.execSqlBatch(fixCustContact);
			});
			
			connection.execSqlBatch(createCustomerContact);
		});
		
	});
	
	connection.execSqlBatch(genCode);
}