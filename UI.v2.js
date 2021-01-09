
/*
Code for Import https://scriptui.joonas.me — (Triple click to select): 
{"activeId":47,"items":{"item-0":{"id":0,"type":"Dialog","parentId":false,"style":{"text":"Auto TypeSetter","preferredSize":[0,0],"margins":16,"orientation":"row","spacing":10,"alignChildren":["left","top"],"varName":null,"windowType":"Dialog","creationProps":{"su1PanelCoordinates":false,"maximizeButton":false,"minimizeButton":false,"independent":false,"closeButton":true,"borderless":false,"resizeable":false},"enabled":true}},"item-1":{"id":1,"type":"Panel","parentId":20,"style":{"text":"Page Indentifiers","preferredSize":[0,0],"margins":10,"orientation":"column","spacing":10,"alignChildren":["left","top"],"alignment":null,"varName":null,"creationProps":{"borderStyle":"etched","su1PanelCoordinates":false},"enabled":true}},"item-4":{"id":4,"type":"StaticText","parentId":6,"style":{"text":"Start","justify":"left","preferredSize":[0,0],"alignment":null,"varName":null,"helpTip":null,"softWrap":true,"creationProps":{"truncate":"none","multiline":false,"scrolling":false},"enabled":true}},"item-5":{"id":5,"type":"EditText","parentId":6,"style":{"text":"[","preferredSize":[60,0],"alignment":null,"varName":"startIdentifierBox","helpTip":null,"softWrap":false,"creationProps":{"noecho":false,"readonly":false,"multiline":false,"scrollable":false,"borderless":false,"enterKeySignalsOnChange":false},"enabled":true,"justify":"left"}},"item-6":{"id":6,"type":"Group","parentId":1,"style":{"preferredSize":[0,0],"margins":0,"orientation":"row","spacing":10,"alignChildren":["right","center"],"alignment":"center","varName":null,"enabled":true}},"item-9":{"id":9,"type":"Panel","parentId":20,"style":{"text":"Text Formats","preferredSize":[0,0],"margins":10,"orientation":"column","spacing":10,"alignChildren":["left","top"],"alignment":null,"varName":null,"creationProps":{"borderStyle":"etched","su1PanelCoordinates":false},"enabled":true}},"item-19":{"id":19,"type":"Group","parentId":0,"style":{"preferredSize":[0,0],"margins":0,"orientation":"column","spacing":10,"alignChildren":["fill","top"],"alignment":null,"varName":null,"enabled":true}},"item-20":{"id":20,"type":"Group","parentId":0,"style":{"preferredSize":[0,0],"margins":0,"orientation":"column","spacing":10,"alignChildren":["fill","top"],"alignment":null,"varName":null,"enabled":true}},"item-21":{"id":21,"type":"Panel","parentId":19,"style":{"text":"Files","preferredSize":[0,0],"margins":10,"orientation":"column","spacing":10,"alignChildren":["fill","top"],"alignment":null,"varName":null,"creationProps":{"borderStyle":"etched","su1PanelCoordinates":false},"enabled":true}},"item-22":{"id":22,"type":"StaticText","parentId":21,"style":{"text":"Select a Folder including:\n- A '.txt' file containing the text\n- Image Files ('1.png', '2.jpg')\n\n(if you don't select images, \nthe script will run on a open\ndocument)","justify":"left","preferredSize":[0,0],"alignment":null,"varName":null,"helpTip":null,"softWrap":true,"creationProps":{"truncate":"none","multiline":false,"scrolling":false},"enabled":true}},"item-36":{"id":36,"type":"Group","parentId":0,"style":{"preferredSize":[0,0],"margins":0,"orientation":"column","spacing":10,"alignChildren":["fill","top"],"alignment":null,"varName":null,"enabled":true}},"item-37":{"id":37,"type":"Button","parentId":36,"style":{"text":"OK","justify":"center","preferredSize":[0,0],"alignment":null,"varName":"runScript","helpTip":null,"enabled":false}},"item-38":{"id":38,"type":"Button","parentId":36,"style":{"text":"Cancel","justify":"center","preferredSize":[0,0],"alignment":null,"varName":"cancel","helpTip":null,"enabled":true}},"item-40":{"id":40,"type":"Checkbox","parentId":1,"style":{"text":"Ignore Page Number","preferredSize":[0,0],"alignment":null,"varName":"IgnorePageNumberCB","helpTip":"This will ignore or not numbers between both identifiers","enabled":true}},"item-45":{"id":45,"type":"Group","parentId":1,"style":{"preferredSize":[0,0],"margins":0,"orientation":"row","spacing":10,"alignChildren":["right","center"],"alignment":"center","varName":null,"enabled":true}},"item-46":{"id":46,"type":"StaticText","parentId":45,"style":{"text":"End","justify":"left","preferredSize":[0,0],"alignment":null,"varName":"","helpTip":null,"softWrap":true,"creationProps":{"truncate":"none","multiline":false,"scrolling":false},"enabled":true}},"item-47":{"id":47,"type":"EditText","parentId":45,"style":{"text":"]","preferredSize":[60,0],"alignment":null,"varName":"endIdentifierBox","helpTip":null,"softWrap":false,"creationProps":{"noecho":false,"readonly":false,"multiline":false,"scrollable":false,"borderless":false,"enterKeySignalsOnChange":false},"enabled":true,"justify":"left"}},"item-48":{"id":48,"type":"Button","parentId":9,"style":{"enabled":true,"varName":null,"text":"Register JSON","justify":"center","preferredSize":[0,0],"alignment":"fill","helpTip":"Save a JSON with your custom formats to use!  :D"}},"item-49":{"id":49,"type":"Button","parentId":9,"style":{"enabled":true,"varName":null,"text":"Reset With Default","justify":"center","preferredSize":[0,0],"alignment":"fill","helpTip":"This will delete the JSON you registered"}},"item-50":{"id":50,"type":"Button","parentId":9,"style":{"enabled":true,"varName":null,"text":"Open Saved JSON","justify":"center","preferredSize":[0,0],"alignment":"fill","helpTip":"This will open the JSON you already registered"}},"item-51":{"id":51,"type":"Button","parentId":9,"style":{"enabled":true,"varName":null,"text":"Open Default JSON","justify":"center","preferredSize":[0,0],"alignment":"fill","helpTip":"Open default formats JSON and learn to Create your own formats! :D"}},"item-52":{"id":52,"type":"Checkbox","parentId":21,"style":{"enabled":true,"varName":"SelectAllFilesCB","text":"Select All Files Instead","preferredSize":[0,0],"alignment":null,"helpTip":"You need to select all files, not a folder containing these files","checked":true}},"item-53":{"id":53,"type":"StaticText","parentId":21,"style":{"enabled":true,"varName":null,"creationProps":{"truncate":"none","multiline":false,"scrolling":false},"softWrap":true,"text":"Formats Supported","justify":"center","preferredSize":[0,0],"alignment":null,"helpTip":"'.png', '.jpeg', '.jpg', '.psd', '.psb'"}},"item-55":{"id":55,"type":"Button","parentId":21,"style":{"enabled":true,"varName":"selectFilesBtn","text":"Select","justify":"center","preferredSize":[0,0],"alignment":"center","helpTip":null}},"item-56":{"id":56,"type":"StaticText","parentId":19,"style":{"enabled":true,"varName":null,"creationProps":{"truncate":"none","multiline":false,"scrolling":false},"softWrap":true,"text":"Created By \nKrevlinMen and ImSamuka","justify":"left","preferredSize":[0,0],"alignment":null,"helpTip":null}}},"order":[0,20,1,6,4,5,45,46,47,40,9,48,50,51,49,19,21,22,53,52,55,56,36,37,38],"settings":{"importJSON":true,"indentSize":false,"cepExport":false,"includeCSSJS":true,"functionWrapper":false,"compactCode":false,"showDialog":true,"afterEffectsDockable":false,"itemReferenceList":"None"}}
*/

// DIALOG
// ======
var dialog = new Window("dialog");
dialog.text = "Auto TypeSetter";
dialog.orientation = "row";
dialog.alignChildren = ["left", "top"];
dialog.spacing = 10;
dialog.margins = 16;

// GROUP1
// ======
var group1 = dialog.add("group", undefined, { name: "group1" });
group1.orientation = "column";
group1.alignChildren = ["fill", "top"];
group1.spacing = 10;
group1.margins = 0;

// PANEL1
// ======
var panel1 = group1.add("panel", undefined, undefined, { name: "panel1" });
panel1.text = "Page Indentifiers";
panel1.orientation = "column";
panel1.alignChildren = ["left", "top"];
panel1.spacing = 10;
panel1.margins = 10;

// GROUP2
// ======
var group2 = panel1.add("group", undefined, { name: "group2" });
group2.orientation = "row";
group2.alignChildren = ["right", "center"];
group2.spacing = 10;
group2.margins = 0;
group2.alignment = ["center", "top"];

var statictext1 = group2.add("statictext", undefined, undefined, { name: "statictext1" });
statictext1.text = "Start";

var startIdentifierBox = group2.add('edittext {properties: {name: "startIdentifierBox"}}');
startIdentifierBox.text = "[";
startIdentifierBox.preferredSize.width = 60;

// GROUP3
// ======
var group3 = panel1.add("group", undefined, { name: "group3" });
group3.orientation = "row";
group3.alignChildren = ["right", "center"];
group3.spacing = 10;
group3.margins = 0;
group3.alignment = ["center", "top"];

var statictext2 = group3.add("statictext", undefined, undefined, { name: "statictext2" });
statictext2.text = "End";

var endIdentifierBox = group3.add('edittext {properties: {name: "endIdentifierBox"}}');
endIdentifierBox.text = "]";
endIdentifierBox.preferredSize.width = 60;

// PANEL1
// ======
var IgnorePageNumberCB = panel1.add("checkbox", undefined, undefined, { name: "IgnorePageNumberCB" });
IgnorePageNumberCB.helpTip = "This will ignore or not numbers between both identifiers";
IgnorePageNumberCB.text = "Ignore Page Number";

// PANEL2
// ======
var panel2 = group1.add("panel", undefined, undefined, { name: "panel2" });
panel2.text = "Text Formats";
panel2.orientation = "column";
panel2.alignChildren = ["left", "top"];
panel2.spacing = 10;
panel2.margins = 10;

var button1 = panel2.add("button", undefined, undefined, { name: "button1" });
button1.helpTip = "Save a JSON with your custom formats to use!  :D";
button1.text = "Register JSON";
button1.alignment = ["fill", "top"];

var button2 = panel2.add("button", undefined, undefined, { name: "button2" });
button2.helpTip = "This will open the JSON you already registered";
button2.text = "Open Saved JSON";
button2.alignment = ["fill", "top"];

var button3 = panel2.add("button", undefined, undefined, { name: "button3" });
button3.helpTip = "Open default formats JSON and learn to Create your own formats! :D";
button3.text = "Open Default JSON";
button3.alignment = ["fill", "top"];

var button4 = panel2.add("button", undefined, undefined, { name: "button4" });
button4.helpTip = "This will delete the JSON you registered";
button4.text = "Reset With Default";
button4.alignment = ["fill", "top"];

// GROUP4
// ======
var group4 = dialog.add("group", undefined, { name: "group4" });
group4.orientation = "column";
group4.alignChildren = ["fill", "top"];
group4.spacing = 10;
group4.margins = 0;

// PANEL3
// ======
var panel3 = group4.add("panel", undefined, undefined, { name: "panel3" });
panel3.text = "Files";
panel3.orientation = "column";
panel3.alignChildren = ["fill", "top"];
panel3.spacing = 10;
panel3.margins = 10;

var statictext3 = panel3.add("group");
statictext3.orientation = "column";
statictext3.alignChildren = ["left", "center"];
statictext3.spacing = 0;

statictext3.add("statictext", undefined, "Select a Folder including:", { name: "statictext3" });
statictext3.add("statictext", undefined, "- A '.txt' file containing the text", { name: "statictext3" });
statictext3.add("statictext", undefined, "- Image Files ('1.png', '2.jpg') ", { name: "statictext3" });
statictext3.add("statictext", undefined, "", { name: "statictext3" });
statictext3.add("statictext", undefined, "(if you don't select images, ", { name: "statictext3" });
statictext3.add("statictext", undefined, "the script will run on a open", { name: "statictext3" });
statictext3.add("statictext", undefined, "document)", { name: "statictext3" });

var statictext4 = panel3.add("statictext", undefined, undefined, { name: "statictext4" });
statictext4.helpTip = "'.png', '.jpeg', '.jpg', '.psd', '.psb'";
statictext4.text = "Formats Supported";
statictext4.justify = "center";

var SelectAllFilesCB = panel3.add("checkbox", undefined, undefined, { name: "SelectAllFilesCB" });
SelectAllFilesCB.helpTip = "You need to select all files, not a folder containing these files";
SelectAllFilesCB.text = "Select All Files Instead";

var selectFilesBtn = panel3.add("button", undefined, undefined, { name: "selectFilesBtn" });
selectFilesBtn.text = "Select";
selectFilesBtn.alignment = ["center", "top"];

// GROUP4
// ======
var statictext5 = group4.add("group");
statictext5.orientation = "column";
statictext5.alignChildren = ["left", "center"];
statictext5.spacing = 0;

statictext5.add("statictext", undefined, "Created By ", { name: "statictext5" });
statictext5.add("statictext", undefined, "KrevlinMen and ImSamuka", { name: "statictext5" });

// GROUP5
// ======
var group5 = dialog.add("group", undefined, { name: "group5" });
group5.orientation = "column";
group5.alignChildren = ["fill", "top"];
group5.spacing = 10;
group5.margins = 0;

var runScript = group5.add("button", undefined, undefined, { name: "runScript" });
runScript.enabled = false;
runScript.text = "OK";

var cancel = group5.add("button", undefined, undefined, { name: "cancel" });
cancel.text = "Cancel";

dialog.show();

