#!/usr/bin/python
import json

from dataCommon import DataCommon

common = DataCommon("local.prop")

data = {
  "people": common.getJsonUrl(common.PEOPLE_URL),
  "relation": common.getJsonUrl(common.RELATION_URL)
}
print(json.dumps(data, indent=2))
