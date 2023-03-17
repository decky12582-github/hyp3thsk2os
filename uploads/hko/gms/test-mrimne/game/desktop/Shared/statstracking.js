var mineralAndMoneyLog = [];
var totalValueLog = [];
var singleMiningLoopValueSnapshot = [];
var useragent = "";
var camefrom = "0";
var userIdSetInSession = false;
var lastTimeDataWasLogged = 0;
var timesLoggedAtSameTime = 0;
var wasInitialized = false;
var statsigUser = {};
const STATSIG_CLIENT_SDK_KEY = "client-KJvy91lgbAjVvXxzMXwqLy1PUgmN7Hbi6w0PUmxBB17";

//-- Amplitude Event Tracking Setup --
(function(e,t){var n=e.amplitude||{_q:[],_iq:{}};var r=t.createElement("script")
;r.type="text/javascript"
;r.integrity="sha384-tzcaaCH5+KXD4sGaDozev6oElQhsVfbJvdi3//c2YvbY02LrNlbpGdt3Wq4rWonS"
;r.crossOrigin="anonymous";r.async=true
;r.src="https://cdn.amplitude.com/libs/amplitude-8.5.0-min.gz.js"
;r.onload=function(){if(!e.amplitude.runQueuedFunctions){
console.log("[Amplitude] Error: could not load SDK")}}
;var i=t.getElementsByTagName("script")[0];i.parentNode.insertBefore(r,i)
;function s(e,t){e.prototype[t]=function(){
this._q.push([t].concat(Array.prototype.slice.call(arguments,0)));return this}}
var o=function(){this._q=[];return this}
;var a=["add","append","clearAll","prepend","set","setOnce","unset","preInsert","postInsert","remove"]
;for(var c=0;c<a.length;c++){s(o,a[c])}n.Identify=o;var u=function(){this._q=[]
;return this}
;var l=["setProductId","setQuantity","setPrice","setRevenueType","setEventProperties"]
;for(var p=0;p<l.length;p++){s(u,l[p])}n.Revenue=u
;var d=["init","logEvent","logRevenue","setUserId","setUserProperties","setOptOut","setVersionName","setDomain","setDeviceId","enableTracking","setGlobalUserProperties","identify","clearUserProperties","setGroup","logRevenueV2","regenerateDeviceId","groupIdentify","onInit","logEventWithTimestamp","logEventWithGroups","setSessionId","resetSessionId"]
;function v(e){function t(t){e[t]=function(){
e._q.push([t].concat(Array.prototype.slice.call(arguments,0)))}}
for(var n=0;n<d.length;n++){t(d[n])}}v(n);n.getInstance=function(e){
e=(!e||e.length===0?"$default_instance":e).toLowerCase()
;if(!Object.prototype.hasOwnProperty.call(n._iq,e)){n._iq[e]={_q:[]};v(n._iq[e])
}return n._iq[e]};e.amplitude=n})(window,document);

amplitude.getInstance().init("dbd433cd708e693cb06663c8a4448e29");
amplitude.getInstance().logEvent("gameStarted");
//-- End Setup --

//-- Statsig Event Tracking Setup --
var tier = isDevUser ? 'development' : 'production';

var firstSessionVersion = version;
var firstSessionTime = new Date().getTime();
var firstTestVersion = latestTestNumber;
if(localStorage["firstSessionVersion"] == undefined)
{
	localStorage["firstSessionVersion"] = version;
}
else
{
	firstSessionVersion = parseInt(localStorage["firstSessionVersion"]);
	if(isNaN(localStorage["firstSessionVersion"]))
	{
		firstSessionVersion = version;
	}
}

if(localStorage["firstSessionTime"] == undefined)
{
	localStorage["firstSessionTime"] = new Date().getTime();
}
else
{
	firstSessionTime = parseInt(localStorage["firstSessionTime"]);
	if(isNaN(localStorage["firstSessionTime"]))
	{
		firstSessionTime = new Date().getTime();
	}
}

if(localStorage["firstTestVersion"] == undefined)
{
	localStorage["firstTestVersion"] = new Date().getTime();
}
else
{
	firstTestVersion = parseInt(localStorage["firstTestVersion"]);
	if(isNaN(localStorage["firstTestVersion"]))
	{
		firstTestVersion = latestTestNumber;
	}
}

async function statsigInit()
{
	const eventVal = await trackGenericEvent("gameInit", 1); //will trigger user instantiation

	//run init tests from SplitTest.js
	initializeTests();
}
statsigInit();
//-- End Setup --

var statsigUserProperties = {};
async function updateUserProperties()
{
	amplitude.getInstance().setUserId(UID);

	var isSpender = centsSpent > 0;
	var userProperties = {
		"splitTestSeed": uxSeed,
		"gameVersion": version,
		"earliestVersion": earliestVersion,
		"firstTimePlayed": firstTimePlayed,
		"isSpender": isSpender,
		"splitTestValue1": splitTestValue1,
		"isDev": isDevUser,
		"saveFiles": (localStorage["R"] !== undefined ? localStorage["R"].split("|").length - 1 : 0),
		"activePlayTimeMinutes": activePlayTimeMinutes,
		"totalPlayMinutes": totalPlayMinutes,
		"depth": depth,
		"hasImported": hasImported,
		"testNumber": testNumber,
		"basicChestRewardRollerSeed": basicChestRewardRollerSeed,
		"goldenChestRewardRollerSeed": goldenChestRewardRollerSeed,
		"tradeRollerSeed": tradeRollerSeed,
		"caveRollerSeed": caveRollerSeed,
		"clickableRollerSeed": clickableRollerSeed,
		"chestSpawnRollerSeed": chestSpawnRollerSeed,
		"languageOverride": languageOverride,
		"systemLanguage": platform.getSystemLanguage(),
		"platform": platformName(),
		"isFirstSession": (localStorage["R"] !== undefined ? false : true),
		"numGameLaunches": numGameLaunches,
		"firstSessionVersion": firstSessionVersion,
		"firstSessionTime": firstSessionTime,
		"firstTestVersion": firstTestVersion,
		"environment": tier,
		"UID": UID
	};

	//Amplitude setup

	amplitude.getInstance().setUserProperties(userProperties);

	//Statsig setup
	
	statsigUser = {
		userID: UID,
		environment: { tier: tier },
		appVersion: version,
		custom: userProperties
	};
	statsigUserProperties = userProperties;

	if(!wasInitialized)
	{
		wasInitialized = true;
		await statsig.initialize(STATSIG_CLIENT_SDK_KEY, statsigUser);
	}
	else
	{
		await statsig.updateUser(statsigUser);
	}
}

async function logToStatsig(key, value, metaData = {})
{
	var mergedMetaData = {...statsigUserProperties, ...metaData};
	return statsig.logEvent(key, value, mergedMetaData);
}

function logToAmplitude(key, value, labels = {})
{
	amplitude.getInstance().logEvent(key, {"value": value, "labels": labels});
}

function logValuationStats()
{
	mineralAndMoneyLog.push([getValueOfMinerals(), money]);
	totalValueLog.push(getValueOfMinerals() + money);
	if(mineralAndMoneyLog.length > 60)
	{
		mineralAndMoneyLog.splice(0, 1);
	}
	if(totalValueLog.length > 60)
	{
		totalValueLog.splice(0, 1);
	}
}

function lastMinuteChangeInValues()
{
	if(singleMiningLoopValueSnapshot.length <= 1) return 0;

	var totIncreaseInValue = 0;
	var numIncreases = 0;
	for(var i = 0; i < singleMiningLoopValueSnapshot.length; i++)
	{
		if(singleMiningLoopValueSnapshot[i] > 0)
		{
			totIncreaseInValue += parseInt(singleMiningLoopValueSnapshot[i]);
			numIncreases++;
		}
	}
	if(numIncreases <= 0 || totIncreaseInValue <= 0) return 0;
	return Math.floor(totIncreaseInValue / numIncreases) * 10 * 60;
}

// #####################################################
// ############### REMOTE EVENT TRACKING ###############
// #####################################################

async function trackGenericEvent(key, value, labels = {})
{
	const updateUserVal = await updateUserProperties();

	if(typeof isSimulating !== "undefined" && isSimulating)
	{
		return;
	}

	var rawValue = value;
	key = encodeURIComponent(key);
	value = encodeURIComponent(value);
	var url = "https://mrmineservices.com/track.php";
	var eventData = JSON.stringify({
		"key": key,
		"value": value,
		"labels": labels,
		"uid": UID, // set in app.js,
		"playtime": playtime // set in app.js
	});
	url += "?data=" + encodeURIComponent(eventData);

	var xhr = new XMLHttpRequest();
	xhr.open("GET", url, true);
	xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
	xhr.onreadystatechange = function ()
	{
		if(xhr.readyState == 4)
		{
			if(typeof (xhr.responseText) !== "undefined")
			{
				//console.log(xhr.responseText);
			}
		}
	}
	xhr.send();

	if(lastTimeDataWasLogged < currentTime()+1000)
	{
		timesLoggedAtSameTime = 0;
		lastTimeDataWasLogged = currentTime();
	}
	else
	{
		timesLoggedAtSameTime++;
		if(timesLoggedAtSameTime > 2)
		{
			console.log("Event throttled: "+key);
			return;
		}
	}

	logToAmplitude(key, value, labels);
	return logToStatsig(key, value, labels);
}

function trackEvent_DepthIncrease(newDepth)
{
	if(newDepth <= 20 || newDepth % 10 == 0)
	{
		var key = "depthIncrease";
		var value = newDepth;
		trackGenericEvent(key, value);
	}
}

function trackEvent_StartTutorial()
{
	var key = "startTutorial";
	var value = 1;
	trackGenericEvent(key, value);
}

function trackEvent_FinishTutorial()
{
	var key = "finishTutorial";
	var value = 1;
	trackGenericEvent(key, value);
}

function trackEvent_CraftUpgrade(upgradeId)
{
	return; //disable this
	var key = "craftedUpgrade";
	var value = upgradeId;
	trackGenericEvent(key, value);
}

function trackEvent_FoundChest(isGold)
{
	return; //disable this
	if(isGold)
	{
		var key = "foundGoldChest";
		trackGenericEvent(key, 1);
	}
}

function trackEvent_FinishBossBattle(wasFightWon)
{
	var key = "finishBossBattle";
	var value = wasFightWon;
	trackGenericEvent(key, value, {"depth": depth});
}

function trackEvent_FinishExcavation(wasExcavationSuccessful)
{
	return; //disable this
	var key = "finishExcavation";
	var value = wasExcavationSuccessful;
	//trackGenericEvent(key, value);
}

function trackEvent_PurchasedTickets(ticketQuantity, cents=0)
{
	var key = "purchasedTickets";
	var value = ticketQuantity;
	trackGenericEvent(key, value, {"depth": depth, "cents": cents});
}

function trackEvent_HireMiner(newMinerCount)
{
	var key = "hireMiner";
	var value = newMinerCount;
	trackGenericEvent(key, value);
}

function trackEvent_UpgradeMiners(level)
{
	var key = "upgradeMiners";
	var value = level;
	trackGenericEvent(key, value);
}

function trackEvent_PurchaseBlueprint(blueprintId)
{
	var key = "purchaseBlueprint";
	var value = blueprintId;
	trackGenericEvent(key, value);
}

function trackEvent_SpentTickets(amountSpent, spendType)
{
	var key = "spentTickets";
	var value = amountSpent;
	trackGenericEvent(key, value, {"spendType": spendType});
}

function trackEvent_CompletedCave(caveDepth)
{
	return; //disable this
	var key = "completedCaveAtDepth";
	var value = caveDepth;
	trackGenericEvent(key, value);
}

function trackEvent_LoadedGame()
{
	var key = "loadedGameNumLaunches";
	var value = numGameLaunches;
	trackGenericEvent(key, value);
}

function trackeEvent_exitedGame()
{
	var key = "exitedGameSessionDuration";
	var value = performance.now() / 60000;
	trackGenericEvent(key, value, {"activePlayTime": activePlayTimeMinutesInSession});

	if(isFirstSession)
	{
		trackGenericEvent("exitedFirstGameSessionDuration", value, {"activePlayTime": activePlayTimeMinutesInSession});
	}
}

function trackeEvent_redeemCode()
{
	var key = "redeemCode";
	var value = depth;
	if(redeemedCodes.length > 0)
	{
		trackGenericEvent(key, value, {"code": redeemedCodes[redeemedCodes.length-1]});
	}
}

function trackeEvent_upgradeDrill(drillPartLevel)
{
	var key = "upgradeDrill";
	var value = drillPartLevel;
	trackGenericEvent(key, value);
}

function trackeEvent_completedQuest(questId)
{
	return; //disable this
	var key = "completedQuest";
	var value = questId;
	console.log(typeof value);
	trackGenericEvent(key, value);
}

//#################  ATTRIBUTION TRACKING  #################
function logInstall()
{
	var url = "https://playsaurusstats.com/p.png?cmd=gameInstall&gameUid="+UID+"&gameName=MrMine_"+platformName();

	var xhr = new XMLHttpRequest();
	xhr.open("GET", url, true);
	xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
	xhr.onreadystatechange = function ()
	{
		if(xhr.readyState == 4)
		{
			if(typeof (xhr.responseText) !== "undefined")
			{
				//console.log(xhr.responseText);
			}
		}
	}
	xhr.send();
}

function logRevenue(cents)
{
	var url = "https://playsaurusstats.com/p.png?cmd=gameRevenue&gameUid="+UID+"&revenueCents="+cents;

	var xhr = new XMLHttpRequest();
	xhr.open("GET", url, true);
	xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
	xhr.onreadystatechange = function ()
	{
		if(xhr.readyState == 4)
		{
			if(typeof (xhr.responseText) !== "undefined")
			{
				//console.log(xhr.responseText);
			}
		}
	}
	xhr.send();
}