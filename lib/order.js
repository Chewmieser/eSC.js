/*

	▓█████   ██████  ▄████▄        ▄▄▄██▀▀▀██████ 	╔═╗┌─┐┬  ┌─┐┌─┐  ╔═╗┬─┐┌┬┐┌─┐┬─┐  ╔╦╗┌─┐┌┬┐┬ ┬┬  ┌─┐
	▓█   ▀ ▒██    ▒ ▒██▀ ▀█          ▒██ ▒██    ▒ 	╚═╗├─┤│  ├┤ └─┐  ║ ║├┬┘ ││├┤ ├┬┘  ║║║│ │ │││ ││  ├┤ 
	▒███   ░ ▓██▄   ▒▓█    ▄         ░██ ░ ▓██▄   	╚═╝┴ ┴┴─┘└─┘└─┘  ╚═╝┴└──┴┘└─┘┴└─  ╩ ╩└─┘─┴┘└─┘┴─┘└─┘
	▒▓█  ▄   ▒   ██▒▒▓▓▄ ▄██▒     ▓██▄██▓  ▒   ██▒	|- Handles so lookup / insertion
	░▒████▒▒██████▒▒▒ ▓███▀ ░ ██▓  ▓███▒ ▒██████▒▒	|- Creates so, so detail and so payment
	░░ ▒░ ░▒ ▒▓▒ ▒ ░░ ░▒ ▒  ░ ▒▓▒  ▒▓▒▒░ ▒ ▒▓▒ ▒ ░	
	 ░ ░  ░░ ░▒  ░ ░  ░  ▒    ░▒   ▒ ░▒░ ░ ░▒  ░ ░	
	   ░   ░  ░  ░  ░         ░    ░ ░ ░ ░  ░  ░  
	   ░  ░      ░  ░ ░        ░   ░   ░       ░  
	                ░          ░       
          
*/

var connection, Request, templates, user;

// Export skeleton
// - Saves connection, request and templates link
// - Exposes esc.js public functions
module.exports=function Order(conn, req, tmp, usr){
	connection=conn; Request=req; templates=tmp; user=usr;
	
	return {
		lookupSalesOrder:function(so,cust,bill,ship,callback){
			lookupSalesOrder(so,cust,bill,ship,callback);
		}
	}
}

// Lookup SalesOrderCode where alt order is Magento code
function lookupSalesOrder(so,cust,bill,ship,callback){
	var resolveSO=new Request("SELECT SalesOrderCode FROM CustomerSalesOrder WHERE MerchantOrderID_DEV000221='"+so.increment_id+"'",function(err,rowCount,soRows){
		if (rowCount==0 && !err){
			createSalesOrder(so,cust,bill,ship,callback);
		}
		
		if (rowCount>0){
			callback(soRows[0].SalesOrderCode.value);
		}
	});
	
	connection.execSqlBatch(resolveSO);
}

// Creates salesOrderCode & salesOrder
function createSalesOrder(so,cust,bill,ship,callback){
	// Create salesOrderCode
	var genCode=new Request("DECLARE @docCode NVARCHAR(30);EXEC [dbo].GenerateDocumentCode @Transaction='SalesOrder', @DocumentCode=@docCode output;SELECT @docCode;",function(err,rowCount,docRows){
		var soCode=docRows[0][0].value;
		
		// Generate template
		var soTmp=templates.salesOrder(so,soCode,cust,bill,ship);
		
		// Resolve Bill-to
		user.resolveAddress(soTmp.BillToPostalCode,function(addr){
			soTmp.BillToState=addr.StateCode.value;
			soTmp.BillToCounty=addr.County.value;
			soTmp.BillToCountry=addr.CountryCode.value;
			soTmp.BillToCity=addr.City.value;
			
			// Resolve Ship-to
			user.resolveAddress(soTmp.ShipToPostalCode,function(addr){
				soTmp.ShipToState=addr.StateCode.value;
				soTmp.ShipToCounty=addr.County.value;
				soTmp.ShipToCountry=addr.CountryCode.value;
				soTmp.ShipToCity=addr.City.value;
				
				// Finalize SQL
				var sql=templates.generateSQLByTemplate("INSERT","CustomerSalesOrder",soTmp);
				
				var createSO=new Request(sql,function(err,rowCount,custRows){
					if (err){
						console.log("Create Sales Order: "+err);
					}else{
						createSalesOrderPayment(so,cust,soCode,function(){
							setupSalesOrderWorkflow(so,soCode,function(){
								createSalesOrderDetails(so,soCode,callback);
							});
						});
					}
				});
			
				connection.execSqlBatch(createSO);
			});
		});
	});
	
	connection.execSqlBatch(genCode);
}

function createSalesOrderPayment(so,custCode,soCode,callback){
	// Create RCVCode
	var genCode=new Request("DECLARE @docCode NVARCHAR(30);EXEC [dbo].GenerateDocumentCode @Transaction='CustomerReceipt', @DocumentCode=@docCode output;SELECT @docCode;",function(err,rowCount,docRows){
		var rcvCode=docRows[0][0].value;
		
		// Generate CustomerPayment template
		var rcvTmp=templates.salesOrderPayment(rcvCode,custCode,so,soCode);
		var sql=templates.generateSQLByTemplate("INSERT","CustomerPayment",rcvTmp);
		
		var createSOP=new Request(sql,function(err,rowCount,sopRows){
			if (err){
				console.log("Create CP: "+err);
			}else{
				// Generate TransactionReceipt
				var transTmp=templates.transactionReceipt(so,soCode,rcvCode);
				var sql=templates.generateSQLByTemplate("INSERT","CustomerTransactionReceipt",transTmp);
		
				var createTrans=new Request(sql,function(err,rowCount,transRows){
					if (err){
						console.log("Create CTR: "+err);
					}else{
						// Generate PaymentMethod template
						var payTmp=templates.paymentMethod(so,rcvCode);
						var sql=templates.generateSQLByTemplate("INSERT","PaymentMethod",payTmp);
		
						var createPM=new Request(sql,function(err,rowCount,pmRows){
							if (err){
								console.log("Create SOP: "+err);
							}else{
								callback();
							}
						});
	
						connection.execSqlBatch(createPM);
					}
				});
	
				connection.execSqlBatch(createTrans);
			}
		});
	
		connection.execSqlBatch(createSOP);
	});
	
	connection.execSqlBatch(genCode);
}

function setupSalesOrderWorkflow(so,soCode,callback){
	var woTmp=templates.salesOrderWorkflow(so,soCode);
	var sql=templates.generateSQLByTemplate("INSERT","CustomerSalesOrderWorkflow",woTmp);
	
	var createWorkFlow=new Request(sql,function(err,rowCount,custRows){
		if (err){
			console.log("Create WorkFlow: "+err);
		}else{
			callback();
		}
	});

	connection.execSqlBatch(createWorkFlow);
}

function createSalesOrderDetails(so,soCode,callback){
	var items=!Array.isArray(so.items.item) ? new Array(so.items.item) : so.items.item;
	var skuList=new Array();
	
	// Build a list of SKUs for lookup
	for (var item in items){
		skuList.push(items[item].sku);
	}
	
	// Batch the lookup
	lookupSKUS(skuList,function(itemInfo){
		// Batch SQL
		var sql="";
		for (var i in items){
			var item=items[i];
			
			if (itemInfo[item.sku]==undefined){
				console.log("Item "+item.sku+" not found");
			}else{
				var sodTmp=templates.salesOrderDetail(soCode,parseInt(i)+1,item,itemInfo[item.sku]);
				sql+=((parseInt(i)>0?";":"")+templates.generateSQLByTemplate("INSERT","CustomerSalesOrderDetail",sodTmp));
			}
		}
		
		var createSOD=new Request(sql,function(err,rowCount,sodRows){
			if (err){
				console.log("CreateSOD: "+err);
			}else{
				callback(soCode);
			}
		});

		connection.execSqlBatch(createSOD);
	});
}

function lookupSKUS(skuList,callback){
	var lookupRequest="";
	for (var i in skuList){
		lookupRequest+="ItemName='"+skuList[i]+"' OR ";
	}
	
	// Cleanup
	lookupRequest=lookupRequest.substr(0,lookupRequest.length-4);
	
	// Send request
	var skuLookup=new Request("SELECT ItemName, ItemCode, ItemType, AverageCost FROM InventoryItem WHERE "+lookupRequest,function(err,rowCount,itemRows){	
		if (err){
			console.log("Lookup SKU: "+err);
		}else{
			// CLEANUP!
			var skuOb={}
			for (var i in itemRows){
				skuOb[itemRows[i].ItemName.value]={
					ItemName: itemRows[i].ItemName.value,
					ItemCode: itemRows[i].ItemCode.value,
					ItemType: itemRows[i].ItemType.value,
					AverageCost: itemRows[i].AverageCost.value
				}
			}
			
			callback(skuOb);
		}
	});
	
	connection.execSqlBatch(skuLookup);
}