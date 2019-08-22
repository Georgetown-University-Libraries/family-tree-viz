#import sys
#import time
import urllib.request
import json
import configparser
import base64

class DataCommon:
  HTTP_CRED="http-cred"
  BASE="BASE"
  USER="USER"
  PASS="PASS"

  DATA="data"
  PEOPLE_URL="PEOPLE_URL"
  RELATION_URL="RELATION_URL"

  config = {}
  def __init__(self, propfile = "local.prop"):
    self.config = configparser.RawConfigParser()
    self.config.read(propfile)

  # Get the appropriate config value from the local.prop file.
  # See local.prop.template to learn how to format the local.prop file.
  def getConfigKey(self, sec, key, defval = ""):
    if self.config.has_option(sec, key):
      return self.config.get(sec, key)
    else:
      return defval;

  def getPath(self, key, defpath = ""):
    return self.getConfigKey(self.HTTP_CRED, self.BASE) + self.getConfigKey(self.DATA, key, defpath)

  def getAuthHeader(self):
    val = self.getConfigKey(self.HTTP_CRED, self.USER) + ":" + self.getConfigKey(self.HTTP_CRED, self.PASS)
    valb64 = base64.b64encode(val.encode("ascii"))
    return "Basic " + valb64.decode("ascii")

  def getJsonUrl(self, key):
    headers={
      'accept': 'application/json',
      'Authorization': self.getAuthHeader()
    }
    url = self.getPath(key)
    req = urllib.request.Request(url, headers=headers)
    response = urllib.request.urlopen(req)
    jsondata = json.loads(response.read())
    return jsondata
