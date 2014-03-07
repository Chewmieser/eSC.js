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

// Export skeleton
// - Saves connection, request and templates link
// - Exposes esc.js public functions
module.exports=function User(conn, req, tmp){
	connection=conn; Request=req; templates=tmp;
	
	return {
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
	resolveCode(so,'','cust',function(custCode){
		resolveCode(so,custCode,'ship',function(shipCode){
			resolveCode(so,custCode,'cont',function(contCode){
				callback(custCode,contCode,shipCode);
			});
		});
	});
}

// Looks up code [customer, shipTo, contact] and creates if needed
function resolveCode(so,custCode,resType,callback){
	var sql="SELECT ";
	switch (resType){
		case 'cust':sql+="CustomerCode FROM Customer WHERE Email='"+so.customer_email+"'";break;
		case 'ship':sql+="ShipToCode FROM CustomerShipTo WHERE Address LIKE '"+so.shipping_address.street+"' AND CustomerCode='"+custCode+"'";break;
		case 'cont':sql+="ContactCode FROM CRMContact WHERE Email1='"+so.customer_email+"' AND EntityCode='"+custCode+"'";break;
	}
	
	var resolveCode=new Request(sql,function(err,rowCount,codeRows){
		if (rowCount==0 && !err){
			switch (resType){
				case 'cust':sql+=createCustomer(so,callback);break;
				case 'ship':sql+=createShipTo(custCode,so,callback);break;
				case 'cont':sql+=createContact(custCode,so,callback);break;
			}
		}
		
		if (rowCount>0){
			callback(codeRows[0][0].value);
		}
	});
	
	connection.execSqlBatch(resolveCode);
}

// Looks up address pieces by postal code
function resolveAddress(postCode,callback){
	var getCode=new Request("SELECT StateCode, County, City, CountryCode, TimeZone FROM SystemPostalCode WHERE PostalCode='"+postCode+"'",function(err,rowCount,docRows){
		callback(docRows[0]);
	});
	
	connection.execSqlBatch(getCode);
}

// Creates customerCode, customer and triggers createCustAcctCodes
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
					createAcctCodes(customerCode,'',function(){
						callback(customerCode);
					});
				}
			});
			
			connection.execSqlBatch(createCustomer);
		});
	});
	
	connection.execSqlBatch(genCode);
}

// Creates shipToCode, shipTo, links customer with shipTo and triggers createCustShipAcctCodes
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
						createAcctCodes(custCode,shipToCode,function(){
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

// Creates contactCode, contact and links customer with contact
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

// Links customer or shipTo with proper accounting codes
function createAcctCodes(customerCode,shipToCode,callback){
	var code=new Request("INSERT INTO CustomerAccount (CustomerCode, "+shipToCode!=''?shipToCode+', ':''+"PostingCode, PostingDescription, Category, AccountCode, AccountDescription, AccountGroup, AccountType, UserCreated, UserModified) VALUES ('"+customerCode+"',"+(shipToCode!=""?"'"+shipToCode+"',":"")+"'SOD-01','Expense - Confirmed Cost of Goods Sold','Sales Order Item Lines','5000-1','Cost of Goods, CDD','Expenses','Cost of Goods Sold','eSC','eSC');"+
						 "INSERT INTO CustomerAccount (CustomerCode, "+shipToCode!=''?shipToCode+', ':''+"PostingCode, PostingDescription, Category, AccountCode, AccountDescription, AccountGroup, AccountType, UserCreated, UserModified) VALUES ('"+customerCode+"',"+(shipToCode!=""?"'"+shipToCode+"',":"")+"'SOD-03','Revenue - Sales','Sales Order Item Lines','4000-1','Revenue , CDD','Revenues','Sales','eSC','eSC');"+
						 "INSERT INTO CustomerAccount (CustomerCode, "+shipToCode!=''?shipToCode+', ':''+"PostingCode, PostingDescription, Category, AccountCode, AccountDescription, AccountGroup, AccountType, UserCreated, UserModified) VALUES ('"+customerCode+"',"+(shipToCode!=""?"'"+shipToCode+"',":"")+"'SOD-04','Revenue - Returns','Sales Order Item Lines','4200-1','Sales Returns and Allowances, CDD','Revenues','Sales','eSC','eSC');"+
						 "INSERT INTO CustomerAccount (CustomerCode, "+shipToCode!=''?shipToCode+', ':''+"PostingCode, PostingDescription, Category, AccountCode, AccountDescription, AccountGroup, AccountType, UserCreated, UserModified) VALUES ('"+customerCode+"',"+(shipToCode!=""?"'"+shipToCode+"',":"")+"'SOD-05','Revenue - Service / Non Stock','Sales Order Item Lines','4000-1','Revenue , CDD','Revenues','Sales','eSC','eSC');"+
						 "INSERT INTO CustomerAccount (CustomerCode, "+shipToCode!=''?shipToCode+', ':''+"PostingCode, PostingDescription, Category, AccountCode, AccountDescription, AccountGroup, AccountType, UserCreated, UserModified) VALUES ('"+customerCode+"',"+(shipToCode!=""?"'"+shipToCode+"',":"")+"'SOH-01','Revenue - Freight','Sales Order Header','4100-1','Freight Revenue, CDD','Revenues','Sales','eSC','eSC');"+
						 "INSERT INTO CustomerAccount (CustomerCode, "+shipToCode!=''?shipToCode+', ':''+"PostingCode, PostingDescription, Category, AccountCode, AccountDescription, AccountGroup, AccountType, UserCreated, UserModified) VALUES ('"+customerCode+"',"+(shipToCode!=""?"'"+shipToCode+"',":"")+"'SOH-02','Revenue - Other','Sales Order Header','7100-0','Other Income','Revenues','Other Income','eSC','eSC');",function(err,rowCount,acctRows){
							if (err){
								console.log(err);
							}else{
								callback();
							}
						});

	connection.execSqlBatch(code);
}