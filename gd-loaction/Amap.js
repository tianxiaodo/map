var gdMap={
			haProtoType:false,

			
			drawMap:function(option){
					/*  option	
						divId:地图绑定的元素id string
						resizeEnable:地图允许调整大小 boolean
						zoom:初始缩放比例 number
						longitude:经度 float
						latitude:纬度  float
					*/
                	
					this.option=option;
					this.aMaplatlng={};
					if(!option.longitude&&!option.latitude)
					{	
						this.getGPSAddress();
					}
					else{
						this.aMaplatlng.lat=this.option.latitude;
						this.aMaplatlng.lng=this.option.longitude;

						this.map();
					}	
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
			map:function(){
				var _this=this;
				var divId;
               
               	 _this.option.divId?(divId=_this.option.divId):(document.body.id="eleBody",divId="eleBody");
               
				_this.map = new AMap.Map(divId, {
						resizeEnable: _this.option.resizeEnable?_this.option.resizeEnable:true,
						view: new AMap.View2D({
							center:new AMap.LngLat(_this.aMaplatlng.lng,_this.aMaplatlng.lat),
							zoom:_this.option.zoom?_this.option.zoom:13
						})
					});
                if(this.option["callback"] && typeof this.option["callback"]=="function")
                {
                    	this.option["callback"].call(this);
                }
                 
			},
			containTolnglat:function(pagePoint){
					var _this=this;
					var ll = _this.map.containTolnglat(new AMap.Pixel(pagePoint.x,pagePoint.y));
					return ll;
			},
			lnglatTocontainer:function(lnglat){
				var _this=this;
				var ll = _this.map.lnglatTocontainer(new AMap.LngLat(lnglat.lng,lnglat.lat));  
				return ll;
			},
			addMarker:function(option){
				// alert(option.lng+":"+option.lat+":"+option.pixelX+":"+option.pixelY);
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
				navigator.geolocation.getCurrentPosition(
					  function(pos){
						if(pos){
							var latlng={								
									lat:pos.coords.latitude,
									lng:pos.coords.longitude,
									accuracy:pos.coords.accuracy
									};
							_this.gpsLatLng=latlng;							
							//alert("纬度="+pos.coords.latitude+",经度="+pos.coords.longitude+",精度="+pos.coords.accuracy);
							_this.aMaplatlng=_this.GpsCorrect.transform(_this.gpsLatLng);
                           // alert(_this.aMaplatlng.lat);
							_this.map();
						  }
						  else{
							_this.message="没有gps位置"
						  }
					  },
					  function(err){
							_this.message=err;
					  }
				 ); 
			},
    		placeSearch:function(keyWord,cb){
				var MSearch;
				var _this=this;
				AMap.service(["AMap.PlaceSearch"], function() {  
                    var cityCode=_this.result?_this.result.regeocode.addressComponent.citycode:'010';
					MSearch = new AMap.PlaceSearch({ //构造地点查询类
						pageSize:10,
						pageIndex:1,
						city:cityCode//城市
					});
					_this.placeSearch=MSearch;
					//关键字查询
					MSearch.search(keyWord, function(status, result){
							if(cb && typeof cb=="function")
							{
								cb.call(this,result);
							}					
					}); 
				});
				
			},
            panTo:function(lnglat)
            {
                if(lnglat)
                {
                    //alert(lnglat);
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
	};
	