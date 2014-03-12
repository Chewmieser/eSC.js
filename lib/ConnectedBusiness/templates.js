/*

	▓█████   ██████  ▄████▄        ▄▄▄██▀▀▀██████ 	╔╦╗┌─┐┌─┐┌─┐ ┬    ╔╦╗┌─┐┌┬┐┌─┐┬  ┌─┐┌┬┐┌─┐┌─┐
	▓█   ▀ ▒██    ▒ ▒██▀ ▀█          ▒██ ▒██    ▒ 	║║║└─┐└─┐│─┼┐│     ║ ├┤ │││├─┘│  ├─┤ │ ├┤ └─┐
	▒███   ░ ▓██▄   ▒▓█    ▄         ░██ ░ ▓██▄   	╩ ╩└─┘└─┘└─┘└┴─┘   ╩ └─┘┴ ┴┴  ┴─┘┴ ┴ ┴ └─┘└─┘
	▒▓█  ▄   ▒   ██▒▒▓▓▄ ▄██▒     ▓██▄██▓  ▒   ██▒	|- JSON templates for MSSQL insertion
	░▒████▒▒██████▒▒▒ ▓███▀ ░ ██▓  ▓███▒ ▒██████▒▒	|- Helper functions for templates
	░░ ▒░ ░▒ ▒▓▒ ▒ ░░ ░▒ ▒  ░ ▒▓▒  ▒▓▒▒░ ▒ ▒▓▒ ▒ ░	
	 ░ ░  ░░ ░▒  ░ ░  ░  ▒    ░▒   ▒ ░▒░ ░ ░▒  ░ ░	
	   ░   ░  ░  ░  ░         ░    ░ ░ ░ ░  ░  ░  
	   ░  ░      ░  ░ ░        ░   ░   ░       ░  
	                ░          ░       
          
*/

// Uses Magento SO to generate SQL-ready CustomerSalesOrder template
exports.salesOrder=function(so,soCode,cust,bill,ship){
	return {
		SalesOrderCode: soCode,
		RootDocumentCode: soCode,
		SalesOrderDate: so.created_at,
		ShipToCode: ship,
		BillToCode: cust,
		SubTotal: so.subtotal,
		SubTotalRate: so.subtotal,
		Freight: so.shipping_amount,
		FreightRate: so.shipping_amount,
		FreightTaxCode: 'Sales No Tax',
		FreightTax: 0.00,
		FreightTaxRate: 0.00,
		Tax: so.tax_amount,
		TaxRate: so.tax_amount,
		Total: so.grand_total,
		TotalRate: so.grand_total,
		WarehouseCode: 'MAIN',
		ShippingMethodGroup: 'DEFAULT',
		ShippingMethodCode: translateFreightCode(so.shipping_method),
		SourceCode: 'MagentoOrder',
		AmountPaid: so.payment.amount_ordered,
		AmountPaidRate: so.payment.amount_ordered,
		IsPaid: 0,
		PaymentTermGroup: 'DEFAULT',
		PaymentTermCode: 'Credit Card',
		DaysBeforeInterest: '0',
		DiscountableDays: '1',
		DiscountPercent: '0.00',
		InterestPercent: '0.00',
		DueType: 'Net Days - From Invoice Date',
		DiscountType: 'Percent',
		CurrencyCode: 'USD',
		ExchangeRate: '1.0',
		ARAccountCode: '1100-1',
		FreightAccountCode: '4100-1',
		DiscountAccountCode: '4000-1',
		OtherAccountCode: '7100-0',
		BillToName: (so.billing_address.company != undefined ? so.billing_address.company : so.billing_address.firstname+' '+so.billing_address.lastname),
		BillToAddress: so.billing_address.street,
		BillToCity: '',
		BillToState: '',
		BillToPostalCode: breakPostalCode(so.billing_address.postcode)["postcode"],
		BillToCounty: '',
		BillToCountry: '',
		BillToPhone: so.billing_address.telephone,
		ShipToName: so.shipping_address.firstname+' '+so.shipping_address.lastname,
		ShipToAddress: (so.billing_address.company != undefined ? so.billing_address.company+"'+ CHAR(13) + CHAR(10) +'" : '')+so.shipping_address.street,
		ShipToCity: '',
		ShipToState: '',
		ShipToPostalCode: breakPostalCode(so.shipping_address.postcode)["postcode"],
		ShipToCounty: '',
		ShipToCountry: '',
		ShipToPhone: so.shipping_address.telephone,
		ContactCode: bill,
		Type: 'Sales Order',
		OrderStatus: 'Open',
		IsProcessed: 0,
		IsAllowBackOrder: 1,
		Balance: so.grand_total-so.payment.amount_ordered,
		BalanceRate: so.grand_total-so.payment.amount_ordered,
		SalesRepOrderCode: so.increment_id,
		AppliedCredit: '0.00',
		AppliedCreditRate: '0.00',
		Discount: so.discount_amount,
		DiscountRate: so.discount_amount,
		WriteOff: 0.00,
		WriteOffRate: 0.00,
		Other: 0.00,
		OtherRate: 0.00,
		OtherTaxCode: 'Sales No Tax',
		OtherTax: '0.00',
		OtherTaxRate: '0.00',
		Notes: '',										// ----------------------------
		IsVoided: 0,
		IsOnHold: 0,
		IsPrinted: 0,
		IsOrderAcknowledged: 0,
		IsFromContract: 0,
		PrintCount: 0,
		CouponDiscount: 0.00,
		CouponDiscountRate: 0.00,
		CouponDiscountPercent: 0.00,
		CouponDiscountAmount: 0.00,
		CouponUsage: 0,
		CouponDiscountIncludesFreeShipping: 0,
		CouponRequiresMinimumOrderAmount: 0.00,
		IsFreightOverwrite: 1,
		WebSiteCode: 'WEB-000002',
		UserCreated: 'eSC',
		DateCreated: so.created_at,
		UserModified: 'eSC',
		DateModified: so.updated_at,
		TaxGroup1: so.tax_amount,
		TaxGroup1Rate: so.tax_amount,
		InternalNotesCode: 'Select a Note or type below',
		PublicNotesCode: 'Select a Note or type below',
		IsPickUp: 0,
		BillToAddressType: 'Commercial',
		ShipToAddressType: 'Commercial',
		MerchantOrderID_DEV000221: so.increment_id,
		StoreMerchantID_DEV000221: 'Main',
		IsBlindShip: 0,
		BillToPlus4: breakPostalCode(so.billing_address.postcode)["plus4"],
		ShipToPlus4: breakPostalCode(so.shipping_address.postcode)["plus4"]
	};
}

exports.salesOrderDetail=function(soCode,lineNum,item,itemInfo){
	return {
		SalesOrderCode: soCode,
		ItemCode: itemInfo.ItemCode,
		LineNum: lineNum,
		SourceLineNum: 0,
		RootDocumentCode: soCode,
		WarehouseCode: 'MAIN',
		QuantityOrdered: item.qty_ordered,
		QuantityBackOrdered: 0.00,
		QuantityShipped: item.qty_shipped,
		QuantityToBeShipped: 0.00,
		QuantityAllocated: 0.00,
		QuantityAlReadyRMA: 0.00,
		QuantityReturned: 0.00,
		ContractQuantity: 0.00,
		ContractCalledOff: 0.00,
		ItemDescription: item.name,
		Discount: item.base_discount_amount,
		Markup: 0.00,
		UnitMeasureCode: 'EACH',
		UnitMeasureQty: 1.0,
		SalesTaxAmount: 0.00,
		SalesTaxAmountRate: 0.00,
		SalesPrice: item.base_price,
		SalesPriceRate: item.base_price,
		NetPrice: item.base_price,
		NetPriceRate: item.base_price,
		ExtPrice: item.base_row_total,
		ExtPriceRate: item.base_row_total,
		Cost: itemInfo.AverageCost,
		CostRate: itemInfo.AverageCost,
		ExtCost: itemInfo.AverageCost*item.qty_ordered,
		ExtCostRate: itemInfo.AverageCost*item.qty_ordered,
		ActualCost: itemInfo.AverageCost,
		ActualCostRate: itemInfo.AverageCost,
		ExtActualCost: itemInfo.AverageCost*item.qty_ordered,
		ExtActualCostRate: itemInfo.AverageCost*item.qty_ordered,
		Profit: item.base_row_total-(itemInfo.AverageCost*item.qty_ordered),
		ProfitRate: item.base_row_total-(itemInfo.AverageCost*item.qty_ordered),
		Margin: ((item.base_row_total-(itemInfo.AverageCost*item.qty_ordered)) / item.base_row_total)*100,
		TaxCode: 'Sales No Tax',
		Pricing: 'Retail',
		IsDropShip: 1,
		MatrixBatch: 0,
		SalesAccountCode: '4000-1',
		InventoryAccountCode: '1200-1',
		COGSAccountCode: '5000-1',
		ItemType: itemInfo.ItemType,
		Volume: 0.00,
		Weight: 0.00,
		NetWeight: 0.00,
		ExtWeight: 0.00,
		ExtNetWeight: 0.00,
		IsConvert: 0,
		IsConverted: 0,
		IsPickingNotePrinted: 0,
		IsPackingListPrinted: 0,
		IsConfirmedPickedPacked: 0,
		Commissionable: 1,
		CommissionSource: 'Sales Rep',
		CommissionPercent: 0.00,
		CommissionAmount: 0.00,
		CommissionAmountRate: 0.00,
		NOTC: 10,
		TermsOfDelivery: 'FOB',
		IsIncludedInCoupon: 0,
		SupUnitsReq: 0,
		ParentItemCode: null,
		InventoryDescription: item.name,
		IsInventoryDescription: 1,
		WebSiteCode: 'WEB-000002',
		UserCreated: 'eSC',
		UserModified: 'eSC',
		SortOrder: lineNum,
		CouponDiscount: 0.00,
		CouponDiscountRate: 0.00,
		SerializeLot: 'False',
		QuantityReserved: 0.00,
		WeightInPounds: 0.00,
		NetWeightInPounds: 0.00,
		SourcePurchaseID_DEV000221: item.item_id,
		MaxDiscount: 0.00,
		IsSpecialOrder: 0
	}
}

exports.salesOrderWorkflow=function(so,soCode){
	return {
		SalesOrderCode: soCode,
		WarehouseCode: 'MAIN',
		Stage: 'Print Pick Note',
		AvailabilityPercent: 0.00,
		IsPickingNotePrinted: 0,
		IsPackingNotePrinted: 0,
		IsDeliveryNotePrinted: 0,
		PickingNotePrintCount: 0,
		PackingNotePrintCount: 0,
		DeliveryNotePrintCount: 0,
		DateCreated: so.created_at,
		UserCreated: 'eSC',
		DateModified: so.updated_at,
		UserModified: 'eSC'
	}
}

exports.salesOrderPayment=function(recvCode,custCode,so,soCode){
	return {
		ReceivableCode: recvCode,
		Type: 'Receipt',
		CustomerCode: custCode,
		ReceivedFrom: (so.billing_address.company != undefined ? so.billing_address.company : so.billing_address.firstname+' '+so.billing_address.lastname),
		Notes: '',
		CurrencyCode: 'USD',
		ExchangeRate: 1.0,
		OverPaymentAccountCode: '1100-1',
		AmountPaid: so.payment.amount_ordered,
		AmountPaidRate: so.payment.amount_ordered,
		CreditApplied: 0.00,
		CreditAppliedRate: 0.00,
		PreviousCreditApplied: 0.00,
		PreviousCreditAppliedRate: 0.00,
		UnAppliedAmount: 0.00,
		UnAppliedAmountRate: 0.00,
		CreditAmount: 0.00,
		CreditAmountRate: 0.00,
		TotalDue: 0.00,
		TotalDueRate: 0.00,
		WriteOff: 0.00,
		WriteOffRate: 0.00,
		AppliedAmount: 0.00,
		AppliedAmountRate: 0.00,
		Balance: 0.00,
		BalanceRate: 0.00,
		SalesOrderCode: soCode,
		OriginalReservedAmount: so.payment.amount_ordered,
		OriginalReservedAmountRate: so.payment.amount_ordered,
		ReservedAmount: so.payment.amount_ordered,
		ReservedAmountRate: so.payment.amount_ordered,
		GainLoss: 0.00,
		IsPosted: 0,
		IsReturned: 0,
		IsVoided: 0,
		DatePaid: so.created_at,
		IsPrinted: 0,
		PrintCount: 0,
		UserCreated: 'eSC',
		DateCreated: so.created_at,
		UserModified: 'eSC',
		DateModified: so.updated_at
	}
}

exports.transactionReceipt=function(so,soCode,rcvCode){
	return {
		DocumentCode: soCode,
		ReceivableCode: rcvCode,
		UserCreated: 'eSC',
		DateCreated: so.created_at,
		UserModified: 'eSC',
		DateModified: so.updated_at,
		IsCardPaymentConverted: 0
	}
}

exports.paymentMethod=function(so,rcvCode){
	return {
		DocumentCode: rcvCode,
		LineNum: 1,
		SourceLineNum: 0,
		AmountPaid: so.payment.amount_ordered,
		AmountPaidRate: so.payment.amount_ordered,
		CheckNumber: extractTransactionId(so.status_history.item),
		PaymentMethod: 'Cash/Other',
		CheckbookCode: 'BNKAC-000007',
		Account: 'Undeposited',
		CreditCardTax: 0.00,
		CreditCardTaxRate: 0.00,
		CreditCardIsAuthorized: 0,
		CreditCardIsCaptured: 0,
		IsCardOnFile: 0,
		BankAccountCurrencyCode: 'USD',
		BankAccountExchangeRate: 1.0,
		BankCurrencyValue: so.payment.amount_ordered,
		BankCurrencyValueRate: so.payment.amount_ordered,
		BankCharges: 0.00,
		BankChargesRate: 0.00,
		OtherCharges: 0.00,
		OtherChargesRate: 0.00,
		AmountToBeBanked: so.payment.amount_ordered,
		AmountToBeBankedRate: so.payment.amount_ordered,
		CreditCardCode: null,
		UserCreated: 'eSC',
		DateCreated: so.created_at,
		UserModified: 'eSC',
		DateModified: so.updated_at,
		CreditCardIsForced: 0,
		CreditCardIsVoided: 0,
		CreditCardIsCredited: 0,
		CreditCardIsSold: 0,
		PaymentTypeCode: 'Ext. System C/Card',
		OrigAuthorizedAmount: so.payment.amount_ordered,
		OrigAuthorizedAmountRate: so.payment.amount_ordered,
		IsCardPayment: 0,
		IsAutoChargeOnPost: 0
	}
}

// Generates a customer based on SO - Looks like enough information to proceed
exports.customer=function(code,so){
	return {
		CustomerCode: code,
		CustomerName: (so.billing_address.company != undefined ? so.billing_address.company : so.billing_address.firstname+' '+so.billing_address.lastname),
		Address: so.billing_address.street,
		City: '',
		State: '',
		PostalCode: breakPostalCode(so.billing_address.postcode)["postcode"],
		County: '',
		Country: '',
		Telephone: so.billing_address.telephone,
		Email: so.customer_email,
		SourceCode: 'MagentoOrder',
		ClassCode: 'CCLS-000225',
		GLClassCode: 'Default',
		CurrencyCode: 'USD',
		DefaultPrice: 'Wholesale',
		PricingMethod: 'None',
		Discount: '0.00',
		CreditLimit: '0.00',
		Credit: '0.00',
		PricingPercent: '1.00',
		IsActive: 1,
		IsCreditHold: 0,
		IsProspect: 0,
		IsAllowBackOrder: 1,
		IsWebAccess: 0,
		Commission: 'Sales Rep',
		CommissionPercent: '0.00',
		Rank: '0.00',
		CreditRating: '0.00',
		IsFromProspect: 0,
		IsRankUserOverriden: 0,
		AssignedTo: 'eSC',
		DiscountType: 'Overall',
		UserCreated: 'eSC',
		DateCreated: so.created_at,
		UserModified: 'eSC',
		DateModified: so.updated_at,
		TotalCredits: '0.00',
		IsRTShipping: 0,
		Over13Checked: 0,
		CustomerTypeCode: 'End User',
		BusinessType: 'Wholesale',
		CustomerBalance: '0.00',
		CustomerBalanceRate: '0.00',
		FirstName: so.billing_address.firstname,
		MiddleName: '',
		LastName: so.billing_address.lastname,
		AddressType: 'Commercial',
		ImportCustomerID_DEV000221: '',
		ImportSourceID_DEV000221: 'MagentoOrder',
		Plus4: breakPostalCode(so.billing_address.postcode)["plus4"]
	};
}

exports.customerShipTo=function(code,custCode,so){
	return {
		CustomerCode: custCode,
		ShipToCode: code,
		ShipToName: so.shipping_address.firstname+' '+so.shipping_address.lastname,
		ClassCode: 'SHPCLS-000463',
		GLClassCode: 'Default',
		Address: (so.billing_address.company != undefined ? so.billing_address.company+"'+ CHAR(13) + CHAR(10) +'" : '')+so.shipping_address.street,
		City: '',
		State: '',
		PostalCode: breakPostalCode(so.shipping_address.postcode)["postcode"],
		County: '',
		Country: '',
		Telephone: so.shipping_address.telephone,
		Email: so.customer_email,
		TaxCode: 'Sales No Tax',
		ShippingMethodGroup: 'DEFAULT',
		ShippingMethod: 'Ground',
		WarehouseCode: 'MAIN',
		IsAllowBackOrder: 0,
		IsActive: 1,
		IsCreditHold: 0,
		Commission: 'Sales Rep',
		CommissionPercent: 0.00,
		CreditLimit: 0.00,
		PricingPercent: 0.00,
		PricingLevel: 0,
		PaymentTermGroup: 'DEFAULT',
		PaymentTermCode: 'Credit Card',
		OpenTime: '2006-04-26 09:00:00',
		CloseTime: '2006-04-26 18:00:00',
		SpecialInstructions: 'None',
		IsBookTimeDateAndBay: 0,
		UserCreated: 'eSC',
		DateCreated: so.created_at,
		UserModified: 'eSC',
		DateModified: so.updated_at,
		FreightTax: 'Sales No Tax',
		OtherTax: 'Sales No Tax',
		AddressType: 'Commercial',
		Plus4: breakPostalCode(so.shipping_address.postcode)["plus4"]
	};
}

exports.customerContact=function(code,custCode,so){
	return {
		ContactCode: code,
		EntityCode: custCode,
		Type: 'CustomerContact',
		ContactFirstName: so.shipping_address.firstname,
		ContactLastName: so.shipping_address.lastname,
		AssignedTo: 'eSC',
		Address: so.shipping_address.address,
		Country: '',
		City: '',
		State: '',
		PostalCode: breakPostalCode(so.shipping_address.postcode)["postcode"],
		County: '',
		BusinessPhone: so.shipping_address.telephone,
		Email1: so.customer_email,
		TimeZone: '',
		Username: so.customer_email,
		LanguageCode: 'English - United States',
		IsActive: 1,
		UserCreated: 'eSC',
		DateCreated: so.created_at,
		UserModified: 'eSC',
		DateModified: so.updated_at,
		IsOkToCall: 0,
		DefaultBillingCode: custCode,
		AddressType: 'Commercial',
		Plus4: breakPostalCode(so.shipping_address.postcode)["plus4"]
	}
}

exports.generateSQLByTemplate=function(type,table,template,output){
	var sql="", values="";
	switch (type){
		case "INSERT":{
			sql="INSERT INTO "+table+" (";
			// Iterate through keys
			for (var key in template){
				sql+=key+", ";
				values+=(template[key]==null?"NULL":(isNumber(template[key])?template[key]:"'"+template[key]+"'"))+", ";
			}
			// Remove leftovers
			sql=sql.substr(0,sql.length-2);
			values=values.substr(0,values.length-2);
			// Finalize statement 
			sql+=") VALUES ("+values+")"+((output!=undefined)?(';SELECT SCOPE_IDENTITY();'):(''));
		}break;
	}
	
	return sql;
}

function translateFreightCode(code){
	return 'Ground';
}

function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

function breakPostalCode(code){
	var parts=code.indexOf('-')!=-1?code.split('-'):code;
	return {
		postcode:Array.isArray(parts)?parts[0]:parts,
		plus4:Array.isArray(parts)?parts[1]:''
	}
}

function extractTransactionId(status){
	var transId;
	for (var i in status){
		var cmt=status[i].comment;
		if (cmt!=undefined){
			if (cmt.indexOf("Authorized amount of")>-1 && cmt.indexOf("Transaction ID")>-1){
				var prts=cmt.split('"')
				transId=prts[1];
			}
		}
	}
	
	return (transId==null || transId==undefined)?'':transId;
}