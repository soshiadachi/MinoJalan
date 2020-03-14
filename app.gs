function doGet(e) { 
  var html = HtmlService.createTemplateFromFile("index");
  html.tweets="";
  return html.evaluate().setTitle("みのじゃらん"); 
}


function fetch(argSize,argWord,argPage,argOrder){
  var fetchResult = "";
  var data = sort(argOrder,SpreadsheetApp.getActiveSpreadsheet().getActiveSheet().getDataRange());
  
  var page = (undefined === argPage || isNaN(argPage))? 1 : (argPage <= 0) ? 1:Number(argPage);
  var size = (10 == argSize || 20 == argSize || 50 == argSize)? Number(argSize): 20;
  var min = ((page-1)*size > data.length || page <= 0)? 0 : (page-1)*size;
  
  if(null !== argWord && "" !== argWord && undefined !== argWord) {
    var word = argWord;
    var reg = new RegExp('.*' + argWord + '.*',"i");
    var count = 0
    for (var i = 0; i < data.length; i++) {
      if(data[i][2].match(reg) || data[i][5].match(reg)){
        count++;
        if ((count > min) && (count <= size + min)){
        　　fetchResult += createBlockquote(data[i][2],data[i][3],data[i][1])
        }
        if (count > size + min + 1){
          break;
        }
      }
    }
    Logger.log("size = " + size + ",min = " + min + ",count =" + count + ",i = "+i+",length = "+data.length);
    if(count <= size + min || count >= data.length){
      fetchResult += "<input type=\"hidden\" id=\"last\">";
    }
  } else {
    
    var max = (size+min > data.length)? data.length:size+min;
    for (var i = min; i < max; i++) {
      fetchResult += createBlockquote(data[i][2],data[i][3],data[i][1])
    }
    if(max >= data.length){
      fetchResult += "<input type=\"hidden\" id=\"last\">";
    }
    Logger.log("size = " + size + ",min = " + min + ",max = "+max+",length = "+data.length);
  }
  if(page == 1){
    fetchResult += "<input type=\"hidden\" id=\"first\">";
  }
  
  return fetchResult; 
}

function sort(argOrder,range){
  switch (argOrder) {
      case "orderdayrev":
        return range.sort({column: 1, ascending: false}).getValues();
        break
      case "orderuser":
        return range.sort({column: 5, ascending: true}).getValues();
        break
      case "orderuserrev":
        return range.sort({column: 5, ascending: false}).getValues();
        break
      default:
        return range.sort({column: 1, ascending: true}).getValues();
        break
  }
}

function createBlockquote(text,link,tweetDate){
  return "<div class=\"col-lg-4 col-md-6\" >"
  + "  <blockquote class=\"twitter-tweet\" data-conversation=\"none\">"
       + "    <p lang=\"ja\" dir=\"ltr\">"+ text + "</p>"
       + "    <a href=\"" + link + "\">" + tweetDate + "</a>"
       + "  </blockquote>"
       + "</div>"
}
