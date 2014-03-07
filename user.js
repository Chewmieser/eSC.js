/*

	▓█████   ██████  ▄████▄        ▄▄▄██▀▀▀██████ 	╦ ╦┌─┐┌─┐┬─┐  ╔╦╗┌─┐┌┬┐┬ ┬┬  ┌─┐
	▓█   ▀ ▒██    ▒ ▒██▀ ▀█          ▒██ ▒██    ▒ 	║ ║└─┐├┤ ├┬┘  ║║║│ │ │││ ││  ├┤
	▒███   ░ ▓██▄   ▒▓█    ▄         ░██ ░ ▓██▄   	╚═╝└─┘└─┘┴└─  ╩ ╩└─┘─┴┘└─┘┴─┘└─┘
	▒▓█  ▄   ▒   ██▒▒▓▓▄ ▄██▒     ▓██▄██▓  ▒   ██▒	|- Handles user lookup / insertion
	░▒████▒▒██████▒▒▒ ▓███▀ ░ ██▓  ▓███▒ ▒██████▒▒	|- Creates Customer, ShipTo, Account and CRMContact
	░░ ▒░ ░▒ ▒▓▒ ▒ ░░ ░▒ ▒  ░ ▒▓▒  ▒▓▒▒░ ▒ ▒▓▒ ▒ ░	
	 ░ ░  ░░ ░▒  ░ ░  ░  ▒    ░▒   ▒ ░▒░ ░ ░▒  ░ ░	
	   ░   ░  ░  ░  ░         ░    ░ ░ ░ ░  ░  ░  
	   ░  ░      ░  ░ ░        ░   ░   ░       ░  
	                ░          ░       
          
*/
var connection, Request, templates;

module.exports=function User(conn, req, tmp){
	connection=conn; Request=req; templates=tmp;
	
	return {
		resolveCustomerCode:function(so,callback){
			resolveCustomer(so,callback);
		},
		resolveShipToCode:function(so,custCode,callback){
			resolveShipTo(so,custCode,callback);
		},
		resolveContactCode:function(so,custCode,callback){
			resolveContact(so,custCode,callback);
		},
		resolveAddress:function(postCode,callback){
			resolveAddress(postCode,callback);
		},
		lookupUser:function(so,callback){
			lookupUser(so,callback);
		}
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