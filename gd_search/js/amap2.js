(function(win){
	win.mapObj={
		hasPrototype:false,
		newClass:function(eleId){
			if(!this.hasPrototype){
				this.init.prototype=win.mapObj;
				this.hasPrototype=true;
			}
			return new this.init(eleId);
		},
		init:function(eleId){
			if(eleId){
				this.mapDiv=document.getElementById(eleId);
				this.centerPoint={};
				this.centerPoint.x=parseInt(getComputedStyle(this.mapDiv)["width"])/2;
				this.centerPoint.y=parseInt(getComputedStyle(this.mapDiv)["height"])/2;
			}
		},
		drawMap:function(eleId,callback){			
			eleId?(eleId=eleId):(document.body.id="eleBody",eleId="eleBody");
			var _this=this;
			_this.map = new AMap.Map(eleId, {
					resizeEnable:true,
					view: new AMap.View2D({
						zoom:13
					})
				});
			_this.getGDAddress(callback);
		},
		getGDAddress:function(callback){
			var _this=this;
			_this.map.plugin('AMap.Geolocation', function () {
				_this.geolocation = new AMap.Geolocation({
					enableHighAccuracy: true,//是否使用高精度定位，默认:true
					timeout: 15000,          //超过10秒后停止定位，默认：无穷大
					maximumAge: 0,           //定位结果缓存0毫秒，默认：0
					convert: true,           //自动偏移坐标，偏移后的坐标为高德坐标，默认：true
					showButton: true,        //显示定位按钮，默认：true
					showMarker: true,        //定位成功后在定位到的位置显示点标记，默认：true
					showCircle: true,        //定位成功后用圆圈表示定位精度范围，默认：true
					panToLocation: true,     //定位成功后将定位到的位置作为地图中心点，默认：true
					zoomToAccuracy:true      //定位成功后调整地图视野范围使定位位置及精度范围视野内可见，默认：false
				});
				_this.map.addControl(_this.geolocation);
				AMap.event.addListener(_this.geolocation, 'complete', function(data){
					_this.aMaplatlng={"lng":data.position.getLng(),"lat":data.position.getLat()};
					if(callback && typeof callback=="function")
					{
						callback(data.position.getLat(),data.position.getLng());
					}
				});//返回定位信息
                
                AMap.event.addListener(_this.geolocation, 'error', function(data){
					var b=data;
					
				});      //返回定位出错信息
                _this.geolocation.getCurrentPosition();
			});
			
			
		},
		getAddress:function (lat,lng,callback){
			 _this=this;
			AMap.service(["AMap.Geocoder"], function() { 
				geocoder = new AMap.Geocoder({
					radius: 1000,
					extensions: "all"
				});
			   
				geocoder.getAddress(new AMap.LngLat(lng,lat), function(status, result){
					if(status=='error') {
						if(typeof callback=="function")
							callback({state:-1,message:"请求服务器出错！"});
					}
					if(status=='no_data') {
						if(typeof callback=="function")
						callback({state:0,message:"无数据返回，请换个关键字试试～～"});
					}
					else {
						_this.result=result;
						if(typeof callback=="function")
						callback({state:1,message:"编码成功",address:result});
					   
					}
				});
			}); 
		},
		containTolnglat:function(pagePoint){
				var _this=this;
				var latlng = _this.map.containTolnglat(new AMap.Pixel(pagePoint.x,pagePoint.y));
				return latlng;
		},
		lnglatTocontainer:function(lnglat){
			var _this=this;
			var point = _this.map.lnglatTocontainer(new AMap.LngLat(lnglat.lng,lnglat.lat));  
			return point;
		},
		addMarker:function(option){
			marker = new AMap.Marker({				  
				icon: option.icon?option.icon:"http://webapi.amap.com/images/marker_sprite.png",
				position:new AMap.LngLat(option.lng,option.lat),
				offset: new AMap.Pixel(option.pixelX,option.pixelY), //相对于基点的偏移位置,
			   /* icon:new AMap.Icon({  //复杂图标                 
					size:new AMap.Size(28,37),//图标大小                 
					image:"http://cache.amap.com/lbs/static/custom_a_j.png",//大图地址                 
					imageOffset:new AMap.Pixel(-28,0)//相对于大图的取图位置                 
				  })*/
			});
			marker.setMap(this.map); 
		},
		getGPSAddress:function(){
			var _this=this;   
			if(navigator.geolocation)
			{
				window.navigator.geolocation.getCurrentPosition(
					  function(pos){
						if(pos!=null){
							
							var latlng={								
									lat:pos.coords.latitude,
									lng:pos.coords.longitude,
									accuracy:pos.coords.accuracy
									};
							_this.gpsLatLng=latlng;	
							_this.aMaplatlng=_this.GpsCorrect.transform(_this.gpsLatLng);
							_this.map(1);
						  }
						  else{
							alert("没有gps位置");
						  }
					  },
					  function(err){
							alert(err.message);
					  }
				 ); 
			}
			else{
					alert("该浏览器不支持h5定位");
			}
		},
		autoComplete:function(keywords,callback){
			var auto;
			var _this=this;
			var cityCode=_this.result?_this.result.regeocode.addressComponent.citycode:"010";
			//加载输入提示插件
				AMap.service(["AMap.Autocomplete"], function() {
				var autoOptions = {
					city: cityCode //城市，默认全国
				};
				auto = new AMap.Autocomplete(autoOptions);
				//查询成功时返回查询结果
				auto.search(keywords, function(status, result){
					callback(status,result);
				});
			});	
		},
		placeSearch:function(keyWord,cb){
			var _this=this;              
			var cityCode=_this.result?_this.result.regeocode.addressComponent.citycode:"010";
			 //根据选择的输入提示关键字查询
			_this.map.plugin(["AMap.PlaceSearch"], function() {       
				var msearch = new AMap.PlaceSearch();  //构造地点查询类
				AMap.event.addListener(msearch, "complete", cb); //查询成功时的回调函数
				msearch.setCity(cityCode);
				msearch.search(keyWord);  //关键字查询查询
			});
		},
		panTo:function(lnglat)
		{
			if(lnglat)
			{
				var lnglatArr=lnglat.split(",");
				this.map.panTo(new AMap.LngLat(lnglatArr[0],lnglatArr[1]));
			}
		},
		GpsCorrect:{
			 pi:3.14159265358979324,
			 a: 6378245.0,
			 ee: 0.00669342162296594323,
			transform:function(gpsLatLng,callback){
				var latlng={};
				var wgLat=gpsLatLng.lat;
				var wgLon=gpsLatLng.lng;
				
				 if (this.outOfChina(wgLat, wgLon)) { 
			 
					latlng["lat"] = wgLat;  
					latlng["lng"] = wgLon;  
					return;  
				}  
				var dLat = this.transformLat(wgLon - 105.0, wgLat - 35.0);  
				var dLon = this.transformLon(wgLon - 105.0, wgLat - 35.0);  
				var radLat = wgLat / 180.0 * this.pi;  
				var magic = Math.sin(radLat);  
				magic = 1 - this.ee * magic * magic;  
				var sqrtMagic = Math.sqrt(magic);  
				dLat = (dLat * 180.0) / ((this.a * (1 - this.ee)) / (magic * sqrtMagic) * this.pi);  
				dLon = (dLon * 180.0) / (this.a / sqrtMagic * Math.cos(radLat) * this.pi);  
				latlng["lat"] = wgLat + dLat;  
				latlng["lng"] = wgLon + dLon;  
				if(typeof callback=="function")
				{
					callback(latlng);
				}
			   
				return latlng;
			},
			outOfChina:function( lat,   lon) {  
				if (lon < 72.004 || lon > 137.8347)  
					return true;  
				if (lat < 0.8293 || lat > 55.8271)  
					return true;  
				return false;  
			},
			transformLat:function(  x,   y) {  
				var ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));  
				ret += (20.0 * Math.sin(6.0 * x * this.pi) + 20.0 * Math.sin(2.0 * x * this.pi)) * 2.0 / 3.0;  
				ret += (20.0 * Math.sin(y * this.pi) + 40.0 * Math.sin(y / 3.0 * this.pi)) * 2.0 / 3.0;  
				ret += (160.0 * Math.sin(y / 12.0 * this.pi) + 320 * Math.sin(y * this.pi / 30.0)) * 2.0 / 3.0;  
				return ret;  
			} ,
			transformLon:function(x,y) {  
				var ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));  
				ret += (20.0 * Math.sin(6.0 * x * this.pi) + 20.0 * Math.sin(2.0 * x * this.pi)) * 2.0 / 3.0;  
				ret += (20.0 * Math.sin(x * this.pi) + 40.0 * Math.sin(x / 3.0 * this.pi)) * 2.0 / 3.0;  
				ret += (150.0 * Math.sin(x / 12.0 * this.pi) + 300.0 * Math.sin(x / 30.0 * this.pi)) * 2.0 / 3.0;  
				return ret;  
			}
		}
	}
})(window);	