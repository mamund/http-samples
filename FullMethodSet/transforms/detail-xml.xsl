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
		omit-xml-declaration="yes"
		encoding="utf-8"
		media-type="text/xml"
		standalone="yes"/>

  <xsl:param name="host" />
  <xsl:param name="root" />
  <xsl:param name="date-time" />

  <xsl:template match="/">
    <to-do>
      <title>HTTP Sample : To-Do Item</title>
      <last-updated>
        <xsl:value-of select="$date-time"/>
      </last-updated>
      <link href="http://{$host}/{$root}/" title="Return to the list" rel="back" />
      <message-list>
        <xsl:apply-templates select="//todo">
          <xsl:sort data-type="text" order="descending" select="date-created"/>
        </xsl:apply-templates>
      </message-list>
    </to-do>
  </xsl:template>

  <xsl:template match="todo">
    <message>
      <text>
        <xsl:value-of select="message"/>
      </text>
      <date-created>
        <xsl:value-of select="date-created"/>
      </date-created>
      <form action="http://{$host}/{$root}/{s:Id}" method="delete"  rel="delete" />
    </message>
  </xsl:template>

</xsl:stylesheet>
