---
"@arkts/image-manager": patch
---

fix: resolve stack overflow from circular reference when serializing getDeployedDevices

ListsFileItem.toJSON() called getListsFile().toJSON(), while ListsFile.toJSON()
serialized all ListsFileItems, causing infinite recursion. Remove the listsFile
field from ListsFileItem serialization to break the cycle.
