function myFunction() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  SpreadsheetApp.setActiveSheet(ss.getSheets()[0]);
    
  var as = SpreadsheetApp.getActiveSheet();
  var service = getTwitterService();
  if (service.hasAccess()) {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var maxTweetId = getMaxTweetId(sheet);
    var searchResult = search(service,maxTweetId);
    save(sheet,searchResult)
  } else {
    var authorizationUrl = service.authorize();
    Logger.log('Open the following URL and re-run the script: %s', authorizationUrl);
  }
  
}

/**
 * Reset the authorization state, so that it can be re-tested.
 */
function reset() {
  var service = getTwitterService();
  service.reset();
}

// Twtter OAuth1
function getTwitterService() {
  return OAuth1.createService('Twitter')
      .setAccessTokenUrl('https://api.twitter.com/oauth/access_token')
      .setRequestTokenUrl('https://api.twitter.com/oauth/request_token')
      .setAuthorizationUrl('https://api.twitter.com/oauth/authenticate')
      .setConsumerKey(PropertiesService.getScriptProperties().getProperty("TWITTER_CONSUMER_KEY"))
      .setConsumerSecret(PropertiesService.getScriptProperties().getProperty("TWITTER_CONSUMER_SECRET"))
      .setCallbackFunction('authCallback')
      .setPropertyStore(PropertiesService.getUserProperties());
}

/**
 * Handles the OAuth callback.
 */
function authCallback(request) {
  var service = getTwitterService();
  var authorized = service.handleCallback(request);
  if (authorized) {
    Logger.log("success");
  } else {
    Logger.log("failed");
  }
}

/**
 * Twitterでキーワード検索したツイートをパースする。
 */
function search(service,maxId) {

  try{
    var user_id = '@@minowanowa exclude:retweets'
    var query = encodeURIComponent(user_id);

    var API_URL = "https://api.twitter.com/1.1/search/tweets.json?";
    var url = API_URL + "count=100&since_id=" + maxId + "&q=" + query;
    var response = service.fetch(url);
      
    if (!response) {
      Logger.log("no response");
      return;
    }
      
    var jsonString = response.getContentText();
    var json       = Utilities.jsonParse(jsonString);    
    var tweets     = json.statuses;
        
    if (tweets.length === 0) {
      Logger.log("no tweets");
      throw new Exception();
    }
    return tweets;
  } catch (e) {
    Logger.log(e);
    throw e;
  }
}

function getWriteStartLow(cell,lastRow,firstTweetId){
  var row = 0;
  for (var i = 0; i < lastRow; i++) {
    var id = cell.offset(i, 0).getValue();
    Logger.log(id + ":" + firstTweetId);
    
    if(firstTweetId == id || !id) {
      break;
    }
    row++;
  }
  return row;
}

function save(activeSheet,tweets){
  var sourceTweetId = PropertiesService.getScriptProperties().getProperty("SOURCE_TWEET_ID");
  var firstId = tweets[tweets.length - 1].id_str;
  var cell = activeSheet.getRange("A1");    
  var lastRow = activeSheet.getLastRow();
  var startRow = getWriteStartLow(cell,lastRow,firstId);
  
  var row = startRow;
  var maxTweetId = 0;
  for (var i = tweets.length - 1; i >= 0; i--) {
    var result = tweets[i];
    if (result['in_reply_to_status_id_str'] == sourceTweetId){
      if(!isDuplicate(activeSheet,result.id_str)){
        var col = 0;
        var dd = new Date(result.created_at);
        cell.offset(row, col++).setValue(result.id_str);
        cell.offset(row, col++).setValue(dd);
        cell.offset(row, col++).setValue(result.text);
        cell.offset(row, col++).setValue('https://twitter.com/' + result.user.screen_name + "/status/" + result.id_str);
        cell.offset(row, col++).setValue('https://twitter.com/' + result.user.screen_name);
        if (result.entities.urls.length > 0) {
          cell.offset(row, col++).setValue(result.entities.urls[0].expanded_url);
        }
        row++;
      }
    }
  }
}

function getMaxTweetId(sheet){
  var allData = sheet.getDataRange().getValues();
  try{
    var maxTweetId = allData[1][0];
    for(var i=1;i<allData.length;i++){
      if(allData[i][0] > maxTweetId){
        maxTweetId = allData[i][0];
      }
    }
    return maxTweetId;
  }catch(e){
    return "0";
  }
}

function isDuplicate(sheet,tweetId){
  var allData = sheet.getDataRange().getValues();
 
  for(var i=0;i<allData.length;i++){
    if(allData[i][0] === tweetId){
      return true;
    }
  }
  return false;
}
