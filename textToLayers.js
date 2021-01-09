/* 
<javascriptresource>
  <name>AutoTypeSetting by Krevlinmen and ImSamuka</name>
  <about>A program that automatically inputs text from files</about>
  <category>PhotoshopScanlatingScripts</category>
</javascriptresource>
*/

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

  //const UIObj = userInterface()

  processText()

  //? Restaure Configurations
  app.displayDialogs = savedDialogMode
}

function processText() {

  const arrayFiles = app.openDialog()
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
    if (!file.name.endsWithArray(['.txt', '.png', '.jpeg', '.jpg', 'psd', 'psb']))
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
  if (locked) newLayer.allLocked = true
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

function userInterface() {


  /*
  Code for Import https://scriptui.joonas.me — (Triple click to select): 
  {"activeId":13,"items":{"item-0":{"id":0,"type":"Dialog","parentId":false,"style":{"enabled":true,"varName":null,"windowType":"Dialog","creationProps":{"su1PanelCoordinates":false,"maximizeButton":false,"minimizeButton":false,"independent":false,"closeButton":true,"borderless":false,"resizeable":false},"text":"Dialog","preferredSize":[500,400],"margins":16,"orientation":"column","spacing":10,"alignChildren":["center","top"]}},"item-1":{"id":1,"type":"EditText","parentId":3,"style":{"enabled":true,"varName":"identifier_Start","creationProps":{"noecho":false,"readonly":false,"multiline":false,"scrollable":false,"borderless":false,"enterKeySignalsOnChange":false},"softWrap":false,"text":"[","justify":"left","preferredSize":[50,0],"alignment":null,"helpTip":null}},"item-2":{"id":2,"type":"StaticText","parentId":3,"style":{"enabled":true,"varName":"","creationProps":{"truncate":"none","multiline":false,"scrolling":false},"softWrap":false,"text":"Identifier in Start","justify":"left","preferredSize":[0,0],"alignment":null,"helpTip":null}},"item-3":{"id":3,"type":"Group","parentId":4,"style":{"enabled":true,"varName":"","preferredSize":[0,0],"margins":0,"orientation":"row","spacing":10,"alignChildren":["left","center"],"alignment":"fill"}},"item-4":{"id":4,"type":"Panel","parentId":0,"style":{"enabled":true,"varName":null,"creationProps":{"borderStyle":"etched","su1PanelCoordinates":false},"text":"Page Indentifiers","preferredSize":[0,0],"margins":10,"orientation":"column","spacing":10,"alignChildren":["left","top"],"alignment":null}},"item-5":{"id":5,"type":"Group","parentId":4,"style":{"enabled":true,"varName":null,"preferredSize":[0,0],"margins":0,"orientation":"row","spacing":10,"alignChildren":["right","center"],"alignment":"fill"}},"item-6":{"id":6,"type":"StaticText","parentId":5,"style":{"enabled":true,"varName":null,"creationProps":{"truncate":"none","multiline":false,"scrolling":false},"softWrap":false,"text":"Identifier in End","justify":"left","preferredSize":[0,0],"alignment":null,"helpTip":null}},"item-7":{"id":7,"type":"EditText","parentId":5,"style":{"enabled":true,"varName":"identifier_End","creationProps":{"noecho":false,"readonly":false,"multiline":false,"scrollable":false,"borderless":false,"enterKeySignalsOnChange":false},"softWrap":false,"text":"]","justify":"left","preferredSize":[50,0],"alignment":null,"helpTip":null}},"item-8":{"id":8,"type":"Divider","parentId":4,"style":{"enabled":true,"varName":null}},"item-10":{"id":10,"type":"Checkbox","parentId":4,"style":{"enabled":true,"varName":"ignorePageNumber","text":"Ignore Page Number","preferredSize":[0,0],"alignment":"center","helpTip":"This will ignore or not numbers between both identifiers","checked":false}},"item-11":{"id":11,"type":"Button","parentId":15,"style":{"enabled":true,"varName":"close","text":"Close","justify":"center","preferredSize":[0,0],"alignment":null,"helpTip":null}},"item-12":{"id":12,"type":"Button","parentId":15,"style":{"enabled":true,"varName":"run","text":"Execute","justify":"center","preferredSize":[0,0],"alignment":null,"helpTip":null}},"item-13":{"id":13,"type":"Progressbar","parentId":0,"style":{"enabled":true,"varName":null,"preferredSize":[50,10],"alignment":"fill","helpTip":null}},"item-15":{"id":15,"type":"Group","parentId":0,"style":{"enabled":true,"varName":null,"preferredSize":[0,0],"margins":0,"orientation":"row","spacing":10,"alignChildren":["left","center"],"alignment":null}}},"order":[0,4,3,2,1,5,6,7,8,10,15,11,12,13],"settings":{"importJSON":true,"indentSize":false,"cepExport":false,"includeCSSJS":true,"showDialog":true,"functionWrapper":false,"afterEffectsDockable":false,"itemReferenceList":"None"}}
  */

  // DIALOG
  // ======
  var dialog = new Window("dialog");
  dialog.text = "Dialog";
  dialog.preferredSize.width = 500;
  dialog.preferredSize.height = 400;
  dialog.orientation = "column";
  dialog.alignChildren = ["center", "top"];
  dialog.spacing = 10;
  dialog.margins = 16;

  // PANEL1
  // ======
  var panel1 = dialog.add("panel", undefined, undefined, { name: "panel1" });
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

  // GROUP3
  // ======
  var group3 = dialog.add("group", undefined, { name: "group3" });
  group3.orientation = "row";
  group3.alignChildren = ["left", "center"];
  group3.spacing = 10;
  group3.margins = 0;

  var close = group3.add("button", undefined, undefined, { name: "close" });
  close.text = "Close";

  var run = group3.add("button", undefined, undefined, { name: "run" });
  run.text = "Execute";

  // DIALOG
  // ======
  var progressbar1 = dialog.add("progressbar", undefined, undefined, { name: "progressbar1" });
  progressbar1.maxvalue = 100;
  progressbar1.value = 50;
  progressbar1.preferredSize.width = 50;
  progressbar1.preferredSize.height = 10;
  progressbar1.alignment = ["fill", "top"];

  dialog.show();





  close.onClick = dialog.close
  return { dialog: dialog, progressbar1: progressbar1 }
}


main()