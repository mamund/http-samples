// ajax services
// from ajax-patterns book/site

// $Date: 2008-11-06 21:28:43 -0500 (Thu, 06 Nov 2008) $
// $Rev: 121 $
// $Author: mca@amundsen.com $

// 2007-04-05 (mca) : changed root to 'ajax'
// 2007-04-06 (mca) : added try-catch for http.open
//                  : added status and statusText for return
//                  : changed public methods to http[method]
//                  : added support for sending request header array
// 2007-04-16 (mca) : added support for onTimeout, timeoutMessage, maxTimeout
// 2008-01-21 (mca) : updated _createHeaderMap to return headers as lowercase
// 2008-10-01 (mca) : added support for collecting form values (getFields, getValue)
//                  : added onComplete, showErrors, showStatus
//                  : added support for context = function (_checkType)
//                  : added new functions httpPostForm,httpPutForm,httpDeleteForm,quickPost,quickPut,quickDelete

var ajax = {

  shouldDebug: false,
  shouldEscapeVars: false,
  shouldMakeHeaderMap: true,

  showErrors: true,
  showStatus: true,

  maxTimeout: 5000,
  timeoutMessage: 'Unable to complete request - server timed out.',
  onTimeout: null,
  _reqTimer : null,

  calls : [],
  pendingResponseCount : 0,

  /**************************************************************************
    PUBLIC METHODS
  *************************************************************************/

  // http get methods
  httpGet: function(url, urlVars, callbackFunction, expectingXML, callingContext, reqHdrs)
  {
    url = url || null;
    urlVars = urlVars || null;
    callbackFunction = callbackFunction || null;
    expectingXML = expectingXML || null;
    callingContext = callingContext || null;
    reqHdrs = reqHdrs || null;

    return this._callServer(url, urlVars, callbackFunction, expectingXML,callingContext, "GET", null, null, null, reqHdrs);
  },

  httpGetXML: function(url, callbackFunction, reqHdrs)
  {
    url = url || null;
    callbackFunction = callbackFunction || null;
    reqHdrs = reqHdrs || null;

    this.httpGet(url, null, callbackFunction, true, null, reqHdrs);
  },

  httpGetPlainText: function(url, callbackFunction, reqHdrs)
  {
    url = url || null;
    callbackFunction = callbackFunction || null;
    reqHdrs = reqHdrs || null;

    this.httpGet(url, null, callbackFunction, false, null, reqHdrs);
  },

  // http post methods
  httpPost: function(url, urlVars, callbackFunction, expectingXML,callingContext, bodyType, body, reqHdrs)
  {
    url = url || null;
    urlVars = urlVars || null;
    callbackFunction = callbackFunction || null;
    expectingXML = expectingXML || null;
    callingContext = callingContext || null;
    bodyType = bodyType || null;
    body = body || null;
    reqHdrs = reqHdrs || null;

    this._callServer(url, urlVars, callbackFunction, expectingXML,callingContext, "POST", null, bodyType, body, reqHdrs);
  },

  httpPostForPlainText: function(url, urlVars, callbackFunction, reqHdrs)
  {
    url = url || null;
    urlVars = urlVars || null;
    callbackFunction = callbackFunction || null;
    reqHdrs = reqHdrs || null;

    this.httpPostVars(url, urlVars, null, callbackFunction, false, null, "POST", null, null, reqHdrs);
  },

  httpPostForXML: function(url, urlVars, callbackFunction, reqHdrs)
  {
    url = url || null;
    urlVars = urlVars || null;
    callbackFunction = callbackFunction || null;
    reqHdrs = reqHdrs || null;
    this.httpPostVars(url, urlVars, null, callbackFunction, true, null, "POST", null, null, reqHdrs);
  },

  httpPostVars:function(url, bodyVars, urlVars, callbackFunction, expectingXML,callingContext, reqHdrs)
  {
    url = url || null;
    urlVars = urlVars || null;
    callbackFunction = callbackFunction || null;
    expectingXML = expectingXML || null;
    callingContext = callingContext || null;
    reqHdrs = reqHdrs || null;

    this._callServer(url, urlVars, callbackFunction, expectingXML,callingContext, "POST", bodyVars, null, null, reqHdrs);
  },

  httpPostMultiPart:function(url, bodyVars, urlVars, callbackFunction, expectingXML, callingContext, reqHdrs)
  {
    url = url || null;
    urlVars = urlVars || null;
    callbackFunction = callbackFunction || null;
    expectingXML = expectingXML || null;
    callingContext = callingContext || null;
    reqHdrs = reqHdrs || null;

    this._callServer(url, urlVars, callbackFunction, expectingXML, callingContext, "POST", bodyVars, 'multipart/form-data', null, reqHdrs);
  },

  // other http methods
  httpHead: function(url, urlVars, callbackFunction, expectingXML, callingContext, reqHdrs)
  {
    url = url || null;
    urlVars = urlVars || null;
    callbackFunction = callbackFunction || null;
    expectingXML = expectingXML || null;
    callingContext = callingContext || null;
    reqHdrs = reqHdrs || null;

    this._callServer(url, urlVars, callbackFunction, expectingXML, callingContext, "HEAD", null, null, null, reqHdrs);
  },

  httpPut: function(url, urlVars, callbackFunction, expectingXML, callingContext, bodyType, body, reqHdrs)
  {
    url = url || null;
    urlVars = urlVars || null;
    callbackFunction = callbackFunction || null;
    expectingXML = expectingXML || null;
    callingContext = callingContext || null;
    bodyType = bodyType || null;
    body = body || null;
    reqHdrs = reqHdrs || null;

    this._callServer(url, urlVars, callbackFunction, expectingXML, callingContext, "PUT", null, bodyType, body, reqHdrs);
  },

  httpDelete: function(url, urlVars, callbackFunction, expectingXML, callingContext, reqHdrs)
  {
    url = url || null;
    urlVars = urlVars || null;
    callbackFunction = callbackFunction || null;
    expectingXML = expectingXML || null;
    callingContext = callingContext || null;
    reqHdrs = reqHdrs || null;

    this._callServer(url, urlVars, callbackFunction, expectingXML, callingContext, "DELETE", null, null, null, reqHdrs);
  },

  httpOptions: function(url, urlVars, callbackFunction, expectingXML, callingContext, bodyType, body, reqHdrs)
  {
    url = url || null;
    urlVars = urlVars || null;
    callbackFunction = callbackFunction || null;
    expectingXML = expectingXML || null;
    callingContext = callingContext || null;
    bodyType = bodyType || null;
    body = body || null;
    reqHdrs = reqHdrs || null;

    this._callServer(url, urlVars, callbackFunction, expectingXML, callingContext, "OPTIONS", null, bodyType, body, reqHdrs);
  },

  httpTrace: function(url, urlVars, callbackFunction, expectingXML, callingContext, bodyType, body, reqHdrs)
  {
    url = url || null;
    urlVars = urlVars || null;
    callbackFunction = callbackFunction || null;
    expectingXML = expectingXML || null;
    callingContext = callingContext || null;
    bodyType = bodyType || null;
    body = body || null;
    reqHdrs = reqHdrs || null;

    this._debug("trace");
    this._callServer(url, urlVars, callbackFunction, expectingXML,  callingContext, "TRACE", null, bodyType, body, reqHdrs);
  },

  // short-cut methods
  quickPut:function(formRef,url)
  {
    formRef = formRef || null;
    url = url || null;

    this.httpPutForm(url, null, null, false, null, null, formRef);

    return false;
  },

  httpPutForm:function(url, urlVars, callbackFunction, expectingXML, callingContext, bodyType, formRef, reqHdrs)
  {
    var bodyVars,f;

    url = url || null;
    urlVars = urlVars || null;
    callbackFunction = callbackFunction || null;
    expectingXML = expectingXML || null;
    callingContext = callingContext || null;
    bodyType = bodyType || null;
    formRef = formRef || null;
    reqHdrs = reqHdrs || null;

    bodyVars = this.getFields(formRef);
    if(url===null)
    {
      url = this._checkUrl(formRef);
    }

    this._callServer(url, urlVars, callbackFunction, expectingXML, callingContext, "PUT", bodyVars, bodyType, null, reqHdrs);
  },

  quickDelete:function(formRef,url)
  {
    formRef = formRef || null;
    url = url || null;

    this.httpDeleteForm(url, null, null, false, null, formRef);

    return false;
  },

  httpDeleteForm:function(url, urlVars, callbackFunction, expectingXML, callingContext, formRef, reqHdrs)
  {
    var bodyVars,f;

    url = url || null;
    urlVars = urlVars || null;
    callbackFunction = callbackFunction || null;
    expectingXML = expectingXML || null;
    callingContext = callingContext || null;
    //bodyType = bodyType || null;
    formRef = formRef || null;
    reqHdrs = reqHdrs || null;

    if(url===null)
    {
      url = this._checkUrl(formRef);
    }

    this._callServer(url, urlVars, callbackFunction, expectingXML, callingContext, "DELETE", null, null, null, reqHdrs);
  },

  quickPost:function(formRef,url)
  {
    url = url || null;
    this.httpPostForm(url, null, null, false, null, null, formRef);
    return false;
  },

  httpPostForm:function(url, urlVars, callbackFunction, expectingXML, callingContext, bodyType, formRef, reqHdrs)
  {
    var f,bodyVars;

    url = url || null;
    urlVars = urlVars || null;
    callbackFunction = callbackFunction || null;
    expectingXML = expectingXML || null;
    callingContext = callingContext || null;
    bodyType = bodyType || null;
    formRef = formRef || null;
    reqHdrs = reqHdrs || null;

    bodyVars = this.getFields(formRef);
    if(url===null)
    {
      url = this._checkUrl(formRef);
    }

    this._callServer(url, urlVars, callbackFunction, expectingXML, callingContext, "POST", bodyVars, bodyType, null, reqHdrs);
  },

  onComplete:function(response,headers,context,status,msg)
  {
    switch(status)
    {
      case 0:
        // ie abort code
        break;
      case 200:   // OK
      case 201:   // Created
      case 202:   // Accepted
      case 204:   // NoBody
        if(ajax.showStatus)
        {
          alert(status+'\n'+msg);
        }
        break;
      case 300:
      case 301:
      case 302:
      case 303:
        if(headers.location)
        {
          location.href=headers.location;
        }
        break;
      default:    // 400 & 500 errors
        if(headers.location)
        {
          location.href=headers.location;
        }
        else
        {
          if(ajax.showErrors)
          {
            alert(status+'\n'+msg);
          }
        }
        break;
    }

    if(ajax._checkType(context)=='function')
    {
      context.apply(context,[response,headers,context,status,msg]);
    }
  },

  supportsXMLHttpRequest : function()
  {
    var rtn = false;
    var obj = this._createXMLHttpRequest();
    if(obj!=null)
    {
      rtn = true;
    }
    return rtn;
  },
  
  /*************************************************************************
    PRIVATE METHODS
  *************************************************************************/

  _requestTimeOut: function()
    {
      if(ajax.onTimeout)
      {
        ajax.onTimeout();
      }
      else
      {
        alert('ERROR:\n'+ajax.timeoutMessage);
      }
      //xReq.abort(); // commented out to prevent IE wierdness
    },

  _callServer: function(url, urlVars, callbackFunction, expectingXML, callingContext, requestMethod, bodyVars, explicitBodyType, explicitBody, reqHdrs)
  {
    var dbg,call,xReq,urlVarsString;

    if (urlVars===null)
    {
      urlVars = [];
    }

    if(callbackFunction===null)
    {
      callbackFunction = this.onComplete;
    }

    dbg = '';
    dbg += "_callServer() called. About to request URL\n";
    dbg += "call key: [" + this.calls.length + "]\n";
    dbg += "url: [" + url + "]\n";
    dbg += "callback function: [" + callbackFunction + "]\n";
    dbg += "treat response as xml?: [" + expectingXML + "]\n";
    dbg += "Request method?: [" + requestMethod + "]\n";
    dbg += "calling context: [" + callingContext + "]\n";
    dbg += "explicit body type: [" + explicitBodyType + "]\n";
    dbg += "explicit body: [" + explicitBody + "]\n";
    dbg += "urlVars: [" + this._describe(urlVars) + "]\n";
    dbg += "bodyVars: [" + this._describe(bodyVars) + "]\n";
    dbg += "reqHdrs: [" + this._describe(reqHdrs) + "]";
    this._debug(dbg);

    xReq = this._createXMLHttpRequest();
    xReq.onreadystatechange = function() {ajax._onResponseStateChange(call);};

    call = {xReq: xReq, callbackFunction: callbackFunction, expectingXML: expectingXML, callingContext: callingContext, url: url};

    if (urlVars!==null)
    {
      urlVarsString = this._createHTTPVarSpec(urlVars);
      if (urlVarsString.length > 0)
      { // TODO check if appending with & instead
        url += "?" + urlVarsString;
      }
    }

    try
    {
      xReq.open(requestMethod, url, true);
    }
    catch(ex)
    {
      alert('ERROR:\nXMLHttpRequest.open failed for\n'+ url+' ['+requestMethod+']'+'\n'+ ex.message);
      return;
    }

    // 2007-04-16 (mca) : added to support timeout hook
    //ajax._reqTimer = setTimeout(ajax._requestTimeOut,ajax.maxTimeout);
    // 2007-04-16 (mca) : added to support timeout hook

    if(reqHdrs!==null)
    {
      this._appendHeaders(xReq,reqHdrs);
    }

    if (requestMethod=="GET" || requestMethod=="HEAD" || requestMethod=="DELETE")
    {
      this._debug("Body-less request to URL " + url);
      xReq.send(null);
      return call;  // return call object
    }

    if (requestMethod=="POST" || requestMethod=="PUT" || requestMethod=="OPTIONS" || requestMethod=="TRACE")
    {
      bodyType = null;
      body = null;

      if (explicitBodyType===null)
      { // It's a form
        bodyType = 'application/x-www-form-urlencoded; charset=UTF-8';
        body = this._createHTTPVarSpec(bodyVars);
      }
      else
      {
        bodyType = explicitBodyType;
        body = explicitBody;
      }

      this._debug("Content-Type: [" + bodyType + "]\nBody: [" + body + "].");
      xReq.setRequestHeader('Content-Type', bodyType);
      xReq.send(body);
      return call;  // return call object
    }
    this._debug("ERROR: Unknown Request Method: " + requestMethod);
  },

  // The callback of xmlHttpRequest is a dynamically-generated function which immediately calls this function.
  _onResponseStateChange: function(call)
  {
    var xReq,content;

    xReq = call.xReq;

    if (xReq.readyState < 4)
    { //Still waiting
      return;
    }

    clearTimeout(this._reqTimer);

    if (xReq.readyState == 4)
    { //Transmit to actual callback
      this._debug("Call " + this._describe(call) + " with context [" + call.callingContext+"]" + " to " + call.url + " has returned.");
      callbackFunction = call.callbackFunction;

      if (!callbackFunction)
      { // Maybe still loading, e.g. in another JS file
        setTimeout(function() {_onResponseStateChange(call);}, 100);
      }

      content = call.expectingXML ? xReq.responseXML : xReq.responseText;
      responseHeaders = xReq.getAllResponseHeaders();
      headersForCaller = this.shouldMakeHeaderMap ? this._createHeaderMap(responseHeaders) : responseHeaders;

      callbackFunction(content, headersForCaller, call.callingContext, xReq.status, xReq.statusText);
    }

    call = null; // Technically the responsibility of GC
    this.pendingResponseCount--;

  },

  // short-cut methods (2008-10-01)
  getFields:function(form)
  {
    var formElement,coll,i,vars,item,val;
    vars = {};

    try
    {
      formElement = document.getElementById(form);
      if(!formElement)
      {
        formElement = document.getElementsByName(form)[0];
      }
      coll = formElement.getElementsByTagName('*');
      for(i=0;i<coll.length;i++)
      {
        item = coll[i];
        if(item.getAttribute('name'))
        {
          val = this.getValue(item);
          if(vars[item.getAttribute('name')])
          {
            if(val!=='')
            {
              vars[item.getAttribute('name')] = vars[item.getAttribute('name')]+';'+val;
            }
          }
          else
          {
            vars[item.getAttribute('name')] = val;
          }
        }
      }
    }
    catch(ex)
    {
      alert('getFields Error:\n'+ex.message);
    }

    return vars;
  },

  getValue:function(inputElement)
  {
    var val,i;

    try
    {
      if((inputElement.type=='checkbox' || inputElement.type=='radio') && inputElement.checked===false)
      {
        val='';
      }
      else
      {
        if(inputElement.tagName.toLowerCase()=='select')
        {
          val = '';
          for(i=0;i<inputElement.options.length;i++)
          {
            if(inputElement.options[i].selected===true)
            {
              if(val!=='')
              {
                val += ';' + escape(inputElement.options[i].value);
              }
              else
              {
                val = escape(inputElement.options[i].value);
              }
            }
          }
        }
        else
        {
          val = escape(inputElement.value);
        }
      }
    }
    catch(ex)
    {
      alert('getValue Error:\n'+ex.message);
    }

    return val;
  },

  _checkUrl:function(formRef)
  {
    var f;
    f = document.getElementById(formRef);
    if(f===null)
    {
      f = document.getElementsByName(formRef)[0];
    }
    return f.action;
  },

  _checkType:function(value)
  {
    var s = typeof value;
    if (s === 'object')
    {
      if (value)
      {
        if (typeof value.length === 'number' && !(value.propertyIsEnumerable('length')) && typeof value.splice === 'function')
        {
          s = 'array';
        }
      }
      else
      {
        s = 'null';
      }
    }
    return s;
  },

  // Browser-agnostic factory function
  _createXMLHttpRequest: function()
  {
    if (window.XMLHttpRequest)
    {
      return new XMLHttpRequest();
    }
    else if (window.ActiveXObject)
    {
      return new ActiveXObject('Microsoft.XMLHTTP');
    }
    else
    {
      _error("Could not create XMLHttpRequest on this browser");
      return null;
    }
  },

  _createHTTPVarSpec: function(vars)
  {
    var varsString,value;

    varsString = "";
    for( key in vars )
    {
      value = vars[key];
      if (this.shouldEscapeVars)
      {
        escapePlusRE = new RegExp("\\\+");
        value = value.replace(escapePlusRE, "%2B");
      }
      varsString += '&' + key + '=' + value;
    }

    if (varsString.length > 0)
    {
      varsString = varsString.substring(1); // chomp initial '&'
    }
    this._debug("Built var String: " + varsString);
    return varsString;
   },

  /* Creates associative array from header type to header */
  _createHeaderMap: function(headersText)
  {
    extractedHeaders = headersText.split("\n");
    delete extractedHeaders[extractedHeaders.length]; // Del blank line at end
    headerMap = [];
    for (i=0; i<extractedHeaders.length-2; i++)
    {
      head = extractedHeaders[i];
      fieldNameEnding = head.indexOf(":");
      field = head.substring(0, fieldNameEnding);
      field = field.toLowerCase(); // 2008-01-21 (mca)
      value = head.substring(fieldNameEnding + 2, head.length);
      value = value.replace(/\s$/, "");
      headerMap[field] = value;
    }
    return headerMap;
  },

  _appendHeaders:function(xReq,rh)
  {
    for(key in rh)
    {
      xReq.setRequestHeader(key,rh[key]);
    }
    //return xReq;
  },

  _debug: function(message)
  {
    if (this.shouldDebug)
    {
      alert("AjaxJS Message:\n\n" + message);
    }
  },

  _error: function(message)
  {
    if (this.shouldDebug)
    {
      alert("AjaxJS ERROR:\n\n" + message);
    }
  },

  _describe: function(obj)
  {
    var message;

    if (obj===null)
    {
      return null;
    }

    message = "";
    if(typeof(obj)=='object')
    {
      for (key in obj)
      {
        message += ", [" + key + "]: [" + obj[key] + "]";
      }
      if (message.length > 0)
      {
        message = message.substring(2); // chomp initial ', '
      }
    }
    else
    {
      message = "" + obj;
    }

    return message;
  }
};
