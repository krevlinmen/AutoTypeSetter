/* 
<javascriptresource>
  <name>AutoTypeSetting</name>
  <about>A program that automatically inputs text from files</about>
  <category>PhotoshopScanlatingScripts</category>
</javascriptresource>
*/

#target 'photoshop'

/* -------------------------------------------------------------------------- */
/*                                Documentation                               */
/*            https://www.adobe.com/devnet/photoshop/scripting.html           */
/* -------------------------------------------------------------------------- */
/*                         User Interface Created With                        */
/*                         https://scriptui.joonas.me/                        */
/* -------------------------------------------------------------------------- */


/* ---------------------------- Global Constants ---------------------------- */

var identifier_Start = "["
var identifier_End = "]"
var ignorePageNumber = false
const defaultTextFormat = {
  size: 16,
  font: "CCWildWordsInt Regular",

  boxText: true,
  justification: Justification.CENTER,
  language: Language.BRAZILLIANPORTUGUESE,

  //border: "#FFFFFF-3-outer-false"
  // color(hex)-size(px)-position(outer/center/inner)-visible(false/true)
}


/* ---------------------------- Global Variables ---------------------------- */

//$.sleep(1000);
var textFile;
var duplicatedLayer;

/* -------------------------------------------------------------------------- */
/*                                    Main                                    */
/* -------------------------------------------------------------------------- */


function main() {
  //? Save Configurations
  const savedDialogMode = app.displayDialogs
  //? Change Configurations
  app.displayDialogs = DialogModes.ERROR //change to NO by the End

  const UI = formatUserInterface(UI)

  UI.Executing = function () {
    processText(UI.arrayFiles)
  }

  $.writeln(UI.win.show());

  //? Restaure Configurations
  app.displayDialogs = savedDialogMode
}

function processText(arrayFiles) {


  var multipleArchives = false

  if (arrayFiles.length === 0)
    throwError("No files were selected!")
  else if (arrayFiles.length === 1)
    textFile = arrayFiles[0]
  else
    multipleArchives = true

  const imageArrayDir = multipleArchives ? filterFiles(arrayFiles) : undefined
  const content = createContentObj()

  delete content[0] //Deletes text before the first identifier

  function insertPageTexts(page) {
    const positionArray = calculatePositions(page)
    for (i in page)
      writeTextLayer(page[i], i < page.length - 1, positionArray[i])
  }

  if (multipleArchives) {
    for (key in content) { //File editing loop
      var keyNum = parseInt(key)
      if (ignorePageNumber && (keyNum - 1) >= imageArrayDir.length) break;

      var found = ignorePageNumber ? imageArrayDir[keyNum - 1] : findImage(imageArrayDir, keyNum)
      if (found === undefined) continue;

      open(found)
      cleanFile()
      insertPageTexts(content[key]) //Page text Writing Loop
      saveAndClosefile(found)
    }
  } else {

    try {
      if (activeDocument)
        multipleArchives = false //useless
    } catch (error) {
      throwError("No document open.")
    }

    cleanFile()
    //? Getting the first valid key of 'content'
    insertPageTexts(content[content.keys()[0]])
  }
}

/* -------------------------------------------------------------------------- */
/*                                  Functions                                 */
/* -------------------------------------------------------------------------- */

/* ------------------------------- Prototypes ------------------------------- */

String.prototype.trim = function () {
  return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
};

String.prototype.startsWith = function (sub) {
  if (typeof sub !== "string") throwError("Parameter in startsWith is not a string", sub)
  return !sub.length || this.indexOf(sub) === 0
};

String.prototype.endsWith = function (sub) {
  if (typeof sub !== "string") throwError("Parameter in endsWith is not a string", sub)
  return !sub.length || this.slice(this.length - sub.length).indexOf(sub) === 0
};

String.prototype.endsWithArray = function (subArray) {
  for (i in subArray) {
    if (this.endsWith(subArray[i]))
      return true;
  }
  return false;
};

// Array.prototype.slice = function (start, end) {
//   const slice = []
//   for (i = start; i < end; i++) {
//     slice.push(this[i])
//   }
//   return slice
// }

Object.prototype.keys = function () {
  const arr = []
  for (k in this)
    arr.push(k)
  return arr
}

Object.prototype.copy = function () {
  const copy = {}
  for (k in this)
    copy[k] = this[k]
  return copy
}

/* --------------------------------- Helpers -------------------------------- */

function throwWarning(message) {
  alert("Warning: " + message)
}

function throwError(message, extra) {
  if (app.displayDialogs === DialogModes.NO) alert(message)
  else if (!(extra === undefined)) alert(extra)
  throw new Error(message)
}

function isNaN(p) {
  return p !== p
}

function notUndef(p) {
  return !(p === undefined)
}

function findImage(arr, num) {
  for (i in arr) {
    var str = arr[i].name
    if (num === parseInt(str.slice(0, str.lastIndexOf("."))))
      return arr[i]
  }
  return undefined
}

function getNumber(str) {
  return parseInt(str.slice(identifier_Start.length, str.length - identifier_End.length))
}

function isNewPage(line) {
  const res = line.startsWith(identifier_Start) && line.endsWith(identifier_End)
  if (ignorePageNumber)
    return res
  else
    return res && !isNaN(getNumber(line))
}

/* ------------------------------ File Handling ----------------------------- */

function saveAndClosefile(file) {
  const filePath = file.fullName
  getTypeFolder().visible = false

  function getSavePath() {
    const ext = ['.png', '.jpg', '.jpeg']
    for (i in ext)
      if (filePath.endsWith(ext[i]))
        return filePath.slice(0, filePath.length - ext[i].length)
  }

  const saveFile = File(getSavePath() + '.psd')
  activeDocument.saveAs(saveFile)
  activeDocument.close()
}

function openTextFile() {
  if (!textFile || !textFile.name.endsWith('.txt')) {
    throwError("No text file was selected!")
  }
  textFile.encoding = 'UTF8'; // set to 'UTF8' or 'UTF-8'
  textFile.open("r");
  const rawText = textFile.read();
  textFile.close();
  return rawText
}

function filterFiles(arrayFiles) {
  const imageArray = []
  for (i in arrayFiles) {
    var file = arrayFiles[i]
    if (!file.name.endsWithArray(['.txt', '.png', '.jpeg', '.jpg', '.psd', '.psb']))
      throwError("One or more files are not supported by this script!\nThis script supports the extensions:\n.png, .jpg, .jpeg, .psd, .psb, .txt")
    else if (file.name.endsWith('.txt'))
      textFile = file
    else
      imageArray.push(file)
  }
  imageArray.sort()
  return imageArray
}


function createContentObj() {

  //? Split text into array of texts
  const rawText = openTextFile()
  const textArray = rawText.split("\n")

  const content = {
    0: []
  }
  var current = 0

  for (t in textArray) {
    var line = textArray[t].trim()

    if (isNewPage(line)) {
      current = ignorePageNumber ? current + 1 : getNumber(line)
      content[current] = []
    } else if (current && line.length) { //ERROR
      content[current].push(line)
    }
  }

  return content
}


/* ------------------------------ Text Handling ----------------------------- */


function createGroupFolder(folderName) {
  folder = activeDocument.layerSets.add()
  folder.name = folderName
  return folder
}

function getTypeFolder() {
  var textFolder;
  try {
    //? Try find a folder with name "Type"
    textFolder = activeDocument.layerSets.getByName("Text Layers")
  } catch (error) {
    //? If not found, create one
    textFolder = createGroupFolder("Text Layers")
  }
  return textFolder;
}

function formatLayer(TextLayer, format) {
  //? if (format === undefined) return;
  const txt = TextLayer.textItem

  if (notUndef(format.font)) txt.font = getFont(format.font).postScriptName
  if (notUndef(format.size)) txt.size = format.size
  if (notUndef(format.boxText)) txt.kind = format.boxText ? TextType.PARAGRAPHTEXT : TextType.POINTTEXT
  if (notUndef(format.justification)) txt.justification = format.justification
  if (notUndef(format.language)) txt.language = format.language
}

function getFont(fontName) {
  //? Loop through every font
  for (i = 0; i < app.fonts.length; i++)
    //? search a font with the name including 'fontName' 
    if (app.fonts[i].name.indexOf(fontName) > -1)
      return app.fonts[i]
  //? else return "Arial" by default
  throwWarning("The font specified was not found! Using Arial as replacement")
  return getFont("Arial")
}

function writeTextLayer(text, activateDuplication, positionArray, format) {

  function defaultTextLayer() {
    //* Creating PlaceHolder Layer
    const txtLayer = getTypeFolder().artLayers.add()
    txtLayer.name = "PlaceHolder Layer"
    txtLayer.kind = LayerKind.TEXT

    //* Default Formatting
    formatLayer(txtLayer, defaultTextFormat)
    return txtLayer;
  }

  const txtLayer = duplicatedLayer === undefined ? defaultTextLayer() : duplicatedLayer
  duplicatedLayer = undefined;

  if (activateDuplication)
    duplicatedLayer = txtLayer.duplicate()

  //* Set Text
  txtLayer.textItem.contents = text
  txtLayer.name = text

  if (format) formatLayer(txtLayer, format)

  //? Positioning
  txtLayer.textItem.position = [positionArray.xPosition, positionArray.yPosition]
  txtLayer.textItem.width = positionArray.width
  txtLayer.textItem.height = positionArray.height
}

//*Calculate the positioning of all the text in a page
function calculatePositions(textArray) {
  const yBorder = activeDocument.height * 0.02
  const xBorder = activeDocument.width * 0.02
  positionData = []
  const layerPosition = {
    yPosition: yBorder, //*Initially, the margin of the document
    xPosition: xBorder,
    height: undefined,
    width: activeDocument.width * 0.2 //*maybe customizable in the future
  }

  for (i in textArray) {
    layerPosition.height = (defaultTextFormat.size * 1.1) * Math.ceil(textArray[i].length / (layerPosition.width / (6 * defaultTextFormat.size / 7))) //! Attention
    positionData.push(layerPosition.copy())

    layerPosition.yPosition += yBorder + layerPosition.height //*yPosition += The size of the text Box + border 

    if (layerPosition.yPosition >= activeDocument.height) { //*if the bottom of the file is reached
      layerPosition.yPosition = yBorder //*Reset yPosition
      layerPosition.xPosition += xBorder + layerPosition.width //*increment the x value to create a new column
    }
  }
  return positionData
}

/* -------------------------------- Editing ------------------------------- */



function createEmptyLayer(name, format) {
  //? Default Format
  const defaultFormat = {
    color: undefined,
    locked: false,
    type: undefined //levels,text,etc
  }

  //? Use Default Format if 'format' not given
  if (format === undefined)
    format = defaultFormat

  const newLayer = activeDocument.artLayers.add()
  if (format.locked) newLayer.allLocked = true
  newLayer.name = name

  //if (format.size) txtLayer.textItem.size = format.size
  return newLayer

} //use more

function cleanFile() {
  try {
    var editL = activeDocument.backgroundLayer.duplicate()
    editL.name = "Camada para Edicao"
    activeDocument.backgroundLayer.name = "Camada Raw"
  } catch (error) {
    return
  }
  createGroupFolder("Layers")
  createEmptyLayer('baloes')
  createEmptyLayer('ReDraw')
}

/* -------------------------------------------------------------------------- */
/*                               User Interface                               */
/* -------------------------------------------------------------------------- */

function createUserInterface() {


  /*
  Code for Import https://scriptui.joonas.me — (Triple click to select): 
  {"activeId":47,"items":{"item-0":{"id":0,"type":"Dialog","parentId":false,"style":{"text":"Auto TypeSetter","preferredSize":[0,0],"margins":16,"orientation":"row","spacing":10,"alignChildren":["left","top"],"varName":null,"windowType":"Dialog","creationProps":{"su1PanelCoordinates":false,"maximizeButton":false,"minimizeButton":false,"independent":false,"closeButton":true,"borderless":false,"resizeable":false},"enabled":true}},"item-1":{"id":1,"type":"Panel","parentId":20,"style":{"text":"Page Indentifiers","preferredSize":[0,0],"margins":10,"orientation":"column","spacing":10,"alignChildren":["left","top"],"alignment":null,"varName":null,"creationProps":{"borderStyle":"etched","su1PanelCoordinates":false},"enabled":true}},"item-4":{"id":4,"type":"StaticText","parentId":6,"style":{"text":"Start","justify":"left","preferredSize":[0,0],"alignment":null,"varName":null,"helpTip":null,"softWrap":true,"creationProps":{"truncate":"none","multiline":false,"scrolling":false},"enabled":true}},"item-5":{"id":5,"type":"EditText","parentId":6,"style":{"text":"[","preferredSize":[60,0],"alignment":null,"varName":"startIdentifierBox","helpTip":null,"softWrap":false,"creationProps":{"noecho":false,"readonly":false,"multiline":false,"scrollable":false,"borderless":false,"enterKeySignalsOnChange":false},"enabled":true,"justify":"left"}},"item-6":{"id":6,"type":"Group","parentId":1,"style":{"preferredSize":[0,0],"margins":0,"orientation":"row","spacing":10,"alignChildren":["right","center"],"alignment":"center","varName":null,"enabled":true}},"item-9":{"id":9,"type":"Panel","parentId":20,"style":{"text":"Text Formats","preferredSize":[0,0],"margins":10,"orientation":"column","spacing":10,"alignChildren":["left","top"],"alignment":null,"varName":null,"creationProps":{"borderStyle":"etched","su1PanelCoordinates":false},"enabled":true}},"item-19":{"id":19,"type":"Group","parentId":0,"style":{"preferredSize":[0,0],"margins":0,"orientation":"column","spacing":10,"alignChildren":["fill","top"],"alignment":null,"varName":null,"enabled":true}},"item-20":{"id":20,"type":"Group","parentId":0,"style":{"preferredSize":[0,0],"margins":0,"orientation":"column","spacing":10,"alignChildren":["fill","top"],"alignment":null,"varName":null,"enabled":true}},"item-21":{"id":21,"type":"Panel","parentId":19,"style":{"text":"Files","preferredSize":[0,0],"margins":10,"orientation":"column","spacing":10,"alignChildren":["fill","top"],"alignment":null,"varName":null,"creationProps":{"borderStyle":"etched","su1PanelCoordinates":false},"enabled":true}},"item-22":{"id":22,"type":"StaticText","parentId":21,"style":{"text":"Select a Folder including:\n- A '.txt' file containing the text\n- Image Files ('1.png', '2.jpg')\n\n(if you don't select images, \nthe script will run on a open\ndocument)","justify":"left","preferredSize":[0,0],"alignment":null,"varName":null,"helpTip":null,"softWrap":true,"creationProps":{"truncate":"none","multiline":false,"scrolling":false},"enabled":true}},"item-36":{"id":36,"type":"Group","parentId":0,"style":{"preferredSize":[0,0],"margins":0,"orientation":"column","spacing":10,"alignChildren":["fill","top"],"alignment":null,"varName":null,"enabled":true}},"item-37":{"id":37,"type":"Button","parentId":36,"style":{"text":"OK","justify":"center","preferredSize":[0,0],"alignment":null,"varName":"runScript","helpTip":null,"enabled":false}},"item-38":{"id":38,"type":"Button","parentId":36,"style":{"text":"Cancel","justify":"center","preferredSize":[0,0],"alignment":null,"varName":"cancel","helpTip":null,"enabled":true}},"item-40":{"id":40,"type":"Checkbox","parentId":1,"style":{"text":"Ignore Page Number","preferredSize":[0,0],"alignment":null,"varName":"IgnorePageNumberCB","helpTip":"This will ignore or not numbers between both identifiers","enabled":true}},"item-45":{"id":45,"type":"Group","parentId":1,"style":{"preferredSize":[0,0],"margins":0,"orientation":"row","spacing":10,"alignChildren":["right","center"],"alignment":"center","varName":null,"enabled":true}},"item-46":{"id":46,"type":"StaticText","parentId":45,"style":{"text":"End","justify":"left","preferredSize":[0,0],"alignment":null,"varName":"","helpTip":null,"softWrap":true,"creationProps":{"truncate":"none","multiline":false,"scrolling":false},"enabled":true}},"item-47":{"id":47,"type":"EditText","parentId":45,"style":{"text":"]","preferredSize":[60,0],"alignment":null,"varName":"endIdentifierBox","helpTip":null,"softWrap":false,"creationProps":{"noecho":false,"readonly":false,"multiline":false,"scrollable":false,"borderless":false,"enterKeySignalsOnChange":false},"enabled":true,"justify":"left"}},"item-48":{"id":48,"type":"Button","parentId":9,"style":{"enabled":true,"varName":null,"text":"Register JSON","justify":"center","preferredSize":[0,0],"alignment":"fill","helpTip":"Save a JSON with your custom formats to use!  :D"}},"item-49":{"id":49,"type":"Button","parentId":9,"style":{"enabled":true,"varName":null,"text":"Reset With Default","justify":"center","preferredSize":[0,0],"alignment":"fill","helpTip":"This will delete the JSON you registered"}},"item-50":{"id":50,"type":"Button","parentId":9,"style":{"enabled":true,"varName":null,"text":"Open Saved JSON","justify":"center","preferredSize":[0,0],"alignment":"fill","helpTip":"This will open the JSON you already registered"}},"item-51":{"id":51,"type":"Button","parentId":9,"style":{"enabled":true,"varName":null,"text":"Open Default JSON","justify":"center","preferredSize":[0,0],"alignment":"fill","helpTip":"Open default formats JSON and learn to Create your own formats! :D"}},"item-52":{"id":52,"type":"Checkbox","parentId":21,"style":{"enabled":true,"varName":"SelectAllFilesCB","text":"Select All Files Instead","preferredSize":[0,0],"alignment":null,"helpTip":"You need to select all files, not a folder containing these files","checked":true}},"item-53":{"id":53,"type":"StaticText","parentId":21,"style":{"enabled":true,"varName":null,"creationProps":{"truncate":"none","multiline":false,"scrolling":false},"softWrap":true,"text":"Formats Supported","justify":"center","preferredSize":[0,0],"alignment":null,"helpTip":"'.png', '.jpeg', '.jpg', '.psd', '.psb'"}},"item-55":{"id":55,"type":"Button","parentId":21,"style":{"enabled":true,"varName":"selectFilesBtn","text":"Select","justify":"center","preferredSize":[0,0],"alignment":"center","helpTip":null}},"item-56":{"id":56,"type":"StaticText","parentId":19,"style":{"enabled":true,"varName":null,"creationProps":{"truncate":"none","multiline":false,"scrolling":false},"softWrap":true,"text":"Created By \nKrevlinMen and ImSamuka","justify":"left","preferredSize":[0,0],"alignment":null,"helpTip":null}}},"order":[0,20,1,6,4,5,45,46,47,40,9,48,50,51,49,19,21,22,53,52,55,56,36,37,38],"settings":{"importJSON":true,"indentSize":false,"cepExport":false,"includeCSSJS":true,"functionWrapper":false,"compactCode":false,"showDialog":true,"afterEffectsDockable":false,"itemReferenceList":"None"}}
  */

  // DIALOG
  // ======
  this.win = new Window("dialog");
  this.win.text = "Auto TypeSetter";
  this.win.orientation = "row";
  this.win.alignChildren = ["left", "top"];
  this.win.spacing = 10;
  this.win.margins = 16;

  // GROUP1
  // ======
  var group1 = this.win.add("group", undefined, { name: "group1" });
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

  this.startIdentifierBox = group2.add('edittext {properties: {name: "startIdentifierBox"}}');
  this.startIdentifierBox.text = "[";
  this.startIdentifierBox.preferredSize.width = 60;

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

  this.endIdentifierBox = group3.add('edittext {properties: {name: "endIdentifierBox"}}');
  this.endIdentifierBox.text = "]";
  this.endIdentifierBox.preferredSize.width = 60;

  // PANEL1
  // ======
  this.IgnorePageNumberCB = panel1.add("checkbox", undefined, undefined, { name: "IgnorePageNumberCB" });
  this.IgnorePageNumberCB.helpTip = "This will ignore or not numbers between both identifiers";
  this.IgnorePageNumberCB.text = "Ignore Page Number";

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
  var group4 = this.win.add("group", undefined, { name: "group4" });
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

  this.SelectAllFilesCB = panel3.add("checkbox", undefined, undefined, { name: "SelectAllFilesCB" });
  this.SelectAllFilesCB.helpTip = "You need to select all files, not a folder containing these files";
  this.SelectAllFilesCB.text = "Select All Files Instead";

  this.selectFilesBtn = panel3.add("button", undefined, undefined, { name: "selectFilesBtn" });
  this.selectFilesBtn.text = "Select";
  this.selectFilesBtn.alignment = ["center", "top"];

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
  var group5 = this.win.add("group", undefined, { name: "group5" });
  group5.orientation = "column";
  group5.alignChildren = ["fill", "top"];
  group5.spacing = 10;
  group5.margins = 0;

  this.runScript = group5.add("button", undefined, undefined, { name: "runScript" });
  this.runScript.enabled = false;
  this.runScript.text = "OK";

  this.cancel = group5.add("button", undefined, undefined, { name: "cancel" });
  this.cancel.text = "Cancel";


  button1.enabled = false;
  button2.enabled = false;
  button3.enabled = false;
  button4.enabled = false;
}

function formatUserInterface(UI) {
  //? Create a new one by default
  if (UI === undefined)
    UI = new createUserInterface()

  UI.arrayFiles = []


  UI.runScript.text = "Execute";
  UI.cancel.text = "Cancel";

  UI.win.defaultElement = UI.runScript;
  UI.win.cancelElement = UI.cancel;


  UI.selectFilesBtn.onClick = function () {
    try {
      if (UI.SelectAllFilesCB.value)
        UI.arrayFiles = File.openDialog("Select Files", ["All:*.txt;*.png;*.jpeg;*.jpg;*.psd;*.psb", "Text:*.txt", "Images:*.png;*.jpeg;*.jpg;*.psd;*.psb"], true)
      else
        UI.arrayFiles = Folder.selectDialog("Select Folder").getFiles()
    } catch (error) {
      UI.arrayFiles = []
    }
    if (UI.arrayFiles === null) UI.arrayFiles = []

    if (UI.arrayFiles.length) {
      UI.runScript.enabled = true;
      UI.selectFilesBtn.text = "Select Again"
    } else {
      UI.runScript.enabled = false;
      UI.selectFilesBtn.text = "Select"
    }
    app.refresh();
  }

  UI.Executing = function () { }

  UI.runScript.onClick = function () {
    UI.win.close()

    identifier_Start = UI.startIdentifierBox.text
    identifier_End = UI.endIdentifierBox.text
    ignorePageNumber = UI.IgnorePageNumberCB.value

    if (typeof UI.Executing === "function") UI.Executing();
  }

  return UI
}


main()