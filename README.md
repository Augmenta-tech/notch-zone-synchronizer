# notch-zone-synchronizer
Notch plugin for Augmenta zone synchronization
Creates and updates all Augmenta zones as 3D shapes nodes in Notch.

When manually triggered this plugin does :
- Fetch the zones from Augmenta server's json
- Create/update the 3D shapes

## Install

Requirement
- Notch license (at least student, if you need to save the patch)
- Augmenta OSC remote control enabled

Get the provided example or follow this instructions to make it work from a blank notch project 

- Create a Javascript node and rename it
- On the node inspector : Add Global Input (float) and rename it to "SyncZones"
- On the node inspector : Add 2x Global Input (string) and rename it to "RemoteAddress" and "RemotePort"
- On the node inspector : Add 1x Global Input (string) and rename it to "WorldName", the WorldName parameter is the name of the pléiades world without spaces or capital letters (for example "My World" would be "myWorld")
- On the node inspector : Add 2x Global Input (string) and rename it to "AugmentaScriptNodeName" and "SceneName", the AugmentaScriptNodeName must have the same name as the Javascript node and put a name to the scene
- In project > settings > protocols, enable osc and TUIO (in case you need it)

N.B : If you create several javascript nodes, you must give a different name to the Javascript node (and AugmentaScriptNodeName) and to the SceneName.

## Use

This prototype is only synchronizing one box zone that should be named testZone in Augmenta

Fill RemoteAddress with the Augmenta server address and RemotePort with the port

Triggering options
- Manually in the patch by changing the SyncZones value
- Osc (through and OSC modifier) (not tested)
- key pressed 'r' at runtime (not tested)

In Notch patch, press ctrl+R on the "Augmenta zones" node to see all the zones displayed 