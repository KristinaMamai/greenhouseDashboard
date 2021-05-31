var configValues=require('./config'); module.exports={ 
    getDbConnectionString:function(){ 
        //  'postgres://{db_username}:{db_password}@{host}:{port}/{db_name}'         
		return 'postgres://'+configValues.username+':'+configValues.password +'@'+configValues.host+':'+
				configValues.port+'/'+configValues.dbname; 
    } 
} 
