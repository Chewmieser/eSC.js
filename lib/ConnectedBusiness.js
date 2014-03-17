/*
       ____   ____    _     
   ___/ ___| / ___|  (_)___   ConnectedBusiness Module
  / _ \___ \| |      | / __|  ------------------------
 |  __/___) | |___ _ | \__ \  |- Central point for ConnectedBusiness manipulation
  \___|____/ \____(_)/ |___/  
                   |__/       

*/

var User=require('./ConnectedBusiness/user.js');
var Order=require('./ConnectedBusiness/order.js');
var templates=require('./ConnectedBusiness/templates.js');
var connection, Request, user, order, log;

module.exports=function CB(conn, req, lg){
	connection=conn; Request=req; log=lg;
	
	user=new User(connection,Request,templates,log);
	order=new Order(connection,Request,templates,user,log);
	
	return {
		user:user,
		order:order
	}
}