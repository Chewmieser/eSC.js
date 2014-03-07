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
		//Counter: '',SalesOrderCode: '',SourceSalesOrderCode: '',RootDocumentCode: '',SalesOrderDate: '',ProjectCode: '',
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
		//POCode: '',PODate: '',
		WarehouseCode: 'MAIN',
		ShippingMethodGroup: 'DEFAULT',
		ShippingMethodCode: translateFreightCode(so.shipping_method),
		//ShippingDate: '',LatestShipDate: '',DueDate: '',CancelDate: '',
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
		//StartDate: '',DatePaid: '',
		CurrencyCode: 'USD',
		ExchangeRate: '1.0',
		ARAccountCode: '1100-1',
		FreightAccountCode: '4100-1',
		DiscountAccountCode: '4000-1',
		OtherAccountCode: '7100-0',
		BillToName: (so.billing_address.company != undefined ? so.billing_address.company : so.billing_address.firstname+' '+so.billing_address.lastname),
		BillToAddress: so.billing_address.street,
		BillToCity: '',//so.billing_address.city,
		BillToState: '',//translateState(so.billing_address.region),
		BillToPostalCode: Array.isArray((so.billing_address.postcode).indexOf('-')!=-1?(so.billing_address.postcode).split('-'):(so.billing_address.postcode))?((so.billing_address.postcode).indexOf('-')!=-1?(so.billing_address.postcode).split('-'):(so.billing_address.postcode))[0]:((so.billing_address.postcode).indexOf('-')!=-1?(so.billing_address.postcode).split('-'):(so.billing_address.postcode)),
		BillToCounty: '',
		BillToCountry: '',//translateCountry(so.billing_address.country_id),
		BillToPhone: so.billing_address.telephone,
		//BillToPhoneExtension: '',
		ShipToName: so.shipping_address.firstname+' '+so.shipping_address.lastname,
		ShipToAddress: (so.billing_address.company != undefined ? so.billing_address.company+"'+ CHAR(13) + CHAR(10) +'" : '')+so.shipping_address.street,
		ShipToCity: '',//so.shipping_address.city,
		ShipToState: '',//translateState(so.shipping_address.region),
		ShipToPostalCode: Array.isArray((so.shipping_address.postcode).indexOf('-')!=-1?(so.shipping_address.postcode).split('-'):(so.shipping_address.postcode))?((so.shipping_address.postcode).indexOf('-')!=-1?(so.shipping_address.postcode).split('-'):(so.shipping_address.postcode))[0]:((so.shipping_address.postcode).indexOf('-')!=-1?(so.shipping_address.postcode).split('-'):(so.shipping_address.postcode)),
		ShipToCounty: '',
		ShipToCountry: '',//translateCountry(so.shipping_address.country_id),
		ShipToPhone: so.shipping_address.telephone,
		//ShipToPhoneExtension: '',
		ContactCode: bill,
		Type: 'Sales Order',
		OrderStatus: 'Open',
		IsProcessed: 0,
		IsAllowBackOrder: 1,
		Balance: so.grand_total-so.payment.amount_ordered,
		BalanceRate: so.grand_total-so.payment.amount_ordered,
		//ApplyTo: '',
		SalesRepOrderCode: so.increment_id,
		AppliedCredit: '0.00',
		AppliedCreditRate: '0.00',
		Discount: so.discount_amount,
		DiscountRate: so.discount_amount,
		WriteOff: 0.00,
		WriteOffRate: 0.00,
		Other: 0.00,
		OtherRate: 0.00,
		//OtherName: '',
		OtherTaxCode: 'Sales No Tax',
		OtherTax: '0.00',
		OtherTaxRate: '0.00',
		Notes: '',										// ----------------------------
		IsVoided: 0,
		IsOnHold: 0,
		IsPrinted: 0,
		IsOrderAcknowledged: 0,
		//OpportunityCode: '',ReceivableCode: '',
		IsFromContract: 0,
		//RecurDocumentCode: '',
		PrintCount: 0,
		//CouponID: '',CouponCode: '',
		CouponDiscount: 0.00,
		CouponDiscountRate: 0.00,
		//CouponDiscountType: '',
		CouponDiscountPercent: 0.00,
		CouponDiscountAmount: 0.00,
		CouponUsage: 0,
		CouponDiscountIncludesFreeShipping: 0,
		CouponRequiresMinimumOrderAmount: 0.00,
		IsFreightOverwrite: 1,
		//CouponType: '',
		WebSiteCode: 'WEB-000002',
		UserCreated: 'eSC',
		//DateCreated: '',UserModified: '',DateModified: '',WaveCode: '',SourceType: '',POSWorkstationID: '',POSClerkID: '',DownloadEmailSentDate: '',RootOrderCode: '',MLID: '',DateShipped: '',IsShipped: '',SaveCounterID: '',CouponComputation: '',
		TaxGroup1: so.tax_amount,
		TaxGroup1Rate: so.tax_amount,
		//TaxGroup2: '',TaxGroup2Rate: '',TaxGroup3: '',TaxGroup3Rate: '',IsCBN: '',CBNPO: '',CBNSO: '',CBNState: '',
		InternalNotesCode: 'Select a Note or type below',
		//InternalNotesDescription: '',InternalNotes: '',
		PublicNotesCode: 'Select a Note or type below',
		//PublicNotesDescription: '',PublicNotes: '',ReturnedSubTotal: '',ReturnedSubTotalRate: '',ReturnedTax: '',ReturnedTaxRate: '',
		IsPickUp: 0,
		BillToAddressType: 'Commercial',
		ShipToAddressType: 'Commercial',
		MerchantOrderID_DEV000221: so.increment_id,
		//PaymentFailedEmailSent_DEV000221: '',SourceFeedbackMessage_DEV000221: '',SourceFeedbackType_DEV000221: '',
		StoreMerchantID_DEV000221: 'Main',
		IsBlindShip: 0,
		//IsFreightQuoted: '',Signature: '',SignatureSVG: '',CBNMasterID: '',
		BillToPlus4: Array.isArray((so.billing_address.postcode).indexOf('-')!=-1?(so.billing_address.postcode).split('-'):(so.billing_address.postcode))?((so.billing_address.postcode).indexOf('-')!=-1?(so.billing_address.postcode).split('-'):(so.billing_address.postcode))[1]:((so.billing_address.postcode).indexOf('-')!=-1?(so.billing_address.postcode).split('-'):''),
		ShipToPlus4: Array.isArray((so.shipping_address.postcode).indexOf('-')!=-1?(so.shipping_address.postcode).split('-'):(so.shipping_address.postcode))?((so.shipping_address.postcode).indexOf('-')!=-1?(so.shipping_address.postcode).split('-'):(so.shipping_address.postcode))[1]:((so.shipping_address.postcode).indexOf('-')!=-1?(so.shipping_address.postcode).split('-'):'')
	};
}

// Generates a customer based on SO - Looks like enough information to proceed
exports.customer=function(code,so){
	return {
		//Counter: '',
		CustomerCode: code,
		CustomerName: (so.billing_address.company != undefined ? so.billing_address.company : so.billing_address.firstname+' '+so.billing_address.lastname),
		Address: so.billing_address.street,
		City: '',//so.billing_address.city,
		State: '',//translateState(so.billing_address.region),
		PostalCode: Array.isArray((so.billing_address.postcode).indexOf('-')!=-1?(so.billing_address.postcode).split('-'):(so.billing_address.postcode))?((so.billing_address.postcode).indexOf('-')!=-1?(so.billing_address.postcode).split('-'):(so.billing_address.postcode))[0]:((so.billing_address.postcode).indexOf('-')!=-1?(so.billing_address.postcode).split('-'):(so.billing_address.postcode)),
		County: '',
		Country: '',//translateCountry(so.billing_address.country_id),
		Telephone: so.billing_address.telephone,
		//TelephoneExtension: '',Fax: '',FaxExtension: '',
		Email: so.customer_email,
		//Website: '',Notes: '',
		SourceCode: 'MagentoOrder',
		//DefaultContact: '',DefaultAPContact: '',		//---- Modified later on?
		//DefaultContractCode: '',
		ClassCode: 'CCLS-000225',
		GLClassCode: 'Default',
		CurrencyCode: 'USD',
		DefaultPrice: 'Wholesale',
		PricingMethod: 'None',
		Discount: '0.00',
		//DiscountBand: '',WebUserName: '',WebPassword: '',Pricing: '',
		CreditLimit: '0.00',
		Credit: '0.00',
		PricingPercent: '1.00',
		IsActive: 1,
		IsCreditHold: 0,
		IsProspect: 0,
		IsAllowBackOrder: 1,
		IsWebAccess: 0,
		//IsPrinted: '',PricingLevel: '',SalesRepGroupCode: '',
		Commission: 'Sales Rep',
		CommissionPercent: '0.00',
		//TaxNumber: '',BusinessLicense: '',RecallDate: '',DebtChaser: '',SendPreference: '',DebtChaseStatus: '',IsDocumentStop: '',HeadOffice: '',
		Rank: '0.00',
		CreditRating: '0.00',
		//LastCreditReview: '',NextCreditReview: '',LastStatementSentDate: '',LastStatementSentBy: '',LastLetterSentDate: '',LastLetterSentBy: '',LastLetterSentType: '',CouponCode: '',SubscriptionExpiresOn: '',GiftRegistryGUID: '',
		IsFromProspect: 0,
		//PrintCount: '',LastRankCalculated: '',
		IsRankUserOverriden: 0,
		AssignedTo: 'eSC',
		//DefaultShipToCode: '',				//------- Later mod
		//ResidenceType: '',
		DiscountType: 'Overall',
		UserCreated: 'eSC',
		//DateCreated: '',
		UserModified: 'eSC',
		//DateModified: '',
		TotalCredits: '0.00',
		IsRTShipping: 0,
		//RTShipRequest: '',RTShipResponse: '',TeamCode: '',TerritoryCode: '',CustomerGUID: '',LastIPAddress: '',CustomerSessionID: '',
		Over13Checked: 0,
		CustomerTypeCode: 'End User',
		BusinessType: 'Wholesale',
		//MLID: '',
		CustomerBalance: '0.00',
		CustomerBalanceRate: '0.00',
		FirstName: so.billing_address.firstname,							//--
		MiddleName: '',
		LastName: so.billing_address.lastname,
		//ProductFilterID: '',CreditCardCode: '',DefaultBillingAddress: '',ProductFilterTemplateNamePricingImport: '',MaxDiscount: '',IsCBN: '',CBNNetworkID: '',CBNAccountStatusId: '',
		AddressType: 'Commercial',
		ImportCustomerID_DEV000221: '',				//---
		//ImportSourceBuyerID_DEV000221: '',
		ImportSourceID_DEV000221: 'MagentoOrder',
		//IsBlindShip: '',ShowOnStoreLocator: '',
		Plus4: Array.isArray((so.billing_address.postcode).indexOf('-')!=-1?(so.billing_address.postcode).split('-'):(so.billing_address.postcode))?((so.billing_address.postcode).indexOf('-')!=-1?(so.billing_address.postcode).split('-'):(so.billing_address.postcode))[1]:((so.billing_address.postcode).indexOf('-')!=-1?(so.billing_address.postcode).split('-'):'')
		//CustomerLegacyCode: '',VersionCreated: '',VersionModified: ''
	};
}

exports.customerShipTo=function(code,custCode,so){
	return {
		//Counter: '',
		CustomerCode: custCode,
		ShipToCode: code,
		ShipToName: so.shipping_address.firstname+' '+so.shipping_address.lastname,
		ClassCode: 'SHPCLS-000463',
		GLClassCode: 'Default',
		//ContactCode: '',
		Address: (so.billing_address.company != undefined ? so.billing_address.company+"'+ CHAR(13) + CHAR(10) +'" : '')+so.shipping_address.street,
		City: '',//so.shipping_address.city,
		State: '',//translateState(so.shipping_address.region),
		PostalCode: Array.isArray((so.shipping_address.postcode).indexOf('-')!=-1?(so.shipping_address.postcode).split('-'):(so.shipping_address.postcode))?((so.shipping_address.postcode).indexOf('-')!=-1?(so.shipping_address.postcode).split('-'):(so.shipping_address.postcode))[0]:((so.shipping_address.postcode).indexOf('-')!=-1?(so.shipping_address.postcode).split('-'):(so.shipping_address.postcode)),
		County: '',
		Country: '',//translateCountry(so.shipping_address.country_id),
		//RouteCode: '',
		Telephone: so.shipping_address.telephone,
		//TelephoneExtension: '',Fax: '',FaxExtension: '',
		Email: so.customer_email,
		//WebSite: '',
		TaxCode: 'Sales No Tax',
		ShippingMethodGroup: 'DEFAULT',
		ShippingMethod: 'Ground',
		WarehouseCode: 'MAIN',
		//Notes: '',
		IsAllowBackOrder: 0,
		IsActive: 1,
		IsCreditHold: 0,
		//SalesRepGroupCode: '',
		Commission: 'Sales Rep',
		CommissionPercent: 0.00,
		//TaxNumber: '',BusinessLicense: '',
		CreditLimit: 0.00,
		//PricingMethod: '',
		PricingPercent: 0.00,
		PricingLevel: 0,
		PaymentTermGroup: 'DEFAULT',
		PaymentTermCode: 'Credit Card',
		OpenTime: '2006-04-26 09:00:00',
		CloseTime: '2006-04-26 18:00:00',
		SpecialInstructions: 'None',
		//TruckSize: '',
		IsBookTimeDateAndBay: 0,
		UserCreated: 'eSC',
		//DateCreated: '',
		UserModified: 'eSC',
		//DateModified: '',
		FreightTax: 'Sales No Tax',
		OtherTax: 'Sales No Tax',
		//MLID: '',
		AddressType: 'Commercial',
		Plus4: Array.isArray((so.shipping_address.postcode).indexOf('-')!=-1?(so.shipping_address.postcode).split('-'):(so.shipping_address.postcode))?((so.shipping_address.postcode).indexOf('-')!=-1?(so.shipping_address.postcode).split('-'):(so.shipping_address.postcode))[1]:((so.shipping_address.postcode).indexOf('-')!=-1?(so.shipping_address.postcode).split('-'):'')
		//ShipToLegacyCode: '',VersionCreated: '',VersionModified: ''
	};
}

exports.customerContact=function(code,custCode,so){
	return {
		//Counter: '',
		ContactCode: code,
		EntityCode: custCode,
		Type: 'CustomerContact',
		//ContactSalutationCode: '',
		ContactFirstName: so.shipping_address.firstname,
		//ContactMiddleName: '',
		ContactLastName: so.shipping_address.lastname,
		//ContactSuffixCode: '',BusinessTitle: '',JobRoleCode: '',DepartmentCode: '',
		AssignedTo: 'eSC',
		Address: so.shipping_address.address,
		Country: '',
		City: '',
		State: '',
		PostalCode: Array.isArray((so.shipping_address.postcode).indexOf('-')!=-1?(so.shipping_address.postcode).split('-'):(so.shipping_address.postcode))?((so.shipping_address.postcode).indexOf('-')!=-1?(so.shipping_address.postcode).split('-'):(so.shipping_address.postcode))[0]:((so.shipping_address.postcode).indexOf('-')!=-1?(so.shipping_address.postcode).split('-'):(so.shipping_address.postcode)),
		County: '',
		BusinessPhone: so.shipping_address.telephone,
		//BusinessPhoneLocalNumber: '',BusinessPhoneExtension: '',BusinessFax: '',BusinessFaxLocalNumber: '',BusinessFaxExtension: '',HomePhone: '',HomePhoneLocalNumber: '',HomePhoneExtension: '',HomeFax: '',HomeFaxLocalNumber: '',HomeFaxExtension: '',ISDN: '',ISDNLocalNumber: '',ISDNExtension: '',Mobile: '',MobileLocalNumber: '',MobileExtension: '',Pager: '',PagerLocalNumber: '',PagerExtension: '',
		Email1: so.customer_email,
		//Email2: '',
		TimeZone: '',			// -- Lookup with addr
		//ManagerCode: '',AssistantSalutationCode: '',AssistantFirstName: '',AssistantMiddleName: '',AssistantLastName: '',AssistantSuffixCode: '',AssistantPhone: '',AssistantPhoneLocalNumber: '',AssistantPhoneExtension: '',IsAllowWebAccess: '',
		Username: '',
		Password: so.customer_email,
		//PasswordIV: '',PasswordSalt: '',
		LanguageCode: 'English - United States',
		//SubscriptionExpirationOn: '',EmailRule: '',
		IsActive: 1,
		UserCreated: 'eSC',
		//DateCreated: '',
		UserModified: 'eSC',
		//DateModified: '',
		//IsOkToEmail: '',IsOkToFax: '',
		IsOkToCall: 0,
		//WebSiteCode: '',MLID: '',ProductFilterID: '',
		DefaultBillingCode: custCode,
		//DefaultShippingCode: '',ContactGUID: '',ProductFilteringTemplateNamePricingImport: '',TemplateCodePricingImport: '',
		AddressType: 'Commercial',
		Plus4: Array.isArray((so.shipping_address.postcode).indexOf('-')!=-1?(so.shipping_address.postcode).split('-'):(so.shipping_address.postcode))?((so.shipping_address.postcode).indexOf('-')!=-1?(so.shipping_address.postcode).split('-'):(so.shipping_address.postcode))[1]:((so.shipping_address.postcode).indexOf('-')!=-1?(so.shipping_address.postcode).split('-'):'')
		//ContactLegacyCode: '',VersionCreated: '',VersionModified: ''
	}
}

// CustomerAccount, CRMContact, AfterExecuteOnCRMContact, AuditTrail, SetContactMissingSiteInfo, sp_procedure_params_100_managed, UpdateOnCustomer, UpdateCustomer, UpdateOnCustomerShipTo, UpdateCustomerShipTo, 

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