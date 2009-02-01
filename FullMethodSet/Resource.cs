using System;
using System.Web;
using System.Net;
using System.IO;
using System.Xml;
using System.Globalization;
using System.Text.RegularExpressions;
using System.Collections;
using System.Threading;

using Amundsen.Utilities;

namespace Amundsen.HTTPSamples.FullMethodSet
{
  /// <summary>
  /// Public Domain 2009 amundsen.com, inc.
  /// @author mike amundsen (mamund@yahoo.com)
  /// @version 1.0 (2009-01-30)
  /// </summary>
  class Resource : IHttpHandler
  {
    private WebUtility wu = new WebUtility();
    private CacheService cs = new CacheService();
    //private HttpClient client = new HttpClient();
    private Hashing h = new Hashing();
    private EXslt x = new EXslt();
    private HttpContext ctx;

    string[] HttpGetAcceptable = { "text/html", "text/xml", "application/xml", "application/json", "text/json"};
    string[] HttpPostAcceptable = { "application/x-www-form-urlencoded" };
    Hashtable xsltMap = new Hashtable();
    Hashtable config = new Hashtable();


    bool IHttpHandler.IsReusable
    {
      get { return false; }
    }

    public void ProcessRequest(HttpContext context)
    {
      ctx = context;
      getConfigSettings(ref config);
      wu.SetCompression(ctx);
      xsltMap = SetXsltMap();

      try
      {
        switch (ctx.Request.HttpMethod.ToLower())
        {
          case "get":
            Get();
            break;
          case "head":
            Get(true);
            break;
          case "post":
            Post();
            break;
          case "delete":
            Delete();
            break;
          default:
            throw new HttpException((int)HttpStatusCode.MethodNotAllowed, "Method Not Allowed");
          //break;
        }
      }
      catch (HttpException hex)
      {
        if (hex.GetHttpCode()<300 || hex.GetHttpCode()>399)
        {
          ctx.Response.ContentType = "text/plain";
          ctx.Response.Write(string.Format(CultureInfo.CurrentCulture, Constants.ErrorFormat, hex.GetHttpCode(), hex.Message));
          ctx.Response.Write(" ".PadRight(500));  // force IE to show the data
        }
        ctx.Response.StatusCode = hex.GetHttpCode();
        ctx.Response.StatusDescription = hex.Message;
      }
      catch (Exception ex)
      {
        ctx.Response.ContentType = "text/plain";
        ctx.Response.Write(string.Format(CultureInfo.CurrentCulture, Constants.ErrorFormat, 500, ex.Message));
        ctx.Response.Write(" ".PadRight(500));  // force IE to show the data

        ctx.Response.StatusCode = 500;
        ctx.Response.StatusDescription = ex.Message;
      }
    }

    private void Get()
    {
      Get(false);
    }
    private void Get(bool suppressContent)
    {
      CacheItem item = null;
      string sdsUrl = string.Empty;
      string requestId = string.Empty;
      string requestUrl = ctx.Request.Url.ToString();
      string ifNoneMatch = wu.GetHeader(ctx, "if-none-match");
      string id = wu.GetQueryArg(ctx,"id");

      // content negotiation
      string acceptType = wu.SelectAcceptType(ctx.Request.AcceptTypes, HttpGetAcceptable, "text/html");
      if (acceptType == string.Empty)
      {
        throw new HttpException((int)System.Net.HttpStatusCode.NotAcceptable, System.Net.HttpStatusCode.NotAcceptable.ToString());
      }

      // check local cache first (if allowed)
      if (wu.CheckNoCache(ctx) == true)
      {
        ifNoneMatch = string.Empty;
        cs.RemoveItem(requestUrl + acceptType);
      }
      else
      {
        item = cs.GetItem(requestUrl + acceptType);

        // did our copy expire?
        if (item != null && (item.Expires < DateTime.UtcNow))
        {
          cs.RemoveItem(requestUrl + acceptType);
          item = null;
        }
      }

      // ok, we need to talk to SDS now
      if (item == null)
      {
        sdsUrl = string.Format(CultureInfo.CurrentCulture, "{0}{1}/{2}/{3}", config["proxy"], Constants.Authority, Constants.Container, id);
        if (id == string.Empty)
        {
          item = ListPage(requestUrl, sdsUrl, acceptType);
        }
        else
        {
          item = DetailPage(requestUrl, sdsUrl, acceptType);
        }
      }

      // finish processing request
      if (ifNoneMatch == item.ETag)
      {
        ctx.Response.ContentType = (acceptType != Constants.sdsType ? acceptType : "text/xml");
        throw new HttpException((int)HttpStatusCode.NotModified, HttpStatusCode.NotModified.ToString());
      }

      // compose response to client
      ctx.Response.SuppressContent = suppressContent;
      ctx.Response.StatusCode = 200;
      ctx.Response.ContentType = (acceptType != Constants.sdsType ? acceptType : "text/xml");
      ctx.Response.StatusDescription = "OK";
      if (item.BinaryData != null)
      {
        ctx.Response.BinaryWrite(item.BinaryData);
      }
      else
      {
        ctx.Response.Write(item.Payload);
      }

      // add msft_header, if present (for debugging)
      if (requestId.Length != 0)
      {
        ctx.Response.AppendToLog(string.Format(" [{0}={1}]", Constants.MsftRequestId, requestId));
        ctx.Response.AddHeader(Constants.MsftRequestId, requestId);
      }

      // validation caching
      ctx.Response.AddHeader("etag", item.ETag);
      ctx.Response.AppendHeader("Last-Modified", string.Format(CultureInfo.CurrentCulture, "{0:R}", item.LastModified));

      // expiration caching, if config'ed
      if (Convert.ToBoolean(config["showExpires"]))
      {
        ctx.Response.AppendHeader("Expires", string.Format(CultureInfo.CurrentCulture, "{0:R}", item.Expires));
        ctx.Response.AppendHeader("cache-control", string.Format(CultureInfo.CurrentCulture, "max-age={0}, must-revalidate", config["maxAge"]));
      }
      else
      {
        ctx.Response.AppendHeader("cache-control", "must-revalidate");
      }

      // ie local cache hack
      if (ctx.Request.UserAgent != null && ctx.Request.UserAgent.IndexOf("IE", StringComparison.CurrentCultureIgnoreCase) != -1)
      {
        ctx.Response.AppendHeader("cache-control", "no-cache,post-check=1,pre-check=2");
      }
    }

    private void Post()
    {
      string message = string.Empty;
      string entity = string.Empty;
      string sdsUrl = string.Empty;

      // content negotiation
      string acceptType = wu.SelectAcceptType(ctx.Request.AcceptTypes, HttpGetAcceptable, "text/html");
      if (acceptType == string.Empty)
      {
        throw new HttpException((int)System.Net.HttpStatusCode.NotAcceptable, System.Net.HttpStatusCode.NotAcceptable.ToString());
      }

      // get form arguments
      message = wu.GetFormArg(ctx,"message");
      if (message.Length == 0)
      {
        throw new HttpException(400, "Missing Message text");
      }
      if (message.Length > 140)
      {
        throw new HttpException(400, "Message text is longer than 140 characters.");
      }

      // post the message to SDS
      entity = string.Format(CultureInfo.CurrentCulture, Constants.todoEntity, message, DateTime.UtcNow);
      sdsUrl = string.Format(CultureInfo.CurrentCulture, "{0}{1}/{2}/", config["proxy"], Constants.Authority, Constants.Container);
      
      HttpClient sdsClient = new HttpClient();
      sdsClient.RequestHeaders.Add("authorization", "Basic " + h.Base64Encode(string.Format("{0}:{1}", config["user"], config["password"])));
      sdsClient.Execute(sdsUrl, "post", Constants.sdsType, entity);
      string id = sdsClient.ResponseHeaders["location"];
      id = id.Substring(id.LastIndexOf("/") + 1);

      // clear the local cache (for this type)
      HttpClient cacheClient = new HttpClient();
      cacheClient.RequestHeaders.Add("cache-control", "no-cache");
      cacheClient.Execute(string.Format(CultureInfo.CurrentCulture, "http://{0}/{1}/", ctx.Request.Url.DnsSafeHost, config["root"]), "get", acceptType);

      // now jump off to clear all the other types
      UpdateArgs args = new UpdateArgs(new string[] { string.Format(CultureInfo.CurrentCulture, "http://{0}/{1}/", ctx.Request.Url.DnsSafeHost, config["root"]) }, HttpGetAcceptable);
      ThreadPool.QueueUserWorkItem(new WaitCallback(Resource.UpdateCache), args);

      // redirect to list page
      ctx.Response.RedirectLocation = string.Format(CultureInfo.CurrentCulture, "http://{0}/{1}/", ctx.Request.Url.DnsSafeHost, config["root"]);
      ctx.Response.ContentType = "text/plain";
      ctx.Response.StatusCode = (int)System.Net.HttpStatusCode.Found;
      ctx.Response.Write("Redirecting...");
      ctx.Response.Flush();
    }

    private void Delete()
    {
      string sdsUrl = string.Empty;
      string id = string.Empty;

      // get item to delete
      id = wu.GetQueryArg(ctx,"id");
      if (id == string.Empty)
      {
        throw new HttpException(400, "Missing Mesage ID");
      }

      // delete the message from SDS
      sdsUrl = string.Format(CultureInfo.CurrentCulture, "{0}{1}/{2}/{3}", config["proxy"], Constants.Authority, Constants.Container, id);
      HttpClient sdsClient = new HttpClient();
      sdsClient.RequestHeaders.Add("authorization", "Basic " + h.Base64Encode(string.Format("{0}:{1}", config["user"], config["password"])));
      sdsClient.Execute(sdsUrl, "delete", Constants.sdsType);

      // clean up cache for this type
      HttpClient cacheClient = new HttpClient();
      cacheClient.RequestHeaders.Add("cache-control", "no-cache");
      cacheClient.Execute(string.Format(CultureInfo.CurrentCulture, "http://{0}/{1}/", ctx.Request.Url.DnsSafeHost, config["root"]), "get");

      // clear cache for all the other types
      UpdateArgs args = new UpdateArgs(new string[] 
        { 
          string.Format(CultureInfo.CurrentCulture,"http://{0}/{1}/", ctx.Request.Url.DnsSafeHost, config["root"]), 
          string.Format(CultureInfo.CurrentCulture,"http://{0}/{1}/{2}", ctx.Request.Url.DnsSafeHost, config["root"],id) 
        }, HttpGetAcceptable);
      ThreadPool.QueueUserWorkItem(new WaitCallback(Resource.UpdateCache), args);

      // redirect to list page
      ctx.Response.RedirectLocation = string.Format(CultureInfo.CurrentCulture, "http://{0}/{1}/", ctx.Request.Url.DnsSafeHost, config["root"]);
      ctx.Response.ContentType = "text/plain";
      ctx.Response.StatusCode = (int)System.Net.HttpStatusCode.Found;
      ctx.Response.Write("Redirecting...");
      ctx.Response.Flush();
    }

    private CacheItem ListPage(string requestUrl, string sdsUrl, string acceptType)
    {
      CacheItem item;
      string rtn = string.Empty;
      Hashing h = new Hashing();
      HttpClient client = new HttpClient();
      XmlDocument xmldoc = new XmlDocument();
      System.IO.MemoryStream ms = new System.IO.MemoryStream();

      string transform = string.Format(CultureInfo.CurrentCulture, "{0}{1}-{2}.xsl", config["transforms"], "list", xsltMap[acceptType]);

      // get the data from SDS
      client.UseBinaryStream = true;
      client.RequestHeaders.Add("authorization", "Basic " + h.Base64Encode(string.Format("{0}:{1}", config["user"], config["password"])));
      client.RequestHeaders.Add("cache-control", "no-cache");
      client.Execute(sdsUrl, "get", Constants.sdsType, string.Empty, ref ms);

      // load the response as XML
      xmldoc = new XmlDocument();
      ms.Position = 0;
      xmldoc.Load(ms);

      // transform it to the requested representation
      System.Xml.Xsl.XsltArgumentList args = new System.Xml.Xsl.XsltArgumentList();
      args.AddParam("date-time", "", System.DateTime.UtcNow);
      args.AddParam("root", "", config["root"]);
      args.AddParam("host", "", ctx.Request.Url.DnsSafeHost);
      rtn = x.Transform(xmldoc, ctx.Server.MapPath(transform), args);

      // place into local cache
      item = cs.PutItem(
        new CacheItem(
          requestUrl + acceptType,
          rtn,
          string.Format(CultureInfo.CurrentCulture, "\"{0}\"", cs.MD5BinHex(rtn)),
          DateTime.UtcNow.AddSeconds(Convert.ToInt32(config["maxAge"])),
          Convert.ToBoolean(config["showExpires"]),
          null
        )
      );

      return item;
    }

    private CacheItem DetailPage(string requestUrl, string sdsUrl, string acceptType)
    {
      CacheItem item;
      string rtn = string.Empty;
      Hashing h = new Hashing();
      HttpClient client = new HttpClient();
      XmlDocument xmldoc = new XmlDocument();
      System.IO.MemoryStream ms = new System.IO.MemoryStream();
      string transform = string.Format(CultureInfo.CurrentCulture, "{0}{1}-{2}.xsl", config["transforms"], "detail", xsltMap[acceptType]);

      // get the data from SDS
      client.UseBinaryStream = true;
      client.RequestHeaders.Add("authorization", "Basic " + h.Base64Encode(string.Format("{0}:{1}", config["user"], config["password"])));
      client.RequestHeaders.Add("cache-control", "no-cache");
      client.Execute(sdsUrl, "get", Constants.sdsType, string.Empty, ref ms);

      // load the response as XML
      xmldoc = new XmlDocument();
      ms.Position = 0;
      xmldoc.Load(ms);

      // transform it to the requested representation
      System.Xml.Xsl.XsltArgumentList args = new System.Xml.Xsl.XsltArgumentList();
      args.AddParam("date-time", "", System.DateTime.UtcNow);
      args.AddParam("root", "", config["root"]);
      args.AddParam("host", "", ctx.Request.Url.DnsSafeHost);
      rtn = x.Transform(xmldoc, ctx.Server.MapPath(transform), args);

      // place into local cache
      item = cs.PutItem(
        new CacheItem(
          requestUrl + acceptType,
          rtn,
          string.Format(CultureInfo.CurrentCulture, "\"{0}\"", cs.MD5BinHex(rtn)),
          DateTime.UtcNow.AddSeconds(Convert.ToInt32(config["maxAge"])),
          Convert.ToBoolean(config["showExpires"]),
          null
        )
      );

      return item;
    }

    private Hashtable SetXsltMap()
    {
      Hashtable map = new Hashtable();

      map.Add("text/html", "html");
      map.Add("application/x-ssds+xml", "xml");
      map.Add("text/xml", "xml");
      map.Add("application/xml", "xml");
      map.Add("application/json", "json");
      map.Add("text/json", "json");
      
      return map;
    }

    private void getConfigSettings(ref Hashtable c)
    {
      c.Add("root", wu.GetConfigSectionItem("sds", "root"));
      c.Add("user", wu.GetConfigSectionItem("sds", "user"));
      c.Add("password", wu.GetConfigSectionItem("sds", "password"));
      c.Add("proxy", wu.GetConfigSectionItem("sds", "proxy"));
      c.Add("maxAge", wu.GetConfigSectionItem("sds", "maxAge"));
      c.Add("showExpires", wu.GetConfigSectionItem("sds", "showExpires"));
      c.Add("transforms", wu.GetConfigSectionItem("sds", "transforms"));
    }

    // call this on a new thread to handle
    // background cache updates
    private static void UpdateCache(object update)
    {
      UpdateArgs args = (UpdateArgs)update;
      HttpClient client = new HttpClient();
      client.RequestHeaders.Add("cache-control", "no-cache");

      for (int i = 0; i < args.Urls.Length; i++)
      {
        for (int j = 0; j < args.Types.Length; j++)
        {
          try
          {
            client.Execute(args.Urls[i], "get", args.Types[j]);
          }
          catch (Exception ex)
          {
            // ignore this
          }
        }
      }
    }
  }

  class UpdateArgs
  {
    public string[] Urls;
    public string[] Types;

    public UpdateArgs() { }
    public UpdateArgs(string[] urls, string[] types)
    {
      this.Urls = urls;
      this.Types = types;
    }
  }

  class Constants
  {
    static public string ErrorFormat = "{0} - {1}";
    static public string Authority = "mamund";
    static public string Container = "http-sample";
    static public string sdsType = "application/x-ssds+xml";
    static public string MsftRequestId = "x-msft-request-id";

    static public string todoEntity = @"
<todo xmlns:s=""http://schemas.microsoft.com/sitka/2008/03/"" 
  xmlns:xsi=""http://www.w3.org/2001/XMLSchema-instance"" 
  xmlns:x=""http://www.w3.org/2001/XMLSchema"">
  <s:Id>$id$</s:Id>
  <message xsi:type=""x:string"">{0}</message>
  <date-created xsi:type=""x:dateTime"">{1}</date-created>
</todo>";
  }

}
