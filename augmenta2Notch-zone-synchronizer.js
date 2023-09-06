// input var
var SyncZones;
var RemoteAddress;
var RemotePort;

// global var
var layer;
var augmentaScriptNode;
var augmentaScriptNodeName = "Augmenta zone synchronizer";
var augmentaScriptGraphPosition;
var augmentaZoneNode;
var augmentaZoneNodeName = "Augmenta zones";
var currentNodesNames = [];
var offsetGraph = 60;

function Init()
{
	Log("Augmenta zones synchronizer v0.1");
    layer = Document.GetLayer(0);
    augmentaScriptNode = layer.FindNode(augmentaScriptNodeName);
    Initialize();
}

function Initialize()
{
    // Get augmenta script node Graph position
    augmentaScriptGraphPosition = augmentaScriptNode.GetNodeGraphPosition();

    // Create augmenta null node
    augmentaZoneNode = layer.FindNode(augmentaZoneNodeName);
    if (augmentaZoneNode) {
        //Log("Augmenta zones node found")
    } else {
        Log("Augmenta zones node not found, creating node...");
        augmentaZoneNode = layer.CreateNode("Geometry::Null");
        augmentaZoneNode.SetName(augmentaZoneNodeName);
    }
    augmentaZoneNode.SetNodeGraphPosition(augmentaScriptGraphPosition[0], augmentaScriptGraphPosition[1] + offsetGraph);
}

function Update()
{
    // Trig sync by changing value to input parameters SyncZones
    if (SyncZones != 0)
    {
        Log("Sync zones triggered...");
        syncZones();
    }
}

function syncZones()
{
    Initialize();
    
    // Json request and callback
    req = { method: 'GET' };
    var currentAddress = "http://" + RemoteAddress + ":" + RemotePort;
    NFetch(currentAddress, req, getJSON);
    
    // reset button
    SyncZones = 0;
    augmentaScriptNode.SetFloat('Input Parameters.SyncZones', SyncZones);}

// Callback
function getJSON(response)
{
    if (response && response.ok && response.status === 200)
    {
        json = response.json();
        if(json) {
            Log("Json load received");

            currentNodesNames = [];
            var path = json.CONTENTS.worlds.CONTENTS.world.CONTENTS.children.CONTENTS.scene.CONTENTS.children.CONTENTS;

            for (var pas = 0; pas < Object.keys(path).length; pas++) {
                var nameObject = Object.keys(path)[pas];
                findZoneInContainer(path, nameObject, pas);
            } 
        } else {
            Log("Did not receive Json load !");
        }
    } else {
        Log("Did not receive Json load !"); 
    }
    
    numChildren = augmentaZoneNode.GetNumChildren();
    var p = 0;
    for (i = 0; i < numChildren; i++) {
        child = augmentaZoneNode.GetChild(p);

        var inCurrentScene = false;
        for (j = 0; j < currentNodesNames.length; j++) {
            if (child.GetName() == currentNodesNames[j]) {
                inCurrentScene = true;
                break;
            }
        }

        if (inCurrentScene) {
            p++;
        }
        else {
            augmentaZoneNode.RemoveChild(child);
            child.DeleteNode();
        }
    }

    return;
}

function findZoneInContainer(path, nameObject, pas)
{
    var currentName = Object.keys(path)[pas];
    var currentType = path[currentName].TYPE;

    if (currentType == "Zone"){
        // Creating/updating Notch shape nodes
        var currentPosition = path[currentName].CONTENTS.position.VALUE;
        var currentRotation = path[currentName].CONTENTS.rotation.VALUE;
        var currentShape = path[currentName].CONTENTS.shape.VALUE;
        var currentSize

        if (currentShape == "Box") {
            currentSize = path[currentName].CONTENTS.box.CONTENTS.boxSize.VALUE;
        } else {
            Log("not a box");
        }

        syncShapeNodes(nameObject, currentPosition, currentRotation, currentShape, currentSize);
        return;
    }

    else if (currentType == "Container") {
        var path2 = path[currentName].CONTENTS.children.CONTENTS;

        for (var pas2 = 0; pas2 < Object.keys(path2).length; pas2++){            
            var nameObject2 = nameObject + " " + Object.keys(path2)[pas2];
            findZoneInContainer(path2, nameObject2, pas2);
        }
    }

    else {
        Log("This is not a Zone");
        return;
    }
}

// Example with one shape with tmp var currentNodeName
function syncShapeNodes(namecur, currentPosition, currentRotation, currentShape, currentSize)
{
    Log("Synchronizing current Zone");

    currentNode = layer.FindNode(namecur);
    if (currentNode) {
        //Log("Node found")
    } else {
        Log("Node not found, creating node...");
        currentNode = layer.CreateNode("Geometry::Shape 3D");
        currentNode.SetName(namecur);
        augmentaZoneNode.AddChild(currentNode);
    }

    currentNode.SetNodeGraphPosition(
        augmentaScriptGraphPosition[0], augmentaScriptGraphPosition[1] + (currentNodesNames.length + 2) * offsetGraph);
    Log("Updating node transform");
    currentNode.SetFloat('Transform.Position X', currentPosition[0] + currentSize[0]/2);
    currentNode.SetFloat('Transform.Position Y', currentPosition[1] + currentSize[1]/2);
    currentNode.SetFloat('Transform.Position Z', currentPosition[2] + currentSize[2]/2);

    currentNode.SetFloat('Transform.Rotation Heading', currentRotation[0] * Math.PI / 180);
    currentNode.SetFloat('Transform.Rotation Pitch', currentRotation[1] * Math.PI / 180);
    currentNode.SetFloat('Transform.Rotation Bank', currentRotation[2] * Math.PI / 180);

    Log("Updating node attributes");
    if(currentShape == "Box")
    {
        currentNode.SetFloat("Attributes.Shape Type", 1); // 1 is Box
        currentNode.SetFloat('Attributes.Size X', currentSize[0]);
        currentNode.SetFloat('Attributes.Size Y', currentSize[1]);
        currentNode.SetFloat('Attributes.Size Z', currentSize[2]);
    } else {
        //Log("test is not a box");
    }
    currentNodesNames.push(namecur);
}

// TOTEST
function OnKeyPress(key)
{
    if (key == 'r')
    {
        Log("You pressed key r ! Starting Augmenta zone sync...")
        syncZones();
    }
}
