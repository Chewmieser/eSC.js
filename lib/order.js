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
		resolveAddress:function(postCode,callback){
			resolveAddress(postCode,callback);
		},
		lookupSalesOrder:function(so,cust,bill,ship,callback){
			lookupSalesOrder(so,cust,bill,ship,callback);
		}
	}
}

// Lookup SalesOrderCode where alt order is Magento code
function lookupSalesOrder(so,cust,bill,ship,callback){
	var resolveSO=new Request("SELECT SalesOrderCode FROM CustomerSalesOrder WHERE MerchantOrderID_DEV000221='"+so.MerchantOrderID_DEV000221+"'",function(err,rowCount,soRows){
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
						setupSalesOrderWorkflow(so,soCode,function(){
							createSalesOrderDetails(so,soCode,callback);
						});
					}
				});
			
				connection.execSqlBatch(createSO);
			});
		});
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

// Creates salesOrderDetails
/*function createSalesOrderDetails(so,soCode,callback){
	var items=so.items.item;
	
	for (var i;i<items.count;i++){
		var item=items[i];
		// Reolve some information first
		lookupSKU(item.sku,function(itemInfo){
			var sod=templates.salesOrderDetail(soCode,i-1,item,itemInfo);
			var sql=templates.generateSQLByTemplate("INSERT","CustomerSalesOrderDetail",sod);
			
			var createSOD=new Request(sql,function(err,rowCount,sodRows){
				if (err){
					console.log(err);
				}else{
					// Did we finish...? Can we batch instead?
				}
			});
			
			connection.execSqlBatch(createSOD);
		});
	}
}*/

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

/*function lookupSKU(sku,callback){
	var skuLookup=new Request("SELECT ItemCode, ItemType, AverageCost FROM InventoryItem WHERE ItemName='"+sku+"'",function(err,rowCount,itemRows){
		if (err){
			console.log(err);
		}else{
			callback(itemRows[0]);
		}
	});
	
	connection.execSqlBatch(skuLookup);
}*/