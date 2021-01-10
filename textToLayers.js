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






//$.sleep(1000);

/* ---------------------------- Global Variables ---------------------------- */


var textFile;
var duplicatedLayer;
var config = {};

/* -------------------------------------------------------------------------- */
/*                                    Main                                    */
/* -------------------------------------------------------------------------- */


function main() {
  //? Save Configurations
  const savedDialogMode = app.displayDialogs
  //? Change Configurations
  app.displayDialogs = DialogModes.ERROR //change to NO by the End

  getConfig()

  const UI = formatUserInterface()

  UI.Executing = function () {
    alert("Executado!")
    alert(JSON.stringify(config))
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
      if (config.ignorePageNumber && (keyNum - 1) >= imageArrayDir.length) break;

      var found = config.ignorePageNumber ? imageArrayDir[keyNum - 1] : findImage(imageArrayDir, keyNum)
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

(function getPolyfills() {

  function readFiles(files) {
    for (i in files)
      try {
        var moreFiles = files[i].getFiles()
        readFiles(moreFiles)
      } catch (error) {
        var name = files[i].name
        if (!name.slice(name.length - 3).indexOf(".js"))
          $.evalFile(files[i]);
      }
  }

  const files = (new Folder(new File($.fileName).path + "/Polyfill")).getFiles()
  readFiles(files)
})()


/* --------------------------------- Helpers -------------------------------- */

function isNaN(p) {
  return p !== p
}

function notUndef(p) {
  return !(p === undefined)
}

function throwWarning(message) {
  alert("Warning: " + message)
}

function throwError(message, extra) {
  if (app.displayDialogs === DialogModes.NO) alert(message)
  else if (!(extra === undefined)) alert(extra)
  throw new Error(message)
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
  return parseInt(str.slice(config.identifierStart.length, str.length - config.identifierEnd.length))
}

function isNewPage(line) {
  const res = line.startsWith(config.identifierStart) && line.endsWith(config.identifierEnd)
  if (config.ignorePageNumber)
    return res
  else
    return res && !isNaN(getNumber(line))
}

/* ------------------------------ File Handling ----------------------------- */

function getConfig() {
  const files = (new File($.fileName)).parent.getFiles("*Config.json")
  var defaultConfig
  var savedConfig

  for (i in files)
    if (files[i].name === "defaultConfig.json")
      defaultConfig = files[i]
    else if (files[i].name === "savedConfig.json")
      savedConfig = files[i]

  if (defaultConfig === undefined) {
    alert("Default Configuration Missing.\nYou can get another one for free on https://github.com/krevlinmen/PhotoshopScanlatingScripts")
  }
  else config = JSON.parse(readFile(savedConfig === undefined ? defaultConfig : savedConfig))

}

function saveAndClosefile(file) {
  const filePath = file.fullName
  getTypeFolder().visible = config.groupLayer.visible

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

function readFile(file) {
  file.encoding = 'UTF8'; // set to 'UTF8' or 'UTF-8'
  file.open("r");
  const rawText = file.read();
  file.close();
  return rawText
}

function openTextFile(textFileGiven) {
  if (!textFile || !textFile.name.endsWith('.txt')) {
    throwError("No text file was selected!")
  }
  return readFile(textFile)
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
      current = config.ignorePageNumber ? current + 1 : getNumber(line)
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
  const groupName = config.groupLayer.groupName

  if (config.groupLayer.alwaysCreateGroup)
    return createGroupFolder(groupName)

  var textFolder;
  try {
    //? Try find a folder with name given
    textFolder = activeDocument.layerSets.getByName(groupName)
  } catch (error) {
    //? If not found, create one
    textFolder = createGroupFolder(groupName)
  }
  return textFolder;
}


function formatLayer(TextLayer, format) {
  if (format === undefined) return;

  const txt = TextLayer.textItem

  if (notUndef(format.visible)) TextLayer.visible = format.visible
  if (notUndef(format.font)) txt.font = getFont(format.font).postScriptName
  if (notUndef(format.size)) txt.size = format.size
  if (notUndef(format.boxText)) txt.kind = format.boxText ? TextType.PARAGRAPHTEXT : TextType.POINTTEXT
  if (notUndef(format.justification)) txt.justification = Justification[format.justification]
  if (notUndef(format.language)) txt.language = Language[format.language]
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
    formatLayer(txtLayer, config.defaultTextFormat)
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
    layerPosition.height = (config.defaultTextFormat.size * 1.1) * Math.ceil(textArray[i].length / (layerPosition.width / (6 * config.defaultTextFormat.size / 7))) //! Attention
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
  {"activeId":47,"items":{"item-0":{"id":0,"type":"Dialog","parentId":false,"style":{"text":"Auto TypeSetter","preferredSize":[0,0],"margins":16,"orientation":"row","spacing":10,"alignChildren":["left","top"],"varName":"win","windowType":"Dialog","creationProps":{"su1PanelCoordinates":false,"maximizeButton":false,"minimizeButton":false,"independent":false,"closeButton":true,"borderless":false,"resizeable":false},"enabled":true}},"item-1":{"id":1,"type":"Panel","parentId":20,"style":{"text":"Page Indentifiers","preferredSize":[0,0],"margins":10,"orientation":"column","spacing":10,"alignChildren":["left","top"],"alignment":null,"varName":null,"creationProps":{"borderStyle":"etched","su1PanelCoordinates":false},"enabled":true}},"item-4":{"id":4,"type":"StaticText","parentId":6,"style":{"text":"Start","justify":"left","preferredSize":[0,0],"alignment":null,"varName":null,"helpTip":null,"softWrap":true,"creationProps":{"truncate":"none","multiline":false,"scrolling":false},"enabled":true}},"item-5":{"id":5,"type":"EditText","parentId":6,"style":{"text":"[","preferredSize":[60,0],"alignment":null,"varName":"identifierStartBox","helpTip":null,"softWrap":false,"creationProps":{"noecho":false,"readonly":false,"multiline":false,"scrollable":false,"borderless":false,"enterKeySignalsOnChange":false},"enabled":true,"justify":"left"}},"item-6":{"id":6,"type":"Group","parentId":1,"style":{"preferredSize":[0,0],"margins":0,"orientation":"row","spacing":10,"alignChildren":["right","center"],"alignment":"center","varName":null,"enabled":true}},"item-9":{"id":9,"type":"Panel","parentId":20,"style":{"text":"Configuration","preferredSize":[0,0],"margins":10,"orientation":"column","spacing":10,"alignChildren":["left","top"],"alignment":null,"varName":null,"creationProps":{"borderStyle":"etched","su1PanelCoordinates":false},"enabled":true}},"item-19":{"id":19,"type":"Group","parentId":0,"style":{"preferredSize":[0,0],"margins":0,"orientation":"column","spacing":10,"alignChildren":["fill","top"],"alignment":null,"varName":null,"enabled":true}},"item-20":{"id":20,"type":"Group","parentId":0,"style":{"preferredSize":[0,0],"margins":0,"orientation":"column","spacing":10,"alignChildren":["fill","top"],"alignment":null,"varName":null,"enabled":true}},"item-21":{"id":21,"type":"Panel","parentId":19,"style":{"text":"Files","preferredSize":[0,0],"margins":10,"orientation":"column","spacing":10,"alignChildren":["fill","top"],"alignment":null,"varName":null,"creationProps":{"borderStyle":"etched","su1PanelCoordinates":false},"enabled":true}},"item-22":{"id":22,"type":"StaticText","parentId":21,"style":{"text":"Select a Folder including:\n- A '.txt' file containing the text\n- Image Files ('1.png', '2.jpg')\n\n(if you don't select images, \nthe script will run on a open\ndocument)","justify":"left","preferredSize":[0,0],"alignment":null,"varName":null,"helpTip":null,"softWrap":true,"creationProps":{"truncate":"none","multiline":false,"scrolling":false},"enabled":true}},"item-36":{"id":36,"type":"Group","parentId":0,"style":{"preferredSize":[0,0],"margins":0,"orientation":"column","spacing":10,"alignChildren":["fill","top"],"alignment":null,"varName":null,"enabled":true}},"item-37":{"id":37,"type":"Button","parentId":36,"style":{"text":"OK","justify":"center","preferredSize":[0,0],"alignment":null,"varName":"confirmBtn","helpTip":null,"enabled":false}},"item-38":{"id":38,"type":"Button","parentId":36,"style":{"text":"Cancel","justify":"center","preferredSize":[0,0],"alignment":null,"varName":"cancelBtn","helpTip":null,"enabled":true}},"item-40":{"id":40,"type":"Checkbox","parentId":1,"style":{"text":"Ignore Page Number","preferredSize":[0,0],"alignment":null,"varName":"ignorePageNumberCB","helpTip":"This will ignore or not numbers between both identifiers","enabled":true,"checked":false}},"item-45":{"id":45,"type":"Group","parentId":1,"style":{"preferredSize":[0,0],"margins":0,"orientation":"row","spacing":10,"alignChildren":["right","center"],"alignment":"center","varName":null,"enabled":true}},"item-46":{"id":46,"type":"StaticText","parentId":45,"style":{"text":"End","justify":"left","preferredSize":[0,0],"alignment":null,"varName":"","helpTip":null,"softWrap":true,"creationProps":{"truncate":"none","multiline":false,"scrolling":false},"enabled":true}},"item-47":{"id":47,"type":"EditText","parentId":45,"style":{"text":"]","preferredSize":[60,0],"alignment":null,"varName":"identifierEndBox","helpTip":null,"softWrap":false,"creationProps":{"noecho":false,"readonly":false,"multiline":false,"scrollable":false,"borderless":false,"enterKeySignalsOnChange":false},"enabled":true,"justify":"left"}},"item-48":{"id":48,"type":"Button","parentId":9,"style":{"enabled":true,"varName":"registerConfigBtn","text":"Register Config.","justify":"center","preferredSize":[0,0],"alignment":"fill","helpTip":"Save a JSON with your custom configuration to use!  :D"}},"item-49":{"id":49,"type":"Button","parentId":9,"style":{"enabled":false,"varName":"resetConfigBtn","text":"Reset Config.","justify":"center","preferredSize":[0,0],"alignment":"fill","helpTip":"This will delete the JSON you registered"}},"item-50":{"id":50,"type":"Button","parentId":9,"style":{"enabled":true,"varName":"openFolderBtn","text":"Open Folder","justify":"center","preferredSize":[0,0],"alignment":"fill","helpTip":""}},"item-52":{"id":52,"type":"Checkbox","parentId":21,"style":{"enabled":true,"varName":"selectAllFilesCB","text":"Select All Files Instead","preferredSize":[0,0],"alignment":null,"helpTip":"You need to select all files, not a folder containing these files","checked":false}},"item-53":{"id":53,"type":"StaticText","parentId":21,"style":{"enabled":true,"varName":null,"creationProps":{"truncate":"none","multiline":false,"scrolling":false},"softWrap":true,"text":"Formats Supported","justify":"center","preferredSize":[0,0],"alignment":null,"helpTip":"'.png', '.jpeg', '.jpg', '.psd', '.psb'"}},"item-55":{"id":55,"type":"Button","parentId":21,"style":{"enabled":true,"varName":"selectFilesBtn","text":"Select","justify":"center","preferredSize":[0,0],"alignment":"center","helpTip":null}},"item-56":{"id":56,"type":"StaticText","parentId":19,"style":{"enabled":true,"varName":null,"creationProps":{"truncate":"none","multiline":false,"scrolling":false},"softWrap":true,"text":"Created By \nKrevlinMen and ImSamuka","justify":"left","preferredSize":[0,0],"alignment":null,"helpTip":null}},"item-57":{"id":57,"type":"Panel","parentId":20,"style":{"text":"Text Group","preferredSize":[0,0],"margins":10,"orientation":"column","spacing":10,"alignChildren":["left","top"],"alignment":null,"varName":null,"creationProps":{"borderStyle":"etched","su1PanelCoordinates":false},"enabled":true}},"item-58":{"id":58,"type":"Group","parentId":57,"style":{"preferredSize":[0,0],"margins":0,"orientation":"row","spacing":10,"alignChildren":["right","center"],"alignment":"fill","varName":null,"enabled":true}},"item-59":{"id":59,"type":"StaticText","parentId":58,"style":{"text":"Name","justify":"left","preferredSize":[0,0],"alignment":null,"varName":null,"helpTip":null,"softWrap":true,"creationProps":{"truncate":"none","multiline":false,"scrolling":false},"enabled":true}},"item-60":{"id":60,"type":"EditText","parentId":58,"style":{"text":"Type","preferredSize":[80,0],"alignment":null,"varName":"groupNameBox","helpTip":null,"softWrap":false,"creationProps":{"noecho":false,"readonly":false,"multiline":false,"scrollable":false,"borderless":false,"enterKeySignalsOnChange":false},"enabled":true,"justify":"left"}},"item-64":{"id":64,"type":"Checkbox","parentId":57,"style":{"text":"Visible","preferredSize":[0,0],"alignment":null,"varName":"visibleGroupCB","helpTip":"Set Layer to Visible","enabled":true}},"item-65":{"id":65,"type":"Checkbox","parentId":57,"style":{"text":"Always Create Group","preferredSize":[0,0],"alignment":null,"varName":"alwaysCreateGroupCB","helpTip":"Always create a new group, otherwise add text layers to an existing group","enabled":true}}},"order":[0,20,1,6,4,5,45,46,47,40,57,58,59,60,64,65,9,48,50,49,19,21,22,53,52,55,56,36,37,38],"settings":{"importJSON":true,"indentSize":false,"cepExport":false,"includeCSSJS":true,"functionWrapper":false,"compactCode":false,"showDialog":true,"afterEffectsDockable":false,"itemReferenceList":"var"}}
  */

  // WIN
  // ===
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

  this.identifierStartBox = group2.add('edittext {properties: {name: "identifierStartBox"}}');
  this.identifierStartBox.text = "[";
  this.identifierStartBox.preferredSize.width = 60;

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

  this.identifierEndBox = group3.add('edittext {properties: {name: "identifierEndBox"}}');
  this.identifierEndBox.text = "]";
  this.identifierEndBox.preferredSize.width = 60;

  // PANEL1
  // ======
  this.ignorePageNumberCB = panel1.add("checkbox", undefined, undefined, { name: "ignorePageNumberCB" });
  this.ignorePageNumberCB.helpTip = "This will ignore or not numbers between both identifiers";
  this.ignorePageNumberCB.text = "Ignore Page Number";

  // PANEL2
  // ======
  var panel2 = group1.add("panel", undefined, undefined, { name: "panel2" });
  panel2.text = "Text Group";
  panel2.orientation = "column";
  panel2.alignChildren = ["left", "top"];
  panel2.spacing = 10;
  panel2.margins = 10;

  // GROUP4
  // ======
  var group4 = panel2.add("group", undefined, { name: "group4" });
  group4.orientation = "row";
  group4.alignChildren = ["right", "center"];
  group4.spacing = 10;
  group4.margins = 0;
  group4.alignment = ["fill", "top"];

  var statictext3 = group4.add("statictext", undefined, undefined, { name: "statictext3" });
  statictext3.text = "Name";

  this.groupNameBox = group4.add('edittext {properties: {name: "groupNameBox"}}');
  this.groupNameBox.text = "Type";
  this.groupNameBox.preferredSize.width = 80;

  // PANEL2
  // ======
  this.visibleGroupCB = panel2.add("checkbox", undefined, undefined, { name: "visibleGroupCB" });
  this.visibleGroupCB.helpTip = "Set Layer to Visible";
  this.visibleGroupCB.text = "Visible";

  this.alwaysCreateGroupCB = panel2.add("checkbox", undefined, undefined, { name: "alwaysCreateGroupCB" });
  this.alwaysCreateGroupCB.helpTip = "Always create a new group, otherwise add text layers to an existing group";
  this.alwaysCreateGroupCB.text = "Always Create Group";

  // PANEL3
  // ======
  var panel3 = group1.add("panel", undefined, undefined, { name: "panel3" });
  panel3.text = "Configuration";
  panel3.orientation = "column";
  panel3.alignChildren = ["left", "top"];
  panel3.spacing = 10;
  panel3.margins = 10;

  this.registerConfigBtn = panel3.add("button", undefined, undefined, { name: "registerConfigBtn" });
  this.registerConfigBtn.helpTip = "Save a JSON with your custom configuration to use!  :D";
  this.registerConfigBtn.text = "Register Config.";
  this.registerConfigBtn.alignment = ["fill", "top"];
  this.registerConfigBtn.enabled = false;

  this.openFolderBtn = panel3.add("button", undefined, undefined, { name: "openFolderBtn" });
  this.openFolderBtn.text = "Open Folder";
  this.openFolderBtn.alignment = ["fill", "top"];
  this.openFolderBtn.enabled = false;

  this.resetConfigBtn = panel3.add("button", undefined, undefined, { name: "resetConfigBtn" });
  this.resetConfigBtn.enabled = false;
  this.resetConfigBtn.helpTip = "This will delete the JSON you registered";
  this.resetConfigBtn.text = "Reset Config.";
  this.resetConfigBtn.alignment = ["fill", "top"];

  // GROUP5
  // ======
  var group5 = this.win.add("group", undefined, { name: "group5" });
  group5.orientation = "column";
  group5.alignChildren = ["fill", "top"];
  group5.spacing = 10;
  group5.margins = 0;

  // PANEL4
  // ======
  var panel4 = group5.add("panel", undefined, undefined, { name: "panel4" });
  panel4.text = "Files";
  panel4.orientation = "column";
  panel4.alignChildren = ["fill", "top"];
  panel4.spacing = 10;
  panel4.margins = 10;

  var statictext4 = panel4.add("group");
  statictext4.orientation = "column";
  statictext4.alignChildren = ["left", "center"];
  statictext4.spacing = 0;

  statictext4.add("statictext", undefined, "Select a Folder including:", { name: "statictext4" });
  statictext4.add("statictext", undefined, "- A '.txt' file containing the text", { name: "statictext4" });
  statictext4.add("statictext", undefined, "- Image Files ('1.png', '2.jpg') ", { name: "statictext4" });
  statictext4.add("statictext", undefined, "", { name: "statictext4" });
  statictext4.add("statictext", undefined, "(if you don't select images, ", { name: "statictext4" });
  statictext4.add("statictext", undefined, "the script will run on a open", { name: "statictext4" });
  statictext4.add("statictext", undefined, "document)", { name: "statictext4" });

  var statictext5 = panel4.add("statictext", undefined, undefined, { name: "statictext5" });
  statictext5.helpTip = "'.png', '.jpeg', '.jpg', '.psd', '.psb'";
  statictext5.text = "Formats Supported";
  statictext5.justify = "center";

  this.selectAllFilesCB = panel4.add("checkbox", undefined, undefined, { name: "selectAllFilesCB" });
  this.selectAllFilesCB.helpTip = "You need to select all files, not a folder containing these files";
  this.selectAllFilesCB.text = "Select All Files Instead";

  this.selectFilesBtn = panel4.add("button", undefined, undefined, { name: "selectFilesBtn" });
  this.selectFilesBtn.text = "Select";
  this.selectFilesBtn.alignment = ["center", "top"];

  // GROUP5
  // ======
  var statictext6 = group5.add("group");
  statictext6.orientation = "column";
  statictext6.alignChildren = ["left", "center"];
  statictext6.spacing = 0;

  statictext6.add("statictext", undefined, "Created By ", { name: "statictext6" });
  statictext6.add("statictext", undefined, "KrevlinMen and ImSamuka", { name: "statictext6" });

  // GROUP6
  // ======
  var group6 = this.win.add("group", undefined, { name: "group6" });
  group6.orientation = "column";
  group6.alignChildren = ["fill", "top"];
  group6.spacing = 10;
  group6.margins = 0;

  this.confirmBtn = group6.add("button", undefined, undefined, { name: "confirmBtn" });
  this.confirmBtn.enabled = false;
  this.confirmBtn.text = "OK";

  this.cancelBtn = group6.add("button", undefined, undefined, { name: "cancelBtn" });
  this.cancelBtn.text = "Cancel";






}

function formatUserInterface(UI) {
  //* Create a new one by default
  if (UI === undefined)
    UI = new createUserInterface()

  //* Set New Variables
  UI.arrayFiles = []
  UI.Executing = function () { }

  //* Set New Properties
  UI.win.defaultElement = UI.confirmBtn;
  UI.win.cancelElement = UI.cancelBtn;

  //* Set Default Values From Config
  try {
    if (notUndef(config.identifierStart)) UI.identifierStartBox.text = config.identifierStart
    if (notUndef(config.identifierEnd)) UI.identifierEndBox.text = config.identifierEnd
    if (notUndef(config.ignorePageNumber)) UI.ignorePageNumberCB.value = config.ignorePageNumber
    if (notUndef(config.selectAllFiles)) UI.selectAllFilesCB.value = config.selectAllFiles
    if (notUndef(config.groupLayer.groupName)) UI.groupNameBox.text = config.groupLayer.groupName
    if (notUndef(config.groupLayer.alwaysCreateGroup)) UI.alwaysCreateGroupCB.value = config.groupLayer.alwaysCreateGroup
    if (notUndef(config.groupLayer.visible)) UI.visibleGroupCB.value = config.groupLayer.visible
  } catch (error) {
    throwError("A configuration is corrupted: " + error)
  }

  //* Set Methods

  UI.selectFilesBtn.onClick = function () {
    try {
      if (UI.selectAllFilesCB.value)
        UI.arrayFiles = File.openDialog("Select Files", ["All:*.txt;*.png;*.jpeg;*.jpg;*.psd;*.psb", "Text:*.txt", "Images:*.png;*.jpeg;*.jpg;*.psd;*.psb"], true)
      else
        UI.arrayFiles = Folder.selectDialog("Select Folder").getFiles()
    } catch (error) {
      UI.arrayFiles = []
    }
    if (UI.arrayFiles === null) UI.arrayFiles = []

    if (UI.arrayFiles.length) {
      UI.confirmBtn.enabled = true;
      UI.selectFilesBtn.text = "Select Again"
    } else {
      UI.confirmBtn.enabled = false;
      UI.selectFilesBtn.text = "Select"
    }
    app.refresh();
  }

  UI.confirmBtn.onClick = function () {
    //* Close Window
    UI.win.close()

    //alert("Executado Interno")

    //* Set Configuration
    config.identifierStart = UI.identifierStartBox.text
    config.identifierEnd = UI.identifierEndBox.text
    config.ignorePageNumber = UI.ignorePageNumberCB.value
    config.selectAllFiles = UI.selectAllFilesCB.value
    config.groupLayer.groupName = UI.groupNameBox.text
    config.groupLayer.alwaysCreateGroup = UI.alwaysCreateGroupCB.value
    config.groupLayer.visible = UI.visibleGroupCB.value

    if (typeof UI.Executing === "function") UI.Executing();
  }

  return UI
}


main()