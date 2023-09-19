// input var
var SyncZones;
var RemoteAddress;
var RemotePort;
var WorldName;
var AugmentaScriptNodeName;
var SceneName;

// global var
var layer;
var augmentaScriptNode;
var augmentaScriptGraphPosition;
var augmentaZoneNode;
var isInitialize = false;
var currentNodesNames = [];
var zoneToDelete = [];
var offsetGraph = 60;
var containerNumber = 0;

function Init()
{
    Log("Augmenta zones synchronizer v0.1");
}

function Initialize()
{
    for (var i = 0; i < Document.GetNumLayers(); i++) {
        layer = Document.GetLayer(i);
        augmentaScriptNode = layer.FindNode(AugmentaScriptNodeName);
        Log(AugmentaScriptNodeName);
        if (augmentaScriptNode) break;
    }

    if (!augmentaScriptNode) {
        Log("No layer found with the Augmenta zone synchronizer");
        return;
    }

    // Get augmenta script node Graph position
    augmentaScriptGraphPosition = augmentaScriptNode.GetNodeGraphPosition();

    // Create augmenta null node
    augmentaZoneNode = layer.FindNode(SceneName);
    if (augmentaZoneNode) {
        //Log("Augmenta zones node found")
    } else {
        Log("Augmenta zones node not found, creating node...");
        augmentaZoneNode = layer.CreateNode("Geometry::Null");
        augmentaZoneNode.SetName(SceneName);
    }

    augmentaZoneNode.SetNodeGraphPosition(augmentaScriptGraphPosition[0], augmentaScriptGraphPosition[1] + offsetGraph);

    isInitialize = true;
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
    if (!isInitialize || !layer.FindNode(SceneName)) Initialize();
    else augmentaZoneNode.SetNodeGraphPosition(augmentaScriptGraphPosition[0], augmentaScriptGraphPosition[1] + offsetGraph);
    
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

            var currentPosition = json.CONTENTS.worlds.CONTENTS[WorldName].CONTENTS.children.CONTENTS.scene.CONTENTS.position.VALUE;
            var currentRotation = json.CONTENTS.worlds.CONTENTS[WorldName].CONTENTS.children.CONTENTS.scene.CONTENTS.rotation.VALUE;

            augmentaZoneNode.SetFloat('Transform.Position X', currentPosition[0]);
            augmentaZoneNode.SetFloat('Transform.Position Y', currentPosition[1]);
            augmentaZoneNode.SetFloat('Transform.Position Z', currentPosition[2]);

            augmentaZoneNode.SetFloat('Transform.Rotation Heading', currentRotation[1] * Math.PI / 180);
            augmentaZoneNode.SetFloat('Transform.Rotation Pitch', currentRotation[0] * Math.PI / 180);
            augmentaZoneNode.SetFloat('Transform.Rotation Bank', currentRotation[2] * Math.PI / 180);

            currentNodesNames = [];
            containerNumber = 0;
            var path = json.CONTENTS.worlds.CONTENTS[WorldName].CONTENTS.children.CONTENTS.scene.CONTENTS.children.CONTENTS;

            for (var pas = 0; pas < Object.keys(path).length; pas++) {
                var nameObject = SceneName + "/" + Object.keys(path)[pas];

                findZoneInContainer(path, nameObject, pas, SceneName);
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

    else if (currentType == "Container" || currentType == "MultiZone") {
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

        var currentPosition = path[currentName].CONTENTS.position.VALUE;
        var currentRotation = path[currentName].CONTENTS.rotation.VALUE;

        containerNode.SetNodeGraphPosition(parentNode.GetNodeGraphPosition()[0] + offsetGraph / 2, augmentaScriptGraphPosition[1] + (containerNumber + 2) * offsetGraph);

        containerNode.SetFloat('Transform.Position X', currentPosition[0]);
        containerNode.SetFloat('Transform.Position Y', currentPosition[1]);
        containerNode.SetFloat('Transform.Position Z', currentPosition[2]);

        containerNode.SetFloat('Transform.Rotation Heading', currentRotation[1] * Math.PI / 180);
        containerNode.SetFloat('Transform.Rotation Pitch', currentRotation[0] * Math.PI / 180);
        containerNode.SetFloat('Transform.Rotation Bank', currentRotation[2] * Math.PI / 180);

        currentNodesNames.push(nameObject);
        containerNumber++;

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
        if (node.GetName() == currentNodesNames[i] || node.GetName() == SceneName) {
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
        var currentShapeNode = currentNode.GetChild(0);
    } else {
        Log("Node not found, creating node...");
        currentNode = layer.CreateNode("Geometry::Null");
        currentNode.SetName(namecur);
        currentShapeNode = layer.CreateNode("Geometry::Shape 3D");
        currentShapeNode.SetName(namecur + " shape");
        currentNode.AddChild(currentShapeNode);

        if (parentNode) {
            parentNode.AddChild(currentNode);
        }
        else {
            augmentaZoneNode.AddChild(currentNode);
            Log(augmentaZoneNode.getName());
        }
    }

    currentNode.SetNodeGraphPosition(
        parentNode.GetNodeGraphPosition()[0] + offsetGraph / 2, augmentaScriptGraphPosition[1] + (containerNumber + 2) * offsetGraph);
    currentShapeNode.SetNodeGraphPosition(
        parentNode.GetNodeGraphPosition()[0] + offsetGraph * 4, augmentaScriptGraphPosition[1] + (containerNumber + 2) * offsetGraph);

    Log("Updating node transform");

    currentNode.SetFloat('Transform.Position X', currentPosition[0]);
    currentNode.SetFloat('Transform.Position Y', currentPosition[1]);
    currentNode.SetFloat('Transform.Position Z', currentPosition[2]);
    
    currentNode.SetFloat('Transform.Rotation Heading', currentRotation[1] * Math.PI / 180);
    currentNode.SetFloat('Transform.Rotation Pitch', currentRotation[0] * Math.PI / 180);
    currentNode.SetFloat('Transform.Rotation Bank', currentRotation[2] * Math.PI / 180);

    Log("Updating node attributes");
    if(currentShape == "Box")
    {
        currentShapeNode.SetFloat('Transform.Position X', currentSize[0] / 2);
        currentShapeNode.SetFloat('Transform.Position Y', currentSize[1] / 2);
        currentShapeNode.SetFloat('Transform.Position Z', currentSize[2] / 2);

        currentShapeNode.SetFloat("Attributes.Shape Type", 1); // 1 is Box
        currentShapeNode.SetFloat('Attributes.Size X', currentSize[0]);
        currentShapeNode.SetFloat('Attributes.Size Y', currentSize[1]);
        currentShapeNode.SetFloat('Attributes.Size Z', currentSize[2]);
    }
    else if (currentShape == "Sphere") {
        //currentShapeNode.SetFloat('Transform.Position X', currentPosition[0]);
        //currentShapeNode.SetFloat('Transform.Position Y', currentPosition[1]);
        //currentShapeNode.SetFloat('Transform.Position Z', currentPosition[2]);

        currentShapeNode.SetFloat("Attributes.Shape Type", 0); // 0 is Sphere
        currentShapeNode.SetFloat('Attributes.Radius', currentSize);
        currentShapeNode.SetFloat('Attributes.Size Mode', 0);
    }
    else if (currentShape == "Cylinder") {
        //currentShapeNode.SetFloat('Transform.Position X', currentPosition[0]);
        currentShapeNode.SetFloat('Transform.Position Y', currentSize[1] / 2);
        //currentShapeNode.SetFloat('Transform.Position Z', currentPosition[2]);

        currentShapeNode.SetFloat("Attributes.Shape Type", 3); // 3 is Cylinder
        currentShapeNode.SetFloat('Attributes.Radius', currentSize[0]);
        currentShapeNode.SetFloat('Attributes.Size Y', currentSize[1] / 2);
        currentShapeNode.SetFloat('Attributes.Size Mode', 0);
    } else {
        //Log("test is not a box");
    }

    currentNode.SetVisible(false);

    currentNodesNames.push(namecur);
    currentNodesNames.push(namecur + " shape");
    containerNumber++;

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
