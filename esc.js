/*
       ____   ____    _     
   ___/ ___| / ___|  (_)___   Magento < - > ConnectedBusiness Node.JS Link
  / _ \___ \| |      | / __|  --------------------------------------------
 |  __/___) | |___ _ | \__ \  |- Connects to Magento v2 API
  \___|____/ \____(_)/ |___/  |- Modifies ConnectedBusiness through MSSQL
                   |__/       |- Modifies Magento through API

*/

/*
|| Load Modules - Configuration, connectivity modules and node_modules
*/
var config=require('./config.js'); // eSC / Magento / MSSQL configuration
var Log=require('./lib/log.js');
var CB=require('./lib/ConnectedBusiness.js');

var soap=require('soap'); // Magento SOAP API
var Connection=require('tedious').Connection; // ConnectedBusiness MSSQL
var Request=require('tedious').Request;

var mageInv,ships;

/*
|| Connect - Setup connectivity modules and connect to our SOAP / MSSQL data sources
*/
var connection=new Connection(config.mssql); // Setup MSSQL connection - Keep alive until polling completed
var log=new Log(config);
var cb=new CB(connection, Request, log);

connection.on('connect',function(){
	// Connects to Magento, logs in and starts the polling procedure
	soap.createClient(config.magento.url, function(err,client){
		client.login({username:config.magento.user, apiKey:config.magento.key}, function(err,result){
			pollMagento(client,result.loginReturn);
			//pollConnectedBusiness(client,result.loginReturn);
		});
	});
});

/*
|| Poll Magento - Lists new sales orders
*/
function pollMagento(client,sessionId){
	// List sales orders updated since last update
	client.salesOrderList({sessionId:sessionId, filters:config.magento.pollFilter}, function(err,result){
		// Process list
		//console.log(result.result.item);
		processOrders(client,sessionId,result.result.item);
	});
}

function pollConnectedBusiness(client,sessionId){
	// Polls CB for recently posted orders
	cb.order.pollCB(function(invoices){
		mageInv=invoices;
		
		// Compile list of increment_ids
		var inc="";
		for (var i in invoices){
			if (inc!="") inc+=",";
			inc+=i;
		}
		
		var filter={ complex_filter: { item: { key: 'increment_id', value: { key: 'in', value: inc } } } }
		
		// Lookup SO's - record orderId's
		client.salesOrderList({sessionId:sessionId,filters:filter},function(err,result){
			var orderList=result.result.item;
			if (!Array.isArray(orderList)) orderList=new Array(orderList);
			
			// Iterate through, make master order_id list
			var ids="";
			for (var i in orderList){
				if (ids!="") ids+=",";
				mageInv[orderList[i].increment_id].orderId=orderList[i].order_id;
				ids+=orderList[i].order_id;
			}
			
			var filter={ complex_filter: { item: { key: 'order_id', value: { key: 'in', value: ids } } } }
			
			// Lookup shipments matching all order_id's
			client.salesOrderShipmentList({sessionId:sessionId,filters:filter},function(err,result){
				var shipments=result.result.item;
				if (!Array.isArray(shipments)) shipments=new Array(shipments);
				
				if (shipments[0]==undefined){
					console.log(shipments);
					shipRemainder(client,sessionId);
				}else{
					// Process each shipment now...
					ships=shipments.length;
					for (var i in shipments){
						var inc=shipments[i].increment_id;
					
						// Finally, lookup each individual shipment
						client.salesOrderShipmentInfo({sessionId:sessionId, shipmentIncrementId:inc},function(err,result){
							// If shipment exists... Remove it. If ships == 0 then continue processing
							var ship=result.result;
							for (var i in mageInv){
								if (mageInv[i].orderId==ship.order_id){
									for (var x in ship.tracks){
										if (ship.tracks[x].number!=undefined && mageInv[i].tracks[ship.tracks[x].number]!=undefined) mageInv[i].tracks[ship.tracks[x].number].preProc=true;
									}
								}
							}
						
							// Done processing... Update ships and check the value of it
							ships--;
							if (ships<=0){
								shipRemainder(client,sessionId);
							}
						});
					}
				}
			});
		});
	});
}

function shipRemainder(client,sessionId){
	console.log(mageInv);
	// Create a shipment for each MageOrder... Pull all remaining tracks info...
	
	for (var i in mageInv){
		var inv=mageInv[i];
		// Count tracks
		var c=0;for(var d in inv.tracks)c++;
		
		// If we have tracks to post...
		if (c>0){
			// Break down all tracks into items to be submitted
			var ob={}
			for (var q in inv.tracks){
				for (var p in inv.tracks[q].items){
					if (ob[inv.tracks[q].items[p].itemId]==undefined){
						ob[inv.tracks[q].items[p].itemId]=inv.tracks[q].items[p].shipQuant;
					}else{
						ob[inv.tracks[q].items[p].itemId]+=inv.tracks[q].items[p].shipQuant;
					}
				}
			}
			
			// Create Shipment
			client.salesOrderShipmentCreate({sessionId:sessionId, orderIncrementId:i, itemsQty:ob},function(err,result){
				// Now create tracks for the shipment
				console.log(result);
				var shipId=result.result.shipmentIncrementId;
				
				for (var p in inv.tracks){
					client.salesOrderShipmentAddTrack({sessionId:sessionId, shipmentIncrementId:shipId, carrier:inv.tracks[p].carrier, title:"", trackNumber:p},function(err,result){
						// It's probably good now... Splice it from DNA... Oh shit... Invoice the quants from previously spliced tracking numbers -_-
						mageInv[invI].tracks[invP].proc=true;
						
						// Check proc & pre-proc... If all is set in i.tracks, continue with invoicing
						var f=false;
						for (var z in mageInv[invI].tracks){
							if (mageInv[invI].tracks[z].proc == undefined && mageInv[invI].tracks[z].preProc == undefined) f=true;
						}
						
						// Invoice shipment if we can
						if (!f) invoiceShipment(client,sessionId,invI);
					}.bind({invI:i,invP:p})); // I do not like this bind...
				}
			});
		}
	}
}

function invoiceShipment(client,sessionId,inv){
	// Assume pre-proc has been invoiced, just combine proc'd and invoice
	var itemsOb={}
	for (var i in mageInv[inv].tracks){
		var track=mageInv[inv].tracks[i];
		if (track.proc!=undefined){
			for (var z in track.items){
				var it=track.items[z];
				itemsOb[it.itemId]=(itemsOb[it.itemId]==undefined)?(it.shipQuant):(itemsOb[it.itemId]+it.shipQuant);
			}
		}
	}
	
	console.log(inv);
	
	/*
	client.salesOrderInvoiceCreate({sessionId:sessionId, orderIncrementId:inv, itemsQty:itemsOb},function(err,result){
		console.log(result);
	});
	*/
}

/*
|| Process Magento Poll
*/
function processOrders(client,sessionId,orderList){
	if (!Array.isArray(orderList)) orderList=new Array(orderList);
	
	// Iterate through orders, pull more information
	for (var i in orderList){
		client.salesOrderInfo({sessionId:sessionId, orderIncrementId:orderList[i].increment_id}, function(err,result){
			var so=result.result;
			console.log(so);
			
			// Lookup shipTo/billTo/contact codes, link properly
			cb.user.lookupUser(so, function(cust,bill,ship){
				// Lookup SalesOrder
				cb.order.lookupSalesOrder(so,cust,bill,ship,function(soCode){
					//console.log(soCode);
				});
			});
		});
	}
}