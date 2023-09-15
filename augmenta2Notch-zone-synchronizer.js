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
var zoneToDelete = [];
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

                findZoneInContainer(path, nameObject, pas, augmentaZoneNodeName);
            } 
        } else {
            Log("Did not receive Json load !");
        }
    } else {
        Log("Did not receive Json load !"); 
    }

    deleteNode();

    return;
}

function findZoneInContainer(path, nameObject, pas, parentNodeName)
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
        }
        else if (currentShape == "Sphere") {
            currentSize = path[currentName].CONTENTS.sphere.CONTENTS.radius.VALUE;
        }
        else if (currentShape == "Cylinder") {
            currentSize = [path[currentName].CONTENTS.cylinder.CONTENTS.radius.VALUE, path[currentName].CONTENTS.cylinder.CONTENTS.height.VALUE];
        } else {
            Log("not a commun shape");
        }

        syncShapeNodes(nameObject, currentPosition, currentRotation, currentShape, currentSize, parentNodeName);
        return;
    }

    else if (currentType == "Container") {
        var path2 = path[currentName].CONTENTS.children.CONTENTS;

        var containerNode = layer.FindNode(nameObject);
        var parentNode = layer.FindNode(parentNodeName);
        if (containerNode) {
            Log("Augmenta zones node found");
        } else {

            containerNode = layer.CreateNode("Geometry::Null");
            containerNode.SetName(nameObject);
                       
            if (parentNode) {
                parentNode.AddChild(containerNode);
            }
            else {
                augmentaZoneNode.AddChild(containerNode);
            }
        }

        containerNode.SetNodeGraphPosition(parentNode.GetNodeGraphPosition()[0] + offsetGraph/2, augmentaScriptGraphPosition[1] + (currentNodesNames.length + 2) * offsetGraph);
        currentNodesNames.push(nameObject);

        for (var pas2 = 0; pas2 < Object.keys(path2).length; pas2++){            
            var nameObject2 = nameObject + "/" + Object.keys(path2)[pas2];
            findZoneInContainer(path2, nameObject2, pas2, nameObject);
        }
    }

    else {
        Log("This is not a Zone");
        return;
    }
}

function findDeletedZone(node)
{
    zoneToDelete.push(node);

    for (var i = 0; i < currentNodesNames.length; i++) {
        if (node.GetName() == currentNodesNames[i] || node.GetName() == augmentaZoneNodeName) {
            zoneToDelete.pop();
            break;
        }
    }

    var numChildren = node.GetNumChildren();
    if (numChildren > 0) {
        for (var j = 0; j < numChildren; j++) {
            var child = node.GetChild(j);
            findDeletedZone(child);
        }
    }

    return;
}
function deleteNode()
{
    zoneToDelete = [];
    findDeletedZone(augmentaZoneNode);

    for (var k = 0; k < zoneToDelete.length; k++) {
        var node = zoneToDelete[k];

        if (node.GetNumParents() != 0) {
            node.GetParent(0).RemoveChild(node);
        }

        node.DeleteNode();
    }

    return;
}

// Example with one shape with tmp var currentNodeName
function syncShapeNodes(namecur, currentPosition, currentRotation, currentShape, currentSize, parentNodeName)
{
    Log("Synchronizing current Zone");

    var currentNode = layer.FindNode(namecur);
    var parentNode = layer.FindNode(parentNodeName);
    if (currentNode) {
        //Log("Node found")
    } else {
        Log("Node not found, creating node...");
        currentNode = layer.CreateNode("Geometry::Shape 3D");
        currentNode.SetName(namecur);

        if (parentNode) {
            parentNode.AddChild(currentNode);            
        }
        else {
            augmentaZoneNode.AddChild(currentNode);
        }
    }

    currentNode.SetNodeGraphPosition(
        parentNode.GetNodeGraphPosition()[0] + offsetGraph/2, augmentaScriptGraphPosition[1] + (currentNodesNames.length + 2) * offsetGraph);

    Log("Updating node transform");
    
    currentNode.SetFloat('Transform.Rotation Heading', currentRotation[0] * Math.PI / 180);
    currentNode.SetFloat('Transform.Rotation Pitch', currentRotation[1] * Math.PI / 180);
    currentNode.SetFloat('Transform.Rotation Bank', currentRotation[2] * Math.PI / 180);

    Log("Updating node attributes");
    if(currentShape == "Box")
    {
        currentNode.SetFloat('Transform.Position X', currentPosition[0] + currentSize[0] / 2);
        currentNode.SetFloat('Transform.Position Y', currentPosition[1] + currentSize[1] / 2);
        currentNode.SetFloat('Transform.Position Z', currentPosition[2] + currentSize[2] / 2);

        currentNode.SetFloat("Attributes.Shape Type", 1); // 1 is Box
        currentNode.SetFloat('Attributes.Size X', currentSize[0]);
        currentNode.SetFloat('Attributes.Size Y', currentSize[1]);
        currentNode.SetFloat('Attributes.Size Z', currentSize[2]);
    }
    else if (currentShape == "Sphere") {
        currentNode.SetFloat('Transform.Position X', currentPosition[0]);
        currentNode.SetFloat('Transform.Position Y', currentPosition[1]);
        currentNode.SetFloat('Transform.Position Z', currentPosition[2]);

        currentNode.SetFloat("Attributes.Shape Type", 0); // 0 is Sphere
        currentNode.SetFloat('Attributes.Radius', currentSize);
        //currentNode.SetFloat('Attributes.Size Mode', 0);
    }
    else if (currentShape == "Cylinder") {
        currentNode.SetFloat('Transform.Position X', currentPosition[0]);
        currentNode.SetFloat('Transform.Position Y', currentPosition[1]);
        currentNode.SetFloat('Transform.Position Z', currentPosition[2]);

        currentNode.SetFloat("Attributes.Shape Type", 3); // 3 is Cylinder
        currentNode.SetFloat('Attributes.Radius', currentSize[0]);
        currentNode.SetFloat('Attributes.Size Y', currentSize[1]);
        //currentNode.SetFloat('Attributes.Size Mode', 0);
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
