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
exports.salesOrder=function(so,cust,bill,ship){
	return {
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
		UserModified: 'eSC',
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
		UserModified: 'eSC',
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
		UserModified: 'eSC',
		IsOkToCall: 0,
		DefaultBillingCode: custCode,
		AddressType: 'Commercial',
		Plus4: breakPostalCode(so.shipping_address.postcode)["plus4"]
	}
}

// AfterExecuteOnCRMContact, AuditTrail, SetContactMissingSiteInfo, sp_procedure_params_100_managed, UpdateOnCustomer, UpdateCustomer, UpdateOnCustomerShipTo, UpdateCustomerShipTo, 

function translateFreightCode(code){
	return 'Ground';
}

exports.generateSQLByTemplate=function(type,table,template,output){
	var sql="", values="";
	switch (type){
		case "INSERT":{
			sql="INSERT INTO "+table+" (";
			// Iterate through keys
			for (var key in template){
				sql+=key+", ";
				values+=(isNumber(template[key])?template[key]:"'"+template[key]+"'")+", ";
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