#!/usr/bin/python
import json

from dataCommon import DataCommon

common = DataCommon("local.prop")
keys = common.getConfigKey(common.DATA, common.KEYS, "").split(",")

data = {}
for key in keys:
  data[key] = common.getJsonUrl(key)

print(json.dumps(data, indent=2))
