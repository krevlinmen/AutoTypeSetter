/*
  Code for Import https://scriptui.joonas.me — (Triple click to select): 
  {"activeId":0,"items":{"item-0":{"id":0,"type":"Dialog","parentId":false,"style":{"enabled":true,"varName":null,"windowType":"Window","creationProps":{"su1PanelCoordinates":false,"maximizeButton":false,"minimizeButton":false,"independent":false,"closeButton":true,"borderless":false,"resizeable":false},"text":"AutoTypeSetting","preferredSize":[500,400],"margins":16,"orientation":"column","spacing":10,"alignChildren":["center","top"]}},"item-1":{"id":1,"type":"EditText","parentId":3,"style":{"enabled":true,"varName":"identifier_Start","creationProps":{"noecho":false,"readonly":false,"multiline":false,"scrollable":false,"borderless":false,"enterKeySignalsOnChange":false},"softWrap":false,"text":"[","justify":"left","preferredSize":[50,0],"alignment":null,"helpTip":null}},"item-2":{"id":2,"type":"StaticText","parentId":3,"style":{"enabled":true,"varName":"","creationProps":{"truncate":"none","multiline":false,"scrolling":false},"softWrap":false,"text":"Identifier in Start","justify":"left","preferredSize":[0,0],"alignment":null,"helpTip":null}},"item-3":{"id":3,"type":"Group","parentId":4,"style":{"enabled":true,"varName":"","preferredSize":[0,0],"margins":0,"orientation":"row","spacing":10,"alignChildren":["left","center"],"alignment":"fill"}},"item-4":{"id":4,"type":"Panel","parentId":0,"style":{"enabled":true,"varName":null,"creationProps":{"borderStyle":"etched","su1PanelCoordinates":false},"text":"Page Indentifiers","preferredSize":[0,0],"margins":10,"orientation":"column","spacing":10,"alignChildren":["left","top"],"alignment":null}},"item-5":{"id":5,"type":"Group","parentId":4,"style":{"enabled":true,"varName":null,"preferredSize":[0,0],"margins":0,"orientation":"row","spacing":10,"alignChildren":["right","center"],"alignment":"fill"}},"item-6":{"id":6,"type":"StaticText","parentId":5,"style":{"enabled":true,"varName":null,"creationProps":{"truncate":"none","multiline":false,"scrolling":false},"softWrap":false,"text":"Identifier in End","justify":"left","preferredSize":[0,0],"alignment":null,"helpTip":null}},"item-7":{"id":7,"type":"EditText","parentId":5,"style":{"enabled":true,"varName":"identifier_End","creationProps":{"noecho":false,"readonly":false,"multiline":false,"scrollable":false,"borderless":false,"enterKeySignalsOnChange":false},"softWrap":false,"text":"]","justify":"left","preferredSize":[50,0],"alignment":null,"helpTip":null}},"item-8":{"id":8,"type":"Divider","parentId":4,"style":{"enabled":true,"varName":null}},"item-10":{"id":10,"type":"Checkbox","parentId":4,"style":{"enabled":true,"varName":"ignorePageNumber","text":"Ignore Page Number","preferredSize":[0,0],"alignment":"center","helpTip":"This will ignore or not numbers between both identifiers","checked":false}},"item-11":{"id":11,"type":"Button","parentId":15,"style":{"enabled":true,"varName":"close","text":"Cancel","justify":"center","preferredSize":[0,0],"alignment":null,"helpTip":null}},"item-12":{"id":12,"type":"Button","parentId":15,"style":{"enabled":true,"varName":"runScript","text":"Execute","justify":"center","preferredSize":[0,0],"alignment":null,"helpTip":null}},"item-13":{"id":13,"type":"Progressbar","parentId":0,"style":{"enabled":true,"varName":"progressBar","preferredSize":[0,15],"alignment":"fill","helpTip":null}},"item-15":{"id":15,"type":"Group","parentId":0,"style":{"enabled":true,"varName":null,"preferredSize":[0,0],"margins":0,"orientation":"row","spacing":10,"alignChildren":["left","center"],"alignment":null}},"item-16":{"id":16,"type":"StaticText","parentId":0,"style":{"enabled":true,"varName":null,"creationProps":{"truncate":"none","multiline":false,"scrolling":false},"softWrap":false,"text":"by KrevlinMen and ImSamuka","justify":"left","preferredSize":[0,0],"alignment":"right","helpTip":null}},"item-17":{"id":17,"type":"Panel","parentId":0,"style":{"enabled":true,"varName":null,"creationProps":{"borderStyle":"etched","su1PanelCoordinates":false},"text":"Files","preferredSize":[0,0],"margins":10,"orientation":"column","spacing":10,"alignChildren":["center","top"],"alignment":null}},"item-18":{"id":18,"type":"Group","parentId":17,"style":{"enabled":true,"varName":null,"preferredSize":[0,0],"margins":0,"orientation":"row","spacing":10,"alignChildren":["left","center"],"alignment":null}},"item-20":{"id":20,"type":"EditText","parentId":18,"style":{"enabled":true,"varName":null,"creationProps":{"noecho":false,"readonly":false,"multiline":false,"scrollable":false,"borderless":false,"enterKeySignalsOnChange":false},"softWrap":false,"text":"...","justify":"left","preferredSize":[0,0],"alignment":null,"helpTip":null}},"item-21":{"id":21,"type":"Group","parentId":17,"style":{"enabled":true,"varName":null,"preferredSize":[0,0],"margins":0,"orientation":"column","spacing":10,"alignChildren":["center","center"],"alignment":null}},"item-22":{"id":22,"type":"Panel","parentId":21,"style":{"enabled":true,"varName":null,"creationProps":{"borderStyle":"etched","su1PanelCoordinates":false},"text":"Files Found","preferredSize":[0,0],"margins":10,"orientation":"column","spacing":10,"alignChildren":["center","top"],"alignment":null}},"item-23":{"id":23,"type":"Checkbox","parentId":18,"style":{"enabled":true,"varName":null,"text":"Folder Directory","preferredSize":[0,0],"alignment":null,"helpTip":null,"checked":true}},"item-24":{"id":24,"type":"Panel","parentId":0,"style":{"enabled":true,"varName":null,"creationProps":{"borderStyle":"etched","su1PanelCoordinates":false},"text":"Text Format","preferredSize":[0,0],"margins":10,"orientation":"column","spacing":10,"alignChildren":["center","top"],"alignment":null}},"item-25":{"id":25,"type":"Group","parentId":24,"style":{"enabled":true,"varName":null,"preferredSize":[0,0],"margins":0,"orientation":"row","spacing":10,"alignChildren":["left","center"],"alignment":null}},"item-26":{"id":26,"type":"StaticText","parentId":25,"style":{"enabled":true,"varName":null,"creationProps":{"truncate":"none","multiline":false,"scrolling":false},"softWrap":false,"text":"Font","justify":"left","preferredSize":[0,0],"alignment":null,"helpTip":null}},"item-28":{"id":28,"type":"Group","parentId":24,"style":{"enabled":true,"varName":null,"preferredSize":[0,0],"margins":0,"orientation":"row","spacing":11,"alignChildren":["center","center"],"alignment":"fill"}},"item-29":{"id":29,"type":"StaticText","parentId":28,"style":{"enabled":true,"varName":null,"creationProps":{"truncate":"none","multiline":false,"scrolling":false},"softWrap":false,"text":"Font size","justify":"left","preferredSize":[0,0],"alignment":null,"helpTip":null}},"item-31":{"id":31,"type":"Group","parentId":24,"style":{"enabled":true,"varName":null,"preferredSize":[0,0],"margins":0,"orientation":"row","spacing":10,"alignChildren":["left","center"],"alignment":null}},"item-34":{"id":34,"type":"Group","parentId":24,"style":{"enabled":true,"varName":null,"preferredSize":[0,0],"margins":0,"orientation":"row","spacing":10,"alignChildren":["left","center"],"alignment":null}},"item-35":{"id":35,"type":"StaticText","parentId":34,"style":{"enabled":true,"varName":null,"creationProps":{"truncate":"none","multiline":false,"scrolling":false},"softWrap":false,"text":"Justification","justify":"left","preferredSize":[0,0],"alignment":null,"helpTip":null}},"item-37":{"id":37,"type":"Checkbox","parentId":31,"style":{"enabled":true,"varName":null,"text":"Bounding Text Box","preferredSize":[0,0],"alignment":null,"helpTip":null,"checked":true}},"item-40":{"id":40,"type":"Checkbox","parentId":34,"style":{"enabled":true,"varName":null,"text":"Justified","preferredSize":[0,0],"alignment":null,"helpTip":null,"checked":false}},"item-41":{"id":41,"type":"Divider","parentId":0,"style":{"enabled":true,"varName":""}},"item-42":{"id":42,"type":"Divider","parentId":0,"style":{"enabled":true,"varName":null}},"item-43":{"id":43,"type":"DropDownList","parentId":25,"style":{"enabled":true,"varName":null,"text":"DropDownList","listItems":"font1,font2,font3","preferredSize":[0,0],"alignment":null,"selection":0,"helpTip":null}},"item-44":{"id":44,"type":"Slider","parentId":28,"style":{"enabled":true,"varName":null,"preferredSize":[0,0],"alignment":"fill","helpTip":null}},"item-45":{"id":45,"type":"EditText","parentId":28,"style":{"enabled":true,"varName":null,"creationProps":{"noecho":false,"readonly":false,"multiline":false,"scrollable":false,"borderless":false,"enterKeySignalsOnChange":false},"softWrap":false,"text":"16","justify":"left","preferredSize":[0,0],"alignment":null,"helpTip":null}},"item-46":{"id":46,"type":"StaticText","parentId":22,"style":{"enabled":true,"varName":null,"creationProps":{"truncate":"none","multiline":true,"scrolling":true},"softWrap":false,"text":"File1.jpg\nFile2.jpg\nFile3.txt","justify":"left","preferredSize":[0,0],"alignment":null,"helpTip":null}},"item-47":{"id":47,"type":"Group","parentId":17,"style":{"enabled":true,"varName":"","preferredSize":[0,0],"margins":0,"orientation":"row","spacing":10,"alignChildren":["left","center"],"alignment":null}},"item-48":{"id":48,"type":"Checkbox","parentId":47,"style":{"enabled":true,"varName":null,"text":"File Directory","preferredSize":[0,0],"alignment":null,"helpTip":null}},"item-49":{"id":49,"type":"EditText","parentId":47,"style":{"enabled":true,"varName":null,"creationProps":{"noecho":false,"readonly":false,"multiline":false,"scrollable":false,"borderless":false,"enterKeySignalsOnChange":false},"softWrap":false,"text":"...","justify":"left","preferredSize":[0,0],"alignment":null,"helpTip":null}},"item-50":{"id":50,"type":"DropDownList","parentId":34,"style":{"enabled":true,"varName":null,"text":"DropDownList","listItems":"Left, Center, Right","preferredSize":[0,0],"alignment":null,"selection":1,"helpTip":null}}},"order":[0,4,3,2,1,5,6,7,8,10,17,18,23,20,47,48,49,21,22,46,24,25,26,43,28,29,44,45,31,37,34,35,50,40,15,11,12,41,13,42,16],"settings":{"importJSON":true,"indentSize":false,"cepExport":false,"includeCSSJS":true,"showDialog":true,"functionWrapper":false,"afterEffectsDockable":false,"itemReferenceList":"None"}}
  */

// WIN
// ===
this.win = new Window("window");
this.win.text = "AutoTypeSetting";
this.win.preferredSize.width = 500;
this.win.preferredSize.height = 400;
this.win.orientation = "column";
this.win.alignChildren = ["center", "top"];
this.win.spacing = 10;
this.win.margins = 16;

// PANEL1
// ======
var panel1 = this.win.add("panel", undefined, undefined, { name: "panel1" });
panel1.text = "Page Indentifiers";
panel1.orientation = "column";
panel1.alignChildren = ["left", "top"];
panel1.spacing = 10;
panel1.margins = 10;

// GROUP1
// ======
var group1 = panel1.add("group", undefined, { name: "group1" });
group1.orientation = "row";
group1.alignChildren = ["left", "center"];
group1.spacing = 10;
group1.margins = 0;
group1.alignment = ["fill", "top"];

var statictext1 = group1.add("statictext", undefined, undefined, { name: "statictext1" });
statictext1.text = "Identifier in Start";

var identifier_Start = group1.add('edittext {properties: {name: "identifier_Start"}}');
identifier_Start.text = "[";
identifier_Start.preferredSize.width = 50;

// GROUP2
// ======
var group2 = panel1.add("group", undefined, { name: "group2" });
group2.orientation = "row";
group2.alignChildren = ["right", "center"];
group2.spacing = 10;
group2.margins = 0;
group2.alignment = ["fill", "top"];

var statictext2 = group2.add("statictext", undefined, undefined, { name: "statictext2" });
statictext2.text = "Identifier in End";

var identifier_End = group2.add('edittext {properties: {name: "identifier_End"}}');
identifier_End.text = "]";
identifier_End.preferredSize.width = 50;

// PANEL1
// ======
var divider1 = panel1.add("panel", undefined, undefined, { name: "divider1" });
divider1.alignment = "fill";

var ignorePageNumber = panel1.add("checkbox", undefined, undefined, { name: "ignorePageNumber" });
ignorePageNumber.helpTip = "This will ignore or not numbers between both identifiers";
ignorePageNumber.text = "Ignore Page Number";
ignorePageNumber.alignment = ["center", "top"];

// PANEL2
// ======
var panel2 = this.win.add("panel", undefined, undefined, { name: "panel2" });
panel2.text = "Files";
panel2.orientation = "column";
panel2.alignChildren = ["center", "top"];
panel2.spacing = 10;
panel2.margins = 10;

// GROUP3
// ======
var group3 = panel2.add("group", undefined, { name: "group3" });
group3.orientation = "row";
group3.alignChildren = ["left", "center"];
group3.spacing = 10;
group3.margins = 0;

var checkbox1 = group3.add("checkbox", undefined, undefined, { name: "checkbox1" });
checkbox1.text = "Folder Directory";
checkbox1.value = true;

var edittext1 = group3.add('edittext {properties: {name: "edittext1"}}');
edittext1.text = "...";

// GROUP4
// ======
var group4 = panel2.add("group", undefined, { name: "group4" });
group4.orientation = "row";
group4.alignChildren = ["left", "center"];
group4.spacing = 10;
group4.margins = 0;

var checkbox2 = group4.add("checkbox", undefined, undefined, { name: "checkbox2" });
checkbox2.text = "File Directory";

var edittext2 = group4.add('edittext {properties: {name: "edittext2"}}');
edittext2.text = "...";

// GROUP5
// ======
var group5 = panel2.add("group", undefined, { name: "group5" });
group5.orientation = "column";
group5.alignChildren = ["center", "center"];
group5.spacing = 10;
group5.margins = 0;

// PANEL3
// ======
var panel3 = group5.add("panel", undefined, undefined, { name: "panel3" });
panel3.text = "Files Found";
panel3.orientation = "column";
panel3.alignChildren = ["center", "top"];
panel3.spacing = 10;
panel3.margins = 10;

var statictext3 = panel3.add("group");
statictext3.orientation = "column";
statictext3.alignChildren = ["left", "center"];
statictext3.spacing = 0;

statictext3.add("statictext", undefined, "File1.jpg", { name: "statictext3", multiline: true, scrolling: true });
statictext3.add("statictext", undefined, "File2.jpg", { name: "statictext3", multiline: true, scrolling: true });
statictext3.add("statictext", undefined, "File3.txt", { name: "statictext3", multiline: true, scrolling: true });

// PANEL4
// ======
var panel4 = this.win.add("panel", undefined, undefined, { name: "panel4" });
panel4.text = "Text Format";
panel4.orientation = "column";
panel4.alignChildren = ["center", "top"];
panel4.spacing = 10;
panel4.margins = 10;

// GROUP6
// ======
var group6 = panel4.add("group", undefined, { name: "group6" });
group6.orientation = "row";
group6.alignChildren = ["left", "center"];
group6.spacing = 10;
group6.margins = 0;

var statictext4 = group6.add("statictext", undefined, undefined, { name: "statictext4" });
statictext4.text = "Font";

var dropdown1_array = ["font1", "font2", "font3"];
var dropdown1 = group6.add("dropdownlist", undefined, undefined, { name: "dropdown1", items: dropdown1_array });
dropdown1.selection = 0;

// GROUP7
// ======
var group7 = panel4.add("group", undefined, { name: "group7" });
group7.orientation = "row";
group7.alignChildren = ["center", "center"];
group7.spacing = 11;
group7.margins = 0;
group7.alignment = ["fill", "top"];

var statictext5 = group7.add("statictext", undefined, undefined, { name: "statictext5" });
statictext5.text = "Font size";

var slider1 = group7.add("slider", undefined, undefined, undefined, undefined, { name: "slider1" });
slider1.minvalue = 0;
slider1.maxvalue = 100;
slider1.value = 50;
slider1.alignment = ["center", "fill"];

var edittext3 = group7.add('edittext {properties: {name: "edittext3"}}');
edittext3.text = "16";

// GROUP8
// ======
var group8 = panel4.add("group", undefined, { name: "group8" });
group8.orientation = "row";
group8.alignChildren = ["left", "center"];
group8.spacing = 10;
group8.margins = 0;

var checkbox3 = group8.add("checkbox", undefined, undefined, { name: "checkbox3" });
checkbox3.text = "Bounding Text Box";
checkbox3.value = true;

// GROUP9
// ======
var group9 = panel4.add("group", undefined, { name: "group9" });
group9.orientation = "row";
group9.alignChildren = ["left", "center"];
group9.spacing = 10;
group9.margins = 0;

var statictext6 = group9.add("statictext", undefined, undefined, { name: "statictext6" });
statictext6.text = "Justification";

var dropdown2_array = ["Left", "Center", "Right"];
var dropdown2 = group9.add("dropdownlist", undefined, undefined, { name: "dropdown2", items: dropdown2_array });
dropdown2.selection = 1;

var checkbox4 = group9.add("checkbox", undefined, undefined, { name: "checkbox4" });
checkbox4.text = "Justified";

// GROUP10
// =======
var group10 = this.win.add("group", undefined, { name: "group10" });
group10.orientation = "row";
group10.alignChildren = ["left", "center"];
group10.spacing = 10;
group10.margins = 0;

this.close = group10.add("button", undefined, undefined, { name: "close" });
this.close.text = "Cancel";

this.runScript = group10.add("button", undefined, undefined, { name: "runScript" });
this.runScript.text = "Execute";

// WIN
// ===
var divider2 = this.win.add("panel", undefined, undefined, { name: "divider2" });
divider2.alignment = "fill";

var progressBar = this.win.add("progressbar", undefined, undefined, { name: "progressBar" });
progressBar.maxvalue = 100;
progressBar.value = 0;
progressBar.preferredSize.height = 15;
progressBar.alignment = ["fill", "top"];

var divider3 = this.win.add("panel", undefined, undefined, { name: "divider3" });
divider3.alignment = "fill";

var statictext7 = this.win.add("statictext", undefined, undefined, { name: "statictext7" });
statictext7.text = "by KrevlinMen and ImSamuka";
statictext7.alignment = ["right", "top"];