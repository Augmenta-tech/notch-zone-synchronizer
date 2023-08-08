// input var
var SyncZones;

// global var
var layer;
var augmentaScriptNode;
var augmentaScriptNodeName = "Augmenta zone synchronizer";
var augmentaScriptGraphPosition;
var augmentaZoneNode;
var augmentaZoneNodeName = "Augmenta zones";
var offsetGraph = 50;

// tmp var for example
var currentZoneName = "testZone";

// Json
req = { method: 'GET' };
//NFetch("https://exampleapi.notch.one/tests/getJSON", req, getJSON);
NFetch("http://localhost:20000", req, getJSON);
var load;

function Init()
{
	Log("Augmenta zones synchronizer v0.1");
    layer = Document.GetLayer(0);
    augmentaScriptNode = layer.FindNode(augmentaScriptNodeName);
    Initialize();
}

function Initialize()
{
    SyncZones = 0;
    augmentaScriptNode.SetFloat('Input Parameters.SyncZones', SyncZones);
    // Get augmenta script node Graph position
    augmentaScriptGraphPosition = augmentaScriptNode.GetNodeGraphPosition();

    // Create augmenta null node
    currentNode = layer.FindNode(augmentaZoneNodeName);
    if(currentNode)
    {
        //Log("Augmenta zones node found")
    } else {
        Log("Augmenta zones node not found, creating node...");
        currentNode = layer.CreateNode("Geometry::Null");
        currentNode.SetName(augmentaZoneNodeName);
    }
    currentNode.SetNodeGraphPosition(augmentaScriptGraphPosition[0], augmentaScriptGraphPosition[1] + offsetGraph);
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
    getJSON(load);
    syncShapeNode();
    augmentaScriptNode.SetFloat('Input Parameters.SyncZones', 0);
}

function getJSON(response)
{
    if (response && response.ok && response.status === 200)
    {
        json = response.json();
        if(json) {
            Log("Json load received");
        } else {
            Log("Did not receive Json load !");
        }
        // TODO : Parsing all zones and their name
        Log(currentZoneName);
        var currentPosition = json['CONTENTS']['worlds']['CONTENTS']['world']['CONTENTS']['children']['CONTENTS']['scene']['CONTENTS']['children']['CONTENTS']
            [currentZoneName]['CONTENTS']['position']['VALUE'];
        Log(currentPosition);
        var currentRotation = json['CONTENTS']['worlds']['CONTENTS']['world']['CONTENTS']['children']['CONTENTS']['scene']['CONTENTS']['children']['CONTENTS']
            [currentZoneName]['CONTENTS']['rotation']['VALUE'];
        Log(currentRotation);
        var currentShape = json['CONTENTS']['worlds']['CONTENTS']['world']['CONTENTS']['children']['CONTENTS']['scene']['CONTENTS']['children']['CONTENTS']
            [currentZoneName]['CONTENTS']['shape']['VALUE'];
        Log(currentShape);
        if(currentShape == "Box")
        {
            var currentScale = json['CONTENTS']['worlds']['CONTENTS']['world']['CONTENTS']['children']['CONTENTS']['scene']['CONTENTS']['children']['CONTENTS']
            [currentZoneName]['CONTENTS']['box']['CONTENTS']['boxSize']['VALUE'];
            Log(currentScale);
        } else {
            Log("not a box");
        }
         
    } else {
        Log("Did not receive Json load !"); 
    }
}

// Example with one shape with tmp var currentNodeName
function syncShapeNode()
{
    // Get current node position to place shapes node below
    augmentaScriptGraphPosition = augmentaScriptNode.GetNodeGraphPosition();
    Log("Synchronizing current Zone");
    currentNode = layer.FindNode(currentZoneName);
    if(currentNode)
    {
        Log("Node found")
    } else {
        Log("Node not found, creating node...");
        currentNode = layer.CreateNode("Geometry::Shape 3D");
        currentNode.SetName(currentNodeName);
        augmentaZoneNode.AddChild(currentNode);
    }
    currentNode.SetNodeGraphPosition(
        augmentaScriptGraphPosition[0], augmentaScriptGraphPosition[1] + 2*offsetGraph);
    Log("Updating node transform");
    currentNode.SetFloat('Transform.Position X', 1.3);
    // Warning : Looks like there is a value transformation for rotation
    currentNode.SetFloat('Transform.Rotation Heading', 1.3);
    currentNode.SetFloat('Transform.Scale X', 1.3);
    Log("Updating node attributes");
    currentNode.SetFloat("Attributes.Shape Type", 1); // 1 is Box
}

// Do we want this ?
function OnKeyPress(key)
{
    if (key == 'r')
    {
        Log("You pressed key r ! Starting Augmenta zone sync...")
        syncZones();
    }
}
