var tumblrss = {
  onLoad: function() {
    // initialization code
    this.initialized = true;
  },

  onMenuItemCommand: function() {
      window.fullScreen = true;

      currentIndex = 0;
      linkArray = new Array();
      var siteName = extractTumblrSiteName(gBrowser.currentURI.spec);
      if(siteName == null) {
	  return;
      }
      var queryString = constructTumblrAPIQuery(siteName, 0, 50);
      var tumblrResponse = callTumblrAPI(queryString);
      parseTumblrResponse(tumblrResponse);
      var slideShowDiv = createSlideShowDiv();
      slideShowCanvas = createSlideShowImageTag(slideShowDiv);
      runGallery();
  } 
};

function extractTumblrSiteName(uri) {
    var pattr = /http:\/\/(\S*).tumblr.com/;
    var res = pattr.exec(uri);
    if(res && res.length > 1) {
	return res[1];
    }
    alert("Not a tumblr page, it seems...");
    return null;
}

var currentIndex = 0;
var isRunning = 0;
var slideShowCanvas;
var linkArray = new Array();
var mythread;
var siteName;

function constructTumblrAPIQuery(siteName, startIndex, num) {
    return "http://" + siteName + ".tumblr.com/api/read?type=photo&start=" + startIndex + "&num=" + num; 
}

function callTumblrAPI(queryString) {
    var req = new XMLHttpRequest();
    req.open('GET', queryString, false);
    req.send(null);
    if(req.status == 200) {
	return req.responseXML;
    }
    else {
	alert("req failed with status code: " + req.status);
	return null;
    }
}

function parseTumblrResponse(tumblrResponse) {
    var screenWidth = window.screen.width;
    var postArray = tumblrResponse.getElementsByTagName("post");

    for(var i = 0; i < postArray.length; i++) {
	var photo_urls = postArray[i].getElementsByTagName("photo-url");
	if(photo_urls) {
	    linkArray.push(photo_urls[0].childNodes[0].nodeValue);
	}
	else {
	    alert("photo_urls null");
	}
    }
}

function createSlideShowDiv() {
    var newdiv = gBrowser.contentDocument.createElement('div');
    newdiv.setAttribute('id', 'myslideshow');
    newdiv.style.position = 'fixed'; // absolute
    newdiv.style.top = gBrowser.contentDocument.documentElement.scrollTop + "px";
    newdiv.style.left = 0;
    newdiv.style.width = '100%';
    newdiv.style.height = '100%';
    newdiv.style.background = 'black';
    newdiv.style.opacity = 0.99;
    newdiv.style.zIndex = 100;

    gBrowser.contentDocument.body.appendChild(newdiv);

    window.onkeypress = handleKeyPress;
   
    return newdiv;
}

function createSlideShowImageTag(imagediv) {

    var newtable = gBrowser.contentDocument.createElement('table');
    newtable.setAttribute('id', 'mytable');
    newtable.setAttribute('width', '100%');
    
    var newtr = gBrowser.contentDocument.createElement('tr');
    newtr.setAttribute('id', 'myrow');
    newtr.setAttribute('align', 'center');
    
    var newtd = gBrowser.contentDocument.createElement('td');
    newtd.setAttribute('id', 'mytd');
    
    var newcanvas = gBrowser.contentDocument.createElement('canvas');
    newcanvas.setAttribute('id', 'mycanvas');
    newcanvas.width = window.screen.width;
    newcanvas.height = window.screen.height;
    imagediv.appendChild(newtable);
    newtable.appendChild(newtr);
    newtr.appendChild(newtd);
    newtd.appendChild(newcanvas);

    return newcanvas;
}

function updateImageUrl(mycanvas, imgIndex) {

    var img = new Image();
    img.onload = function(){
	var ratio = 1;
	if(img.height > window.screen.height) {
	    ratio = (window.screen.height) * 0.9 / img.height;
	} 
	var imgwidth = img.width * ratio;
	var imgheight = img.height * ratio;
	var xmargin = (mycanvas.width - imgwidth) / 2;
	var ymargin = (mycanvas.height - imgheight) / 2;
	
	mycanvas.getContext('2d').clearRect(0, 0, mycanvas.width, mycanvas.height);
	mycanvas.getContext('2d').drawImage(img, xmargin, ymargin, imgwidth, imgheight);
	mythread = setTimeout("runGallery()", 5000);
    };
    img.src = linkArray[imgIndex];
    
}

function runGallery() {
    isRunning = 1;
    if(currentIndex == linkArray.length) {
	parseTumblrResponse(
	    callTumblrAPI(
		constructTumblrAPIQuery(
		    extractTumblrSiteName(gBrowser.currentURI.spec), linkArray.length, 50)));
    }
    updateImageUrl(slideShowCanvas, currentIndex);
    currentIndex = currentIndex + 1;
    //if(currentIndex > linkArray.length) currentIndex = 0;
}

function stopGallery() {
    isRunning = 0;
    clearTimeout(mythread);
    linkArray = null;
}

function pauseResumeGallery() {
    if(isRunning) {
	// pause
	isRunning = 0;
	clearTimeout(mythread);
    }
    else {
	// resume
	mythread = runGallery(currentIndex);
    }

}
function handleKeyPress(ev) { 

    ev = ev || event;
    if(isRunning && ev.keyCode == 27)
    {
	gBrowser.contentDocument.body.removeChild(gBrowser.contentDocument.getElementById('myslideshow'));
	stopGallery();
    }
    if(ev.keyCode == 13)
    {
	pauseResumeGallery();
    }
}

window.addEventListener("load", function(e) { tumblrss.onLoad(e); }, false); 
