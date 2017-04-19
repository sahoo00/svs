function GetXmlHttpObject()
{
  var xmlHttp=null;
  try
  {
    // Firefox, Opera 8.0+, Safari
    xmlHttp=new XMLHttpRequest();
  }
  catch (e)
  {
    // Internet Explorer
    try
    {
      xmlHttp=new ActiveXObject("Msxml2.XMLHTTP");
    }
    catch (e)
    {
      xmlHttp=new ActiveXObject("Microsoft.XMLHTTP");
    }
  }
  return xmlHttp;
}

//Our XmlHttpRequest object to get the auto suggest
var xmlHttp = GetXmlHttpObject();

function getDatasetID(name) {
  return document.getElementById(name).value;
} 

var mousex = 0;
var mousey = 0;
var grabx = 0;
var graby = 0;
var orix = 0;
var oriy = 0;
var algor = 0;

var rectobj = null;
var imgobj = null;

var recttop = 0;
var rectleft = 0;
var rectwidth = 0;
var rectheight = 0;

function falsefunc() { return false; } // used to block cascading events

function init()
{
  document.onmousemove = update; // update(event) implied on NS, update(null) implied on IE
  update();
}

function getMouseXY(e) // works on IE6,FF,Moz,Opera7
{ 
  if (!e) e = window.event; // works on IE, but not NS (we rely on NS passing us the event)

  if (e)
  { 
    if (e.pageX || e.pageY)
    { // this doesn't work on IE6!! (works on FF,Moz,Opera7)
      mousex = e.pageX;
      mousey = e.pageY;
      algor = '[e.pageX]';
      if (e.clientX || e.clientY) {
        algor += ' [e.clientX] ';
      }
    }
    else if (e.clientX || e.clientY)
    { // works on IE6,FF,Moz,Opera7
      mousex = e.clientX + document.body.scrollLeft - 2;
      mousey = e.clientY + document.body.scrollTop - 2;
      //mousex = e.x + document.body.scrollLeft;
      //mousey = e.y + document.body.scrollTop;
      algor = '[e.clientX]';
      if (e.pageX || e.pageY) algor += ' [e.pageX] ';
    }  
  }
}

// http://www.howtocreate.co.uk/tutorials/javascript/browserspecific
// http://blog.firetree.net/2005/07/04/javascript-find-position/
function findPositionWithScrolling(element) {
  var left = 0;
  var top = 0;
  if (element != null) {
    // Try because sometimes errors on offsetParent after DOM changes.
    try {
      while (element.offsetParent) {
        // While we haven't got the top element in the DOM hierarchy
        // Add the offsetLeft
        left += element.offsetLeft;
        // If my parent scrolls, then subtract the left scroll position
        if (element.offsetParent.scrollLeft) {
          left -= element.offsetParent.scrollLeft; 
        }
        // Add the offsetTop
        top += element.offsetTop;
        // If my parent scrolls, then subtract the top scroll position
        if (element.offsetParent.scrollTop) { 
          top -= element.offsetParent.scrollTop;
        }
        // Grab
        element = element.offsetParent;
      }
    }
    catch (e) {
      // Do nothing
    }

    // Add the top element left offset and the windows left scroll and subtract
    // the body's client left position.
    left += element.offsetLeft + document.body.scrollLeft - document.body.clientLeft;

    // Add the top element topoffset and the windows topscroll and subtract the
    // body's client top position.
    top += element.offsetTop + document.body.scrollTop - document.body.clientTop;
  }
  return [left, top];
}

function getScroll(element) {
  var left = 0;
  var top = 0;
  if (element != null) {
    // Try because sometimes errors on offsetParent after DOM changes.
    try {
      while (element.offsetParent) {
        // If my parent scrolls, then subtract the left scroll position
        if (element.offsetParent.scrollLeft) {
          left -= element.offsetParent.scrollLeft; 
        }
        // If my parent scrolls, then subtract the top scroll position
        if (element.offsetParent.scrollTop) { 
          top -= element.offsetParent.scrollTop;
        }
        // Grab
        element = element.offsetParent;
      }
    }
    catch (e) {
      // Do nothing
    }

    // Add the top element left offset and the windows left scroll and subtract
    // the body's client left position.
    left += document.body.scrollLeft - document.body.clientLeft;

    // Add the top element topoffset and the windows topscroll and subtract the
    // body's client top position.
    top += document.body.scrollTop - document.body.clientTop;
  }
  return [left, top];
}

// http://blog.firetree.net/2005/07/04/javascript-find-position/
// by Peter-Paul Koch & Alex Tingl
function findPosX(obj)
{
  var curleft = 0;
  if(obj.offsetParent)
    while(1) 
    {
      curleft += obj.offsetLeft;
      if(!obj.offsetParent)
        break;
      obj = obj.offsetParent;
    }
  else if(obj.x)
    curleft += obj.x;
  return curleft;
}

function findPosY(obj)
{
  var curtop = 0;
  if(obj.offsetParent)
    while(1)
    {
      curtop += obj.offsetTop;
      if(!obj.offsetParent)
        break;
      obj = obj.offsetParent;
    }
  else if(obj.y)
    curtop += obj.y;
  return curtop;
}

function update(e)
{
  getMouseXY(e); // NS is passing (event), while IE is passing (null)
  updateDebug(orix + ':' + oriy + ' -- ' + mousex + ':' + mousey);
}

function rect_begin() {
  document.onmousedown = falsefunc;
  if (!rectobj) {
    rectobj = document.getElementById('rect');
  }
  if (!imgobj) {
    imgobj = document.getElementById('img0');
  }
  var ori = getScroll(imgobj);
  rectobj.style.width = 0 + "px";
  rectobj.style.height = 0 + "px";
  rectobj.style.left = (mousex-ori[0]) + "px";
  rectobj.style.top = (mousey-ori[1]) + "px";
  rectobj.style.zIndex = 10;
  rectobj.style.visibility="visible";
  grabx = mousex;
  graby = mousey;
  rectleft = mousex;
  recttop = mousey;
  rectwidth = 0;
  rectheight = 0;
  document.onmousemove = rect_resize;
  document.onmouseup = rect_finish;
  update();
}

function rect_resize(e) { // parameter passing is important
  if (!rectobj) {
    rectobj = document.getElementById('rect');
  }
  if (!imgobj) {
    imgobj = document.getElementById('img0');
  }
  var ori = getScroll(imgobj);
  if (mousex > grabx) {
    rectobj.style.width = (mousex - grabx) + "px";
    rectwidth = (mousex - grabx);
  }
  else {
    rectobj.style.left = (mousex-ori[0]) + "px";
    rectobj.style.width = (grabx - mousex) + "px";
    rectleft = mousex;
    rectwidth = (mousex - grabx);
  }
  if (mousey > graby) {
    rectobj.style.height = (mousey - graby) + "px";
    rectheight = (mousey - graby);
  }
  else {
    rectobj.style.top = (mousey-ori[1]) + "px";
    rectobj.style.height = (graby - mousey) + "px";
    recttop = mousey;
    rectheight = (mousey - graby);
  }
  update(e);
  return false;
}

function rect_finish() {
  if (rectobj)
  {
    if (xmlHttp.readyState == 4 || xmlHttp.readyState == 0) {
      var img = document.getElementById('img0');
      var ori = findPositionWithScrolling(img);
      //orix = findPosX(img);
      //oriy = findPosY(img);
      orix = ori[0];
      oriy = ori[1];

      var ox = orix;
      var oy = oriy;
      if (rectwidth < 0) {
        rectwidth = - rectwidth;
      }
      if (rectheight < 0) {
        rectheight = - rectheight;
      }
      var keys = getKeys();
      var t = recttop - oy;
      var l = rectleft - ox;
      var x = Math.floor(keys['x'] + keys['width'] * l / keys['sw']);
      var y = Math.floor(keys['y'] + keys['height'] * t / keys['sh']);
      var w = Math.floor(keys['width'] * rectwidth / keys['sw']);
      var h = Math.floor(keys['height'] * rectheight / keys['sh']);
      var url = keys['?'] + "?dataset=" + keys['dataset'] +
        "&aid=" + keys['aid'] + "&cmd=zoom";
      url = url + "&x=" + x;
      url = url + "&y=" + y;
      url = url + "&width=" + w;
      url = url + "&height=" + h;
      url = url + "&sw=" + keys['sw'];
      url = url + "&sh=" + keys['sh'];
      document.getElementById('debug').value = rectleft + " " + rectwidth;
      document.getElementById('img0').src = url;
      document.getElementById('img1link').href = url;
      document.getElementById('img1link').style.visibility = 'visible';
    }
    rectobj.style.zIndex = 0;
    rectobj.style.visibility="hidden";
    rectobj.style.width = 0 + "px";
    rectobj.style.height = 0 + "px";
    rectwidth = 0;
    rectheight = 0;
    rectobj = null;
  }
  update();
  document.onmousemove = update;
  document.onmouseup = null;
  document.onmousedown = null;   // re-enables text selection on NS
}

function updateImgUrl() {
  if (xmlHttp != null && xmlHttp.readyState==4) { 
    var url = xmlHttp.responseText;
    document.getElementById('img0').src = url;
    document.getElementById('img1link').href = url;
    document.getElementById('img1link').style.visibility = 'visible';
  }
}

function updateDebug(str) {
  document.getElementById('debug1').value = str;
}

function getKeys(str) {
  var imgurl= document.getElementById('img0link').href;
  var zoomurl= document.getElementById('img1link').href;
  if (zoomurl.indexOf("?") == -1) {
    zoomurl = imgurl;
  }
  zoomurl = str || zoomurl;
  var pr = zoomurl.split("?");
  var vars = pr[1].split("&");
  var keys = new Array();
  keys['?'] = pr[0];
  for (var i=0;i<vars.length;i++) {
    var pair = vars[i].split("=");
    keys[pair[0]] = pair[1];
    if (pair[0] != "dataset" && pair[0] != "aid" && pair[0] != "cmd") {
      keys[pair[0]] = parseInt(pair[1]);
    }
  }
  return keys;
}

function zoomIn() {
  var keys = getKeys();
  var scale = 0.3;
  var x = Math.floor(keys['x'] + keys['width'] * scale/2);
  var y = Math.floor(keys['y'] + keys['height'] * scale/2);
  var w = Math.floor(keys['width'] * (1 - scale));
  var h = Math.floor(keys['height'] * (1 - scale));
  var url = keys['?'] + "?dataset=" + keys['dataset'] +
    "&aid=" + keys['aid'] + "&cmd=zoom";
  url = url + "&x=" + x;
  url = url + "&y=" + y;
  url = url + "&width=" + w;
  url = url + "&height=" + h;
  url = url + "&sw=" + keys['sw'];
  url = url + "&sh=" + keys['sh'];
  document.getElementById('debug').value = x + "," + y + " " + w + "x" + h;
  try {
    url = url.replace("cmd=zoom", "cmd=zoomUrl");
    xmlHttp.open("GET",url,true);
    xmlHttp.onreadystatechange=updateImgUrl;
    xmlHttp.send(null);
  } catch(e) {
    alert("URL Problem" + e);
  }
}

function zoomOut() {
  var keys = getKeys();
  var scale = 0.3;
  var x = Math.floor(keys['x'] - keys['width'] * scale/2);
  var y = Math.floor(keys['y'] - keys['height'] * scale/2);
  var w = Math.floor(keys['width'] * (1 + scale));
  var h = Math.floor(keys['height'] * (1 + scale));
  var url = keys['?'] + "?dataset=" + keys['dataset'] +
    "&aid=" + keys['aid'] + "&cmd=zoom";
  url = url + "&x=" + x;
  url = url + "&y=" + y;
  url = url + "&width=" + w;
  url = url + "&height=" + h;
  url = url + "&sw=" + keys['sw'];
  url = url + "&sh=" + keys['sh'];
  document.getElementById('debug').value = x + "," + y + " " + w + "x" + h;
  try {
    url = url.replace("cmd=zoom", "cmd=zoomUrl");
    xmlHttp.open("GET",url,true);
    xmlHttp.onreadystatechange=updateImgUrl;
    xmlHttp.send(null);
  } catch(e) {
    alert("URL Problem" + e);
  }
}

function zoomHome() {
  var imgurl= document.getElementById('img0link').href;
  var keys = getKeys(imgurl);
  var scale = 0;
  var x = Math.floor(keys['x'] - keys['width'] * scale/2);
  var y = Math.floor(keys['y'] - keys['height'] * scale/2);
  var w = Math.floor(keys['width'] * (1 + scale));
  var h = Math.floor(keys['height'] * (1 + scale));
  var url = keys['?'] + "?dataset=" + keys['dataset'] +
    "&aid=" + keys['aid'] + "&cmd=zoom";
  url = url + "&x=" + x;
  url = url + "&y=" + y;
  url = url + "&width=" + w;
  url = url + "&height=" + h;
  url = url + "&sw=" + keys['sw'];
  url = url + "&sh=" + keys['sh'];
  document.getElementById('debug').value = x + "," + y + " " + w + "x" + h;
  try {
    url = url.replace("cmd=zoom", "cmd=zoomUrl");
    xmlHttp.open("GET",url,true);
    xmlHttp.onreadystatechange=updateImgUrl;
    xmlHttp.send(null);
  } catch(e) {
    alert("URL Problem" + e);
  }
}

