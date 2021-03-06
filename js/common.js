/**
 * 公共工具类
 * 1、图片加水印：watermark({"name":"张三","srcImage":<源图路径>,"targetImage":<目标图路径>}, successFn)
 * 2、获取当前位置：getLocation(successFn)=>北京市海淀区北清路68号
 * 3、日期时间格式化：datePattern("yyyy-MM-dd EE hh:mm:ss", date) =>2009-03-10 周二 08:09:04
 * 4、兼容获取权限：getPermission(["android.permission.ACCESS_FINE_LOCATION","android.permission.ACCESS_COARSE_LOCATION"], successFn)
 */
// 易汇测试地址
window.G_COMMON_URL = "http://106.15.55.173:8090/appservice-yh/";
// 易汇测试地址(易汇服务器)
//window.G_COMMON_URL = "http://192.168.5.187:9096/appservice-yh/";

function userId() {
	var userinfo = summer.getStorage("userinfo");
	var EMPLOYEE_ID = userinfo ? userinfo.EMPLOYEE_ID : "";
	return EMPLOYEE_ID;
}

var CommonUtil = {
	//图片加水印
	watermark: function (params) {
		//调用定位
		var self = this;
		this.getLocation(function (args) {
			var textgroup;
			if($summer.os == "ios"){
				textgroup = [{
					text : params.name,
					style : {
						"left" : "2",
						"bottom" : "22",
						"font-size" : "8"
					}
				}, {
					text : (new Date()).format("yyyy-MM-dd hh:mm:ss"),
					style : {
						"left" : "2",
						"bottom" : "12",
						"font-size" : "8"
					}
				}, {
					text : args.address,
					style : {
						"left" : "2",
						"bottom" : "2",
						"font-size" : "8"
					}
				}];
			} else {
				textgroup = [{
					text : params.name,
					style : {
						"left" : "1",
						"bottom" : "5",
						"font-size" : "6"
					}
				}, {
					text : (new Date()).format("yyyy-MM-dd hh:mm:ss"),
					style : {
						"left" : "1",
						"bottom" : "3",
						"font-size" : "6"
					}
				}, {
					text : args.address,
					style : {
						"left" : "1",
						"bottom" : "1",
						"font-size" : "6"
					}
				}];
			}
			
			var data = {
				"src": params.srcImage, //源图片路径
				"target": params.targetImage, //目标图片路径
				"textGroup": textgroup,
				"callback": params.callback
			};
			summer.callService("UMGraphics.watermark", data, false);
		});
	},
	//获取当前位置
	getLocation: function (successFn) {
		summer.getNativeLocation({
			"single": "true"
		}, function (args) {
			successFn(args);
		}, function (args) {
			summer.toast({
				"msg": "获取位置信息错误：" + JSON.stringify(args)
			});
		});
	},
};

function ajaxRequest(paramObj, successCallback, errorCallback) {
	var testPath = '';
	var paramData = {};
	if (paramObj.fullUrl) {
		testPath = paramObj.url
	} else {
		testPath = G_COMMON_URL + paramObj.url;
	}

	if (paramObj.contentType) {
		header["Content-Type"] = paramObj.contentType;
	}
	//判断网络
	if (!summer.netAvailable()) {
		summer.hideProgress();
		summer.toast({
			msg: "网络异常，请检查网络"
		});
		return false;
	}
	//设置超时
	window.cordovaHTTP.settings = {
		timeout: 120000
    };
    if (userId()) {
        paramData = paramObj.param;
        if (!paramObj.param.getEmployeeID || paramObj.param.getEmployeeID == "get") {
            paramData.EMPLOYEE_ID = userId();
        }
	} else {
		paramData = paramObj.param;
	}
	summer.ajax({
		type: paramObj.type,
		url: testPath,
		param: paramObj.param,
		// 考虑接口安全，每个请求都需要将这个公告header带过去
		header: {
			"Content-Type": "application/json"
		}
	}, function (response) {
        summer.refreshHeaderLoadDone();
        summer.refreshFooterLoadDone();
		if (Object.prototype.toString.call(response.data) === '[object String]') {
			response.data = JSON.parse(response.data);
		}
		if (response.data.code == "R10002") {
			summer.hideProgress();
            summer.toast({
                msg: "登录过期，请重新登录"
            });
			summer.openWin({
				id: 'login',
				url: 'login.html',
				isKeep: true,
				create: false,
				type: 'actionBar',
				actionBar: {
					title: "登录",
					titleColor: "#ffffff", //注意必须是6位数的颜色值。（3位数颜色值会不正常）
					backgroundColor: "#039be5",
					leftItem: {
						image: "img/opacity0.png",
						method: "none()", //返回按钮自定义事件
						text: "",
						textColor: "#ffffff" //返回文字颜色，注意必须是6位数的颜色值。（3位数颜色值会不正常）
					}
				}
			});
			return;
		}
		if (Object.prototype.toString.call(response.data) === '[object String]') {
			response.data = JSON.parse(response.data);
		}
		if (response.data.flag && response.data.flag == '0') {
			summer.hideProgress();
			successCallback(response);
			summer.toast({
				msg: response.data.msg
			});
			return;
		}
		successCallback(response);
	}, function (response) {
        summer.hideProgress();
        summer.refreshHeaderLoadDone();
        summer.refreshFooterLoadDone();
		summer.toast({
			msg: "数据请求失败" + JSON.stringify(response)
		});
		return;
		//此处还需要和后端沟通，统一失败状态码，统一处理
		// 执行自己的其它逻辑
		errorCallback(response)
	});
}
//判断是否为空
function isEmpty(data) {
	if (data == undefined || data == null || data == "" || data == 'NULL' || data == false || data == 'false') {
		return true;
	}
	return false;
}
//当数据列表数据为空时显示空图片
function createNull(id, url, text) {
	var url = url ? url : "../../img/empty.png";
	var text = text ? text : "暂无数据";
	var html = '<div class="default-error" style="display: -webkit-box;display: flex; -webkit-box-pack: center;justify-content: center; -webkit-box-align: center;align-items: center; -webkit-box-orient: vertical; -webkit-box-direction: normal;flex-direction: column;width: 100%;height: 100%;position: fixed;">' + '<img src=' + url + ' style="width:30%;" alt=""/>' + '<p style="font-size: 14px;color: #CBCBCB;padding-top:20px;">' + text + '</p>' + '</div>';
	var curId = $summer.byId(id);
	$summer.html(curId, html);
}
// 阿拉伯数字转大写汉字
function convertCurrency(money) {
    //汉字的数字
    var cnNums = new Array('零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖');
    //基本单位
    var cnIntRadice = new Array('', '拾', '佰', '仟');
    //对应整数部分扩展单位
    var cnIntUnits = new Array('', '万', '亿', '兆');
    //对应小数部分单位
    var cnDecUnits = new Array('角', '分', '毫', '厘');
    //整数金额时后面跟的字符
    var cnInteger = '整';
    //整型完以后的单位
    var cnIntLast = '元';
    //最大处理的数字
    var maxNum = 999999999999999.9999;
    //金额整数部分
    var integerNum;
    //金额小数部分
    var decimalNum;
    //输出的中文金额字符串
    var chineseStr = '';
    //分离金额后用的数组，预定义
    var parts;
    if (money == '') {
        return '';
    }
    money = parseFloat(money);
    if (money >= maxNum) {
        //超出最大处理数字
        return '';
    }
    if (money == 0) {
        chineseStr = cnNums[0] + cnIntLast + cnInteger;
        return chineseStr;
    }
    //转换为字符串
    money = money.toString();
    if (money.indexOf('.') == -1) {
        integerNum = money;
        decimalNum = '';
    } else {
        parts = money.split('.');
        integerNum = parts[0];
        decimalNum = parts[1].substr(0, 4);
    }
    //获取整型部分转换
    if (parseInt(integerNum, 10) > 0) {
        var zeroCount = 0;
        var IntLen = integerNum.length;
        for (var i = 0; i < IntLen; i++) {
            var n = integerNum.substr(i, 1);
            var p = IntLen - i - 1;
            var q = p / 4;
            var m = p % 4;
            if (n == '0') {
                zeroCount++;
            } else {
                if (zeroCount > 0) {
                    chineseStr += cnNums[0];
                }
                //归零
                zeroCount = 0;
                chineseStr += cnNums[parseInt(n)] + cnIntRadice[m];
            }
            if (m == 0 && zeroCount < 4) {
                chineseStr += cnIntUnits[q];
            }
        }
        chineseStr += cnIntLast;
    }
    //小数部分
    if (decimalNum != '') {
        var decLen = decimalNum.length;
        for (var i = 0; i < decLen; i++) {
            var n = decimalNum.substr(i, 1);
            if (n != '0') {
                chineseStr += cnNums[Number(n)] + cnDecUnits[i];
            }
        }
    }
    if (chineseStr == '') {
        chineseStr += cnNums[0] + cnIntLast + cnInteger;
    } else if (decimalNum == '') {
        chineseStr += cnInteger;
    }
    return chineseStr;
}