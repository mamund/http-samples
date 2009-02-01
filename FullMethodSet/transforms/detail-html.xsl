<?xml version="1.0" encoding="utf-8"?>
<!-- 2009-01-09 (mca) : detail page for to-do demo -->
<xsl:stylesheet version="1.0"
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
	xmlns:s="http://schemas.microsoft.com/sitka/2008/03/"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xmlns:x="http://www.w3.org/2001/XMLSchema"
	xmlns="http://www.w3.org/1999/xhtml"
	extension-element-prefixes="s xsi x"
	exclude-result-prefixes="xmlns">

  <xsl:output method="xml"
		omit-xml-declaration="no"
		doctype-public="-//W3C//DTD XHTML 1.0 Strict//EN"
		doctype-system="http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd"
		encoding="utf-8"
		media-type="text/html"
		standalone="yes"/>

  <xsl:param name="root" />
  <xsl:param name="date-time" />

  <xsl:template match="/">
    <html>
      <head>
        <title>To-Do Item</title>
        <link href="files/css/to-do.css" rel="stylesheet" type="text/css"/>
      </head>
      <body>
        <div id="header">
          <h1>HTTP Sample : To-Do Item</h1>
          <span class="last-updated">
            Updated: <xsl:value-of select="$date-time"/>
          </span>
        </div>
        <div id="message-list">
          <h2>Do This</h2>
          <p class="return-link">
            <a href="./" title="Return to list" rel="back">&lt;&lt;-- Back</a>
          </p>
          <dl>
            <xsl:apply-templates select="//todo">
              <xsl:sort data-type="text" order="descending" select="date-created"/>
            </xsl:apply-templates>
          </dl>
        </div>
        <div id="footer">
        </div>
      </body>
      <script type="text/javascript" src="files/js/ajax.js">// ajax.js</script>
      <script type="text/javascript" src="files/js/to-do.js">// to-do.js</script>
    </html>
  </xsl:template>

  <xsl:template match="todo">
    <dt>
      <xsl:value-of select="message"/>
    </dt>
    <dd>
      <form name="delete-form" class="delete-form" action="{s:Id}" method="get" rel="delete" refresh="/{$root}/" style="display:none;">
        <input type="submit" value="Delete" />
      </form>
    </dd>
  </xsl:template>

</xsl:stylesheet>
