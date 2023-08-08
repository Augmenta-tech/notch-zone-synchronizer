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
var currentNodeName = "myBoxZone";

// Json
req = { method: 'GET' };
NFetch("https://exampleapi.notch.one/tests/getJSON", req, getJSON);
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
        /* When calling SyncZones by changing value, it triggers a lot of json
        requests and only the first one succeeds, to fix that behavior, one approach
        would be to call a singleton timer instead. Could not figure out how to make
        it work yet */
        //Timer(1.0, syncZones, false);
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

// Example with notch http json
function getJSON(response)
{
    if (response.ok && response.status === 200)
    {
        json = response.json();
        Log(json);
        Log(json['elementExamples']['ex_unicodeStr']);
        Log(json['elementExamples']['ex_string']);
        Log(json['elementExamples']['ex_integer']);
        Log(json['elementExamples']['ex_float']);
    }
}

// Example with one shape with tmp var currentNodeName
function syncShapeNode()
{
    Log("Synchronizing current Node");
    // Get current node position to place shapes node below
    augmentaScriptGraphPosition = augmentaScriptNode.GetNodeGraphPosition();
    currentNode = layer.FindNode(currentNodeName);
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
