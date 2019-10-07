#!/usr/bin/python
# Convert CSV test files to input json format
import json
import csv
import sys

from dataCommon import DataCommon

common = DataCommon("local.prop")
keys = common.getConfigKey(common.DATA, common.KEYS, "").split(",")

data = {
  common.BASE: common.getConfigKey(common.HTTP_CRED, common.BASE, "")
}

for key in keys:
  data[key] = []
data["deaths"] = []

if (len(sys.argv) > 1):
  with open(sys.argv[1]) as csvfile:
    readCSV = csv.reader(csvfile, delimiter=',')
    partone = True
    for row in readCSV:
      if (len(row) == 0):
        partone = False
        continue

      if (row[0].startswith("#")):
        continue

      if (row[0] != "" and partone):
        #Id,Name,Link,Gender,Birth,Death
        data["people"].append({
          "nid": row[0],
          "title": row[1]
        })
        if (len(row) > 4):
          if (row[4]):
            data["births"].append({
              "field_person_or_group_a_1": row[0],
              "field_event_year": row[4]
            })
        if (len(row) > 5):
          if (row[5]):
            data["deaths"].append({
              "field_person_or_group_a_1": row[0],
              "field_event_year": row[5]
            })
        if (len(row) > 3):
          if (row[3]):
            data["gender"].append({
              "field_person_or_group_a_1": row[0],
              "field_gender": row[3]
            })
      else:
        #Id,Relation,Id2
        data["relation"].append({
          "field_person_or_group_a": row[0],
          "title": row[1],
          "field_person_or_group_b": row[2]
        })

print(json.dumps(data, indent=2))
