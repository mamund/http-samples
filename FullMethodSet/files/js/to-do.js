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

    // can we ajax today?
    flag = ajax.supportsXMLHttpRequest();

    // update delete forms
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

    // hide refresh if nothing is in the list
    coll = document.getElementsByTagName('dt');
    if(coll.length==0)
    {
      elm = document.getElementsByTagName('a')[0];
      if(elm && elm.getAttribute('rel')=='refresh')
      {
        elm.style.display='none';
      }
    }

    // set focus to the one input box on the page
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

	  ajax.showStatus=false;
    ajax.httpDeleteForm(null, null, deleteCallback, false, refreshUrl,formName);

    return false;
  }

  function deleteCallback(response,headers,context,status,msg)
  {
    location.href=context
    return false;
  }

  // public interface
  var that = {};
  that.init = init;
  return that;
}
