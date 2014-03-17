// Magento poll console
var config=require('./config.js');
var soap=require('soap');
var readline=require('readline');
var sessionId;

soap.createClient(config.magento.url, function(err,client){
	client.login({username:config.magento.user, apiKey:config.magento.key}, function(err,result){
		sessionId=result.loginReturn;
		
		// Wait for console input and execute, returning result
		var rl=readline.createInterface({
		  input: process.stdin,
		  output: process.stdout
		});
			
		rl.setPrompt("> ",2);
		rl.prompt();
		
		rl.on('line',function(cmd){
			var parts=cmd.split("|");
			var args=JSON.parse(parts[1]);
			args.sessionId=sessionId;
			
			client[parts[0]](args,function(err,res){
				console.log(res);
				rl.prompt();
			});
		});
		
		rl.on('close',function(){
			rl.close();
		});
	});
});