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
var currentPosition;
var currentRotation;
var currentShape;
var currentScale;


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
    
    // Json request and callback
    req = { method: 'GET' };
    //NFetch("https://exampleapi.notch.one/tests/getJSON", req, getJSON);
    NFetch("http://localhost:20000", req, getJSON);
    
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

            // TODO : Parsing all zones and their name
            Log(currentZoneName);
            currentPosition = json['CONTENTS']['worlds']['CONTENTS']['world']['CONTENTS']['children']['CONTENTS']['scene']['CONTENTS']['children']['CONTENTS']
                [currentZoneName]['CONTENTS']['position']['VALUE'];
            //Log(currentPosition);
            currentRotation = json['CONTENTS']['worlds']['CONTENTS']['world']['CONTENTS']['children']['CONTENTS']['scene']['CONTENTS']['children']['CONTENTS']
                [currentZoneName]['CONTENTS']['rotation']['VALUE'];
            //Log(currentRotation);
            var currentShape = json['CONTENTS']['worlds']['CONTENTS']['world']['CONTENTS']['children']['CONTENTS']['scene']['CONTENTS']['children']['CONTENTS']
                [currentZoneName]['CONTENTS']['shape']['VALUE'];
            //Log(currentShape);
            if(currentShape == "Box")
            {
                currentScale = json['CONTENTS']['worlds']['CONTENTS']['world']['CONTENTS']['children']['CONTENTS']['scene']['CONTENTS']['children']['CONTENTS']
                [currentZoneName]['CONTENTS']['box']['CONTENTS']['boxSize']['VALUE'];
                //Log(currentScale);
            } else {
                Log("not a box");
            }
            // Creating/updating Notch shape nodes
            syncShapeNodes();
        } else {
            Log("Did not receive Json load !");
        }
    } else {
        Log("Did not receive Json load !"); 
    }
    return;
}

// Example with one shape with tmp var currentNodeName
function syncShapeNodes()
{
    Log("Synchronizing current Zone");
    currentNode = layer.FindNode(currentZoneName);
    if(currentNode)
    {
        Log("Node found")
    } else {
        Log("Node not found, creating node...");
        currentNode = layer.CreateNode("Geometry::Shape 3D");
        currentNode.SetName(currentZoneName);
        augmentaZoneNode.AddChild(currentNode);
    }
    currentNode.SetNodeGraphPosition(
        augmentaScriptGraphPosition[0], augmentaScriptGraphPosition[1] + 2*offsetGraph);
    Log("Updating node transform");
    currentNode.SetFloat('Transform.Position X', currentPosition[0]);
    currentNode.SetFloat('Transform.Position Y', currentPosition[1]);
    currentNode.SetFloat('Transform.Position Z', currentPosition[2]);
    // Warning : Looks like there is a value transformation for rotation
    currentNode.SetFloat('Transform.Rotation Heading', currentRotation[0]);
    currentNode.SetFloat('Transform.Rotation Pitch', currentRotation[1]);
    currentNode.SetFloat('Transform.Rotation Bank', currentRotation[2]);
    currentNode.SetFloat('Transform.Scale X', currentScale[0]);
    currentNode.SetFloat('Transform.Scale Y', currentScale[1]);
    currentNode.SetFloat('Transform.Scale Z', currentScale[2]);

    Log("Updating node attributes");
    if(currentShape == "Box")
    {
        Log("test is a box");
        currentNode.SetFloat("Attributes.Shape Type", 1); // 1 is Box
    }
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
