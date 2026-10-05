---
'@kieranklaassen/live-mix': patch
---

`@kieranklaassen/live-mix/testing`: `MockAudioContext.allNodes()` left out the nodes made by `createWaveShaper()`, though it is said to give every node the context made. A test that walks all nodes to see that nothing is left connected after a dispose, or that compares two graphs node by node, did not see a saturator. They are in the list now, in creation order with the rest; a test that counted `allNodes()` on a graph with a wave shaper in it counts one more for each.
