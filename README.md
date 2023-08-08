# notch-zone-synchronizer
Notch plugin for Augmenta zone synchronization
Creates and updates all Augmenta zones as 3D shapes nodes in Notch.

When manually triggered this plugin does :
- Fetch the zones from Augmenta server's json
- Create/update the 3D shapes

## Install

Get the example or follow this instructions to make it work from a blank notch project 

- Create a Javascript node and rename it to "Augmenta zone synchronizer"
- On the node inspector : Add Global Input (float) and rename it to "SyncZones"
- On the node inspector : Make it point to the Javascript File


## Use

Triggering options
- key pressed 'r'
- Osc (through and OSC modifier)
- Manually in the patch by changing the SyncZones value
