<?xml version="1.0" encoding="utf-8"?>
<!-- 2009-01-09 (mca) : list page for to-do demo -->
<xsl:stylesheet version="1.0"
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
	xmlns:s="http://schemas.microsoft.com/sitka/2008/03/"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xmlns:x="http://www.w3.org/2001/XMLSchema"
	xmlns="http://www.w3.org/1999/xhtml"
	extension-element-prefixes="s xsi x"
	exclude-result-prefixes="xmlns">

  <xsl:output method="text"
		omit-xml-declaration="yes"
		encoding="utf-8"
		media-type="application/json"
		standalone="yes"/>
  <xsl:strip-space  elements="*"/>
  
  <xsl:param name="host" />
  <xsl:param name="root" />
  <xsl:param name="date-time" />

  <xsl:template match="/">
    {
      "todo" :
      {
        "xml:base":"http://<xsl:value-of select="$host" />",
        "title:"HTTP Sample : To-Do List",
        "lastUpdated":"<xsl:value-of select="$date-time"/>",
        "form":
        {
          "action":"/<xsl:value-of select="$root"/>/",
          "method":"post",
          "enctype":"application/x-www-form-urlencoded",
          {
            "inputs":
            [
              {
                "name":"message",
                "type":"text",
                "size":50,
                "maxlength":140
              }
            ]
          }
        },
        "link":
        {
         "rel":
         "refresh",
         "href":"/<xsl:value-of select="$root"/>/",
         "title":"Refresh this list"
        },
        "messages":
         [
          <xsl:apply-templates select="//todo"><xsl:sort data-type="text" order="descending" select="date-created"/></xsl:apply-templates>
         ]
      }
    }
  </xsl:template>

  <xsl:template match="todo">
    {
      "link:
      {
        "rel":"detail",
        "href":"/<xsl:value-of select="$root"/>/<xsl:value-of select="s:Id" />",
        "title":"View Detail"
      },
      "text":"<xsl:value-of select="message"/>",
      "dateCreated":"<xsl:value-of select="date-created"/>",
      "form":
      {
        "action":"/<xsl:value-of select="$root"/>/<xsl:value-of select="s:Id" />",
        "method":"delete",
        "rel":"delete"
      }
    }
  </xsl:template>

</xsl:stylesheet>
