/* 2009-01-30 (mca) :  to-do.js */

window.onload = function()
{
  var t = todo();
  t.init();
}

var todo = function()
{
  function init()
  {
    var coll,i,elm,flag;

    flag = ajax.supportsXMLHttpRequest();
    
    coll = document.getElementsByTagName('form');  
    for(i=0;i<coll.length;i++)
    {
      if(coll[i].className.indexOf('delete-form')!=-1)
      {
        if(flag==true)
        {
          coll[i].onsubmit = deleteItem;
          coll[i].style.display='inline';
        }
      }
    }
    
    coll = document.getElementsByTagName('dt');
    if(coll.length==0)
    {
      elm = document.getElementsByTagName('a')[0];
      if(elm && elm.getAttribute('rel')=='refresh')
      {
        elm.style.display='none';
      }
    }

    elm = document.getElementsByName('message')[0];
    if(elm)
    {
      elm.focus();
    }
    
  }

  function deleteItem()
  {
    var formName,refreshUrl;
    
    formName = this.getAttribute('name');
    refreshUrl = this.getAttribute('refresh');
    del = this.getAttribute('delete');
    
	  ajax.showStatus=false;
    ajax.httpDeleteForm(del, null, deleteCallback, false, refreshUrl);
    
    return false;        
  }
  
  function deleteCallback(response,headers,context,status,msg)
  {
    location.href=context
    return false;
  }  
  
  var that = {};
  that.init = init;
  return that;
}



