---
'@kieranklaassen/live-mix': patch
---

The plug-in host keeps the two files a scan and its scanner talk through beside its plug-in list, in the data folder, and no longer in the system's temp folder. What the scanner writes down is taken as its word for what each plug-in file holds, and on Linux the temp folder is every person's and every program's to write in: a line somebody else put into the results file named a plug-in of theirs as one the scan had found, and it was saved with the list. A data folder that cannot be written still falls back to the temp folder.
