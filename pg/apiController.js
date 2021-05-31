var config = require("../config"); 
var pgp = require("pg-promise")(); 
var db = pgp(config.getDbConnectionString()); 
 
module.exports = function (app) {   

//get sensors list
app.get("/api/sensors", function (req, res) { 
    db.any("SELECT DISTINCT sensor_name FROM sensor") 
      .then(function (data) {         res.json({           status: "success",           data: data, 
        }); 
      }) 
      .catch((err) => {         res.json({ 
          description: "Can’t find any room",           error: err, 
        }); 
      }); 
  }); 

//send data to server
app.get("/api/send", function (req, res) { 

    var sensor = req.query.sensor;
    var value = req.query.value;
    var authkey = req.query.authkey;
    var user = req.query.user;
    var type = req.query.type;
    var today = new Date();
    var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
    var time = today.getHours()+':'+today.getMinutes()+':'+today.getSeconds();
    var datetime = date + ' ' + time;

    

    db.any(`INSERT INTO datasensor (date_time, id_user, id_sensors, data, id_typevalue) values ('${datetime}',${user},${sensor},${value},'${type}')`) 
      .then(function (data) {         res.json({           status: "success",           data: data, 
        }); 
      }) 
      .catch((err) => {         res.json({ 
          description: "Cannot insert. May be values are not provided",           error: err, 
        }); 
      }); 
  });


//Each sensor last readings for current user
 app.get("/api/lastreadings", function (req,res){
   auth = req.session.auth;
	db.any(`select distinct on (id_sensors, id_typevalue) * from (select distinct public.datasensor.id, date_time, data, id_typevalue, id_user, id_sensors from public.datasensor where public.datasensor.id_user = (select id from public.user where auth_key = '${auth}') order by date_time desc) as e order by id_sensors`) 
      .then(function (data) {         res.json({           status: "success",           data: data, 
        }); 
      }); 
	
});

//Login
app.post("/api/login", function (req,res){
	
	var user = req.body.username;
	var pass = req.body.pass;

	
	db.any(`SELECT * FROM public.user WHERE username = '${user}' and pass_hash = '${pass}'`) 
      .then(function (data) {         
		if (data.length > 0){
          req.session.auth = data[0]['auth_key'];
          if (data[0]['is_super']){
              req.session.issuper = true;
          }else{ req.session.issuper = false;}
	        res.json({           status: "success",           data: data, }); 
		}else{
			res.json({           status: "error",           data: data, }); 
          req.session.auth = "None";
		}
		console.log(data);
      });
	  
});
 

//Logout 
app.post("/api/logout", function (req,res){
	req.session.auth = "None";
  req.session.issuper = false;
  res.json({status:"success"})

    }); 

//Create new not super user
app.post("/api/createnewuser", function (req,res){
  if (req.session.issuper){
    username = req.body.username;
    password = req.body.password;
    auth_key = req.body.auth;
    is_super = false;
    db.any(`INSERT INTO public.user (username, pass_hash, auth_key, is_super) values ('${username}','${password}','${auth_key}','${is_super}')`) 
      .then(function (data) {         res.json({           status: "success",           data: data, 
        }); 
      }) 
      .catch((err) => {         res.json({ 
          description: "Cannot insert. May be values are not provided",           error: err, 
        }); 
      });
  }
  
    });

//Get all users who are not super
app.post("/api/getusers", function (req,res){
	
      var user = req.body.username;
      var pass = req.body.pass;
    
      
      db.any('SELECT * FROM public.user WHERE is_super = false') 
          .then(function (data) {         
        if (data.length > 0){
              res.json({           status: "success",           data: data, }); 
        }else{
          res.json({           status: "error",           data: data, }); 
        }
        console.log(data);
          });
        
});
//delete user
app.post("/api/deleteuser", function (req,res){
	
  var user_id = req.body.user_id;

  
  db.any(`DELETE FROM public.user WHERE id = ${user_id}`) 
      .then(function (data) {         
          res.json({           status: "success",           data: data, }); 

   
      }).catch((err) => {         res.json({ 
        status:"error",           error: err, 
      }); 
    });
    
});


//change device status
app.post("/api/changedevicestatus", function (req,res){
	
  var device_id = req.body.id;
  var auth = req.session.auth;

  db.any(`select value from sensorsettings where sensor_id = ${device_id} and user_id = (select id from public.user where auth_key = '${auth}')`) 
      .then(function (data) { 
        if (data[0]['value'] == '0'){
          db.any(`update sensorsettings set value = 1 where sensor_id = ${device_id} and user_id = (select id from public.user where auth_key = '${auth}')`)
          res.json({           status: "success",           data: data[0]['value'], });
        }else if (data[0]['value'] == '1'){
          db.any(`update sensorsettings set value = 0 where sensor_id = ${device_id} and user_id = (select id from public.user where auth_key = '${auth}')`) 
          res.json({           status: "success",           data: data[0]['value'], });
        }  
           
      }).catch((err) => {         res.json({ 
        status:"error",           error: err, 
      }); 
    });
    
});

//get devices status
app.get("/api/getdevicestatus", function (req,res){
	
  var auth = req.session.auth;

  db.any(`select sensor_id, value from sensorsettings where settingtype_id = 1 and user_id = (select id from public.user where auth_key = '${auth}')`) 
      .then(function (data) { 
         res.json({           status: "success",           data: data, });
   
      }).catch((err) => {         res.json({ 
        status:"error",           error: err, 
      }); 
    });
    
});

//check if greenhouse is current working(look if last 6 mins was any records to db)
app.get("/api/getgreenhousestatus", function (req,res){
	
  var auth = req.session.auth;

  db.any(`select * from datasensor where id_user = (select id from public.user where auth_key = '${auth}') and date_time > now() - interval '6 minutes'`) 
      .then(function (data) { 
        if (data.length > 0){
         res.json({           status: "success",           value: "1", });
        }else{
        res.json({           status: "success",           value: "0"});
        }
   
      }).catch((err) => {         res.json({ 
        status:"error",           error: err, 
      }); 
    });
    
});

}; 




