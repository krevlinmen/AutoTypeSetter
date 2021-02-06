/*
<javascriptresource>
  <name>AutoTypeSetter</name>
  <about>A program that automatically inputs text from files</about>
  <menu>automate</menu>
  <category>AutoTypeSetter</category>
</javascriptresource>
*/

/* -------------------------------------------------------------------------- */
/*                             AutoTypeSetter v2.0                            */
/*                                                                            */
/*                https://github.com/krevlinmen/AutoTypeSetter                */
/*                                                                            */
/* -------------------------------------------------------------------------- */
/*                                Documentation                               */
/*                                                                            */
/*              https://github.com/krevlinmen/AutoTypeSetter/wiki             */
/*            https://www.adobe.com/devnet/photoshop/scripting.html           */
/*          https://javascript-tools-guide.readthedocs.io/index.html          */
/*                                                                            */
/* -------------------------------------------------------------------------- */
/*                         User Interface Created With                        */
/*                                                                            */
/*                         https://scriptui.joonas.me/                        */
/*                                                                            */
/* -------------------------------------------------------------------------- */


/* ------------------------- Preprocessor directives ------------------------ */

//@target "photoshop"
//@script AutoTypeSetter
//@includepath "lib/js"
//@include "json2.jsxinc"
//@include "polyfill.jsxinc"
//@include "functions.jsxinc"
//@include "ProcessingWindow.jsxinc"
//@include "MainWindow.jsxinc"
//@include "TabbedWindow.jsxinc"

/* ---------------------------- Global Constants ---------------------------- */


const dropDownSizes = [130, 300]
const isWindowAvailable = !!$.global.Window;
const savedConfigPath = "config.json"

const defaultConfig = readJson("lib/defaultConfig.json", "Default configuration")

const justificationObj = readJson("lib/dropdown/justificationOptions.json", "Justification options list")
const blendModeObj = readJson("lib/dropdown/blendModeOptions.json", "Blend Mode options list")
const languageObj = readJson("lib/dropdown/languageOptions.json", "Language options list")
const fontNamesArray = getFontNames()

//* ------- MainWindow ------

const mainWindowObj = MainWindow()

//* ------- ProcessingWindow ------

//? Create Window
const ProcessingWindowObj = new ProcessingWindow()

//? Cancel Button Function
ProcessingWindowObj.cancelBtn.onClick = function () {
  continueProcessing = false
  //? Close Window
  ProcessingWindowObj.close()
}

//? Start Button Method
ProcessingWindowObj.startBtn.onClick = function () {
  ProcessingWindowObj.startBtn.enabled = false;
  ProcessingWindowObj.startBtn.onClick = undefined; //? Ensure this will run only once
  if (typeof ExecuteProcess === "function") ExecuteProcess();
  ProcessingWindowObj.close();
};

/* ---------------------------- Global Variables ---------------------------- */

var textFile;
var duplicatedLayer;
var alreadyCreatedTextFolder = false;
var config = {};
var continueProcessing = true
var ExecuteProcess = function () {}

/* -------------------------------------------------------------------------- */
/*                                    Main                                    */
/* -------------------------------------------------------------------------- */


main()

function main() {

  //? Save Configurations
  const savedDialogMode = app.displayDialogs
  //? Change Configurations
  app.displayDialogs = DialogModes.NO //change to NO by the End

  writeProgramInfo() // Archive for debugging porpoises

  mainWindowObj.Executing = function () {
    alert("Executing")

    //* The Whole program is this line
    processText(mainWindowObj.arrayFiles)

    //* Commented Until we discuss how to handle uncaught errors
    // try {} catch (error) {
    //   //? Closes the windows if an error occurs, else PhotoShop crashes
    //   throwError("Something really bad happened", error)
    // }
  }

  //? Read Configuration
  readConfig()

  //? Show UI window
  mainWindowObj.initialize()

  //? Restore Configurations
  app.displayDialogs = savedDialogMode
}

function processText(arrayFiles) {


  //? Get Files

  var multipleArchives = false

  if (arrayFiles.length === 0)
    throwError("No files were selected!")
  else if (arrayFiles.length === 1)
    textFile = arrayFiles[0]
  else
    multipleArchives = true

  const imageFileArray = multipleArchives ? createImageArray(arrayFiles) : undefined
  const content = createContentObj(multipleArchives)
  const filesOrder = multipleArchives ? {} : []

  if (multipleArchives) {

    //* Populating filesOrder
    for (var pageKey in content) {
      var pageNumber = parseInt(pageKey)
      if (config.ignorePageNumber && (pageNumber - 1) >= imageFileArray.length)
        break; //? No files left
      filesOrder[pageKey] = config.ignorePageNumber ? imageFileArray[pageNumber - 1] : getSpecificImage(imageFileArray, pageNumber)
    }

    //* Process Function
    ExecuteProcess = function () {
      for (var pageKey in filesOrder){
        var file = filesOrder[pageKey]

        if (!continueProcessing) break;

        if (file){
          if (continueProcessing) open(file)
          if (continueProcessing) applyStarterLayerFormats()
          if (continueProcessing) insertPageTexts(content[pageKey]) //Page text Writing Loop
          if (continueProcessing) saveAndCloseFile(file)
        }

        //? Update Window
        ProcessingWindowObj.update()
      }
    }

  } else {

    //? There's only one file selected
    //? It MUST be a text file - assured in createContentObj()
    //? And The user MUST have a open active document

    //* Assure there's a document open
    try {
      if (activeDocument.layers[0])
        multipleArchives = false //useless
    } catch (error) {
      throwError("No document open.\nIf you only select a text file, you need to have a document open.")
    }

    //* Populating filesOrder
    for (var pageKey in content) {
      var page = content[pageKey]
      for (var lineKey in page)
        filesOrder.push(page[lineKey])
    }

    //* Process Function
    ExecuteProcess = function () {
      if (continueProcessing) applyStarterLayerFormats()

      //? Everything will be used
      for (var pageKey in content) {
        if (!continueProcessing) break;
        insertPageTexts(content[pageKey], true)
      }
    }
  }

  //* Open Window
  ProcessingWindowObj.initialize(filesOrder)
}

/* -------------------------------------------------------------------------- */
/*                                  Functions                                 */
/* -------------------------------------------------------------------------- */





/* --------------------------------- Helpers -------------------------------- */

function throwError(message, error, notCloseWindows) {

  //? Always show error message
  alert(message)

  //? Closes windows, else Crash

  if (!notCloseWindows){
    try {
      mainWindowObj.win.close()
    } catch (error) {}

    try {
      ProcessingWindowObj.close()
    } catch (error) {}
  }

  if (error === undefined)
    throw new Error(message)
  else {
    alert(error)
    throw error
  }
}

function saveAndCloseFile(file) {
  formatLayer(getTypeFolder(), config.groupLayer)

  const saveFile = File(file.fullName.withoutExtension() + '.psd')
  activeDocument.saveAs(saveFile)
  activeDocument.close()
  alreadyCreatedTextFolder = false;
}

function writeProgramInfo() {
  //? This function creates and updates a file containing
  //? technical info for debugging purposes

  //? This wasn't done storing a JSON because it's x5 slower

  const file = getFileFromScriptPath("lib/userProgramInfo.txt");
  const string = file.exists ? readFile(file) : "";

  const appSpecifier = BridgeTalk.appSpecifier;

  //? If this program (identified by appSpecifier) has already opened,
  //? We don't need to get this info again, so return
  if (string) {
    const strArray = string.split("\n");

    for (var i in strArray)
      if (strArray[i].indexOf("appSpecifier: ") === 0)
        if (strArray[i].slice("appSpecifier: ".length) === appSpecifier) return;
  }

  const infoObj = {
    appSpecifier: appSpecifier,
    appLocale: BridgeTalk.appLocale,
    appDisplayName: BridgeTalk.getDisplayName(appSpecifier),
    os: $.os,
    locale: $.locale,

    ESBuild: $.build,
    JSVersion: $.version,
    JSBuildDate: $.buildDate,
    memCache: $.memCache,
    screens: $.screens,
  };

  string += "\n";
  for (var i in infoObj) string += i + ": " + infoObj[i] + "\n";

  writeFile(file, string);
}

function applyStarterLayerFormats() {

  if (config.disableStarterLayer) return

  //? Get first layer (from bottom to top)
  var currentLayer = activeDocument.layers[activeDocument.layers.length - 1]

  for (var i in config.starterLayerFormats) {
    var format = config.starterLayerFormats[i]

    if (i > 0 && isNotUndef(format.duplicate) && format.duplicate)
      currentLayer = currentLayer.duplicate()
    else if (i > 0) {
      var newLayer = activeDocument.artLayers.add()
      newLayer.move(currentLayer, ElementPlacement.PLACEBEFORE)
      currentLayer = newLayer
    }

    formatLayer(currentLayer, format)
  }

}










function readJson(pathOrFile, name, isUnnecessary){

  var file = typeof pathOrFile == "string" ? getFileFromScriptPath(pathOrFile) : pathOrFile

  //? Check if the file Exists
  if (!file.exists)
    return isUnnecessary ? undefined : throwError(name + " file missing.\nYou can get another one for free on github.com/krevlinmen/AutoTypeSetter")

  //? Reading the file
  try {
    var text = readFile(file)
  } catch (error) {
    throwError("Error while reading " + name + ".\nPlease check if the program can read the file.", error, isUnnecessary)
  }

  //? Converting JSON to Object
  try {
    var object = JSON.parse(text)
  } catch (error) {
    throwError("Error while converting " + name + " to a object.\nPlease check if the file is a valid JSON.", error, isUnnecessary)
  }

  return object
}

function readConfig() {

  //* Reading File
  const hasSavedConfig = getFileFromScriptPath(savedConfigPath).exists
  config = readJson(savedConfigPath, "Saved configuration", !hasSavedConfig)

  //* Use default if it didn't work
  if (config === undefined){
    config = getCopy(defaultConfig)
    delete config.LayerFormatObject
    return
  }

  clearConfig() //* Asserting Integrity
}


function saveConfig(configObject) {

  const importing = configObject === undefined

  if (importing) {
    const file = File.openDialog("Select Configuration File", "JSON:*.json", false)
    if (!file) return;
    try {
      configObject = readJson(file, "Configuration File", true)
    } catch (error) {}
  }

  if (!configObject) return;

  clearConfig(configObject) //* Asserting Integrity

  try {
    const newFile = getFileFromScriptPath(savedConfigPath)
    writeFile(newFile, JSON.stringify(configObject, null, 2))
  } catch (error) {
    throwError("Something went wrong when registering configuration.", error)
  }

  alert((importing ? "Imported" : "Saved" ) + " Successfully! :D" + (importing ? "\nUnfortunately, it may take a while we read and update the screen" : "" ))

  if (importing) readConfig()

  return true //? Success
}


function clearConfig(configObject){

  if (configObject === undefined) configObject = config

  //! IMPORTANT
  //* Every Object {} inside 'config' is considered a 'LayerFormatObject'

  for (var i in defaultConfig){

    //* Type Validation

    var isDefault = validatePropertyType(configObject, defaultConfig, i)
    if (isDefault) continue;

    //? From here, configObject[i] is defined, not 'NaN' or 'null' or equal to the default

    //* LayerFormatObject Validation

    var defValue = defaultConfig[i]

    if (defValue !== null && typeof defValue == "object"){

      if (Array.isArray(defValue)){
        //? It is a Array []

        for (var j in configObject[i]){

          //? Deleting problematic properties

          if ( !(i == "starterLayerFormats" && j < 1 ) )
            //? We delete if this is not the first layer of "starterLayerFormats"
            delete configObject[i][j].isBackgroundLayer

          if ( !(i == "starterLayerFormats" && j > 0 ) )
            //? We delete if this is not the subsequent layers of "starterLayerFormats"
            delete configObject[i][j].duplicate

          validateLayerFormatObject(configObject[i][j], configObject[i][j].duplicate ? configObject[i][j-1] : undefined )
        }

      } else {

        //? Deleting problematic properties
        delete configObject[i].isBackgroundLayer
        delete configObject[i].duplicate

        validateLayerFormatObject( configObject[i] )
      }
    }
  }

  function validatePropertyType(configObject, defaultObject, key){
    var defValue = defaultObject[key]

    //? Ignore 'LayerFormatObject' object

    if (key == "aaaaa") alert(defaultObject[key])

    if (key == "LayerFormatObject" || defaultObject[key] === undefined){
      delete configObject[key]
      return true
    }

    //? If Undefined, just take the default value
    if (configObject[key] === undefined || configObject[key] === null || isNaN(configObject[key])){
      configObject[key] = defValue
      return true;
    }

    //? From here, configObject[i] is defined, not 'NaN' or 'null' or equal to the default

    if (defValue !== null && typeof defValue == "object"){

      if (Array.isArray(defValue)){
        //? It is a Array []

        //? If it is a Object {}, insert this object in a Array
        if (configObject[key] !== null && typeof configObject[key] == "object" && !Array.isArray(configObject[key]) )
          configObject[key] = [ configObject[key] ]
        //? If it is not a Array [], use default
        else if (!Array.isArray(configObject[key])){
          configObject[key] = defValue
          return true
        }

      } else {
        //? It is a Object {}

        //? If it is not a Object {}, use default
        if (typeof configObject[key] != "object" || configObject[key] === null || Array.isArray(configObject[key]) ){
          configObject[key] = defValue
          return true
        }
      }
    }
    else if (typeof defValue == "number"){
      //? It is a Number

      if (typeof configObject[key] == "string"){

        //? Replace everything that isn't numbers
        configObject[key] = configObject[key].replace(/[^0-9]/g, '')

        //? If the string have no length (""), use default
        if (!configObject[key].length){
          configObject[key] = defValue
          return true
        }
      }

      //? Parse as float
      configObject[key] = parseFloat(configObject[key])

      //? If parsing the value as integer, generates 'NaN', use default
      if (isNaN(configObject[key])){
        configObject[key] = defValue
        return true
      }

    }
    else if (typeof defValue == "boolean"){
      //? It is a boolean true/false

      //? An easier approach to avoid unexpected results
      if (typeof configObject[key] != "boolean"){
        configObject[key] = defValue
        return true
      }
    }
    else if (typeof defValue == "string"){
      //? It is a String ""

      //? Convert it to string
      if (typeof configObject[key] == "number")
        configObject[key] = configObject[key].toString()
      else if (typeof configObject[key] != "string"){
        configObject[key] = defValue
        return true
      }
    }
  }

  function validateLayerFormatObject(obj, objBefore){

    const optionObjects = {
      justification: justificationObj,
      blendMode: blendModeObj,
      language: languageObj,
      font: null
    }

    for (var k in optionObjects){

      //? If the property exists
      if (isNotUndef(obj[k])){

        //? If it is not a font, turn it uppercase
        if (k != "font") obj[k] = obj[k].toUpperCase()

        //? If we try to parse it as the "actual useful value", and get undefined, use default
        if (undefined === ( k == "font" ? getFont(obj[k]) : getKeyOf(optionObjects[k], obj[k])) )
          obj[k] = defaultConfig.LayerFormatObject[k]
      }
    }

    //? Validate "duplicate"
    validatePropertyType(obj, defaultConfig.LayerFormatObject, "duplicate")
    //? If "duplicate" is not true, set objBefore as undefined
    if (!obj["duplicate"]) objBefore = undefined

    for (var k in obj){

      //* Type Validation
      validatePropertyType(obj, defaultConfig.LayerFormatObject, k)

      //? We delete the property if the value is equal the default one
      //? If objBefore is defined, we only delete the property if objBefore[k] is undefined
      if (obj[k] === defaultConfig.LayerFormatObject[k] && (isNotUndef(objBefore) ? objBefore[k] === undefined : true ))
        delete obj[k]

    }
  }
}






function isNewPage(line) {
  if (config.pageIdentifierPrefix == "" && config.pageIdentifierSuffix == "") return false
  const res = line.startsWith(config.pageIdentifierPrefix) && line.endsWith(config.pageIdentifierSuffix)
  if (config.ignorePageNumber)
    return res
  else
    return res && !isNaN(getPageNumber(line))
}

function isCustomFormatted(line, format){
  if (!format.lineIdentifierPrefix && !format.lineIdentifierSuffix) return false
  if (format.lineIdentifierPrefix === undefined) format.lineIdentifierPrefix = ""
  if (format.lineIdentifierSuffix === undefined) format.lineIdentifierSuffix = ""


  return line.startsWith(format.lineIdentifierPrefix) && line.endsWith(format.lineIdentifierSuffix)
}








//? This Function shall not be in another file
function getFileFromScriptPath(filename) {
  return File((new File($.fileName)).path + "/" + encodeURI(filename))
}

function getPageNumber(str) {
  //? Removes the Prefix and Suffix
  var res = str.slice(config.pageIdentifierPrefix.length, str.length - config.pageIdentifierSuffix.length)
  //? Cleans the line, removing NaN text
  var str = res.replace(/\D/g, "")

  try {
    return parseInt(str)
  } catch (error) {
    throwError("Could not read number from file", error)
  }
}

function getSpecificImage(arr, num) {
  for (var i in arr) {
    var str = arr[i].name
    if (num === parseInt(str.withoutExtension() ))
      return arr[i];
  }
  return undefined;
}

function getFontNames(){
  //? This function is only used as a UI Dropdown list
  //? The first option is hardcoded
  const fontNames = [ "Maintain Unchanged" ]
  //? Push every font name in the array
  for (var i = 0; i < app.fonts.length; i++)
    fontNames.push(app.fonts[i].name)

  return fontNames
}

function getFont(fontName) {
  if (fontName === "") return undefined
  //? Loop through every font
  for (var i = 0; i < app.fonts.length; i++)
    //? search a font with the name including 'fontName'
    if (app.fonts[i].name.indexOf(fontName) > -1)
      return app.fonts[i]
}

function getTypeFolder(groupIndex) {
  var groupName

  if (groupIndex){//?if groupIndex exists, adds the index, else goes for the main folder
    groupName = config.groupLayer.name + "_" + groupIndex
  }
  else {
    groupName = config.groupLayer.name
  }



  if (config.alwaysCreateGroup && !alreadyCreatedTextFolder) {
    alreadyCreatedTextFolder = true
    return createGroupFolder(groupName, groupIndex)
  }


  var textFolder;
  try {
    //? Try to find a folder with name given
    if (!groupIndex){ //? If its not an indexed group (column Group only)
    textFolder = activeDocument.layerSets.getByName(groupName)}
    else{
        textFolder = mainGroup.layerSets.getByName(groupName) //? Gets nested groups inside the main group
    }
  } catch (error) {
    //? If not found, create one

    textFolder = createGroupFolder(groupName, groupIndex)
  }
  return textFolder;
}





















function createImageArray(arrayFiles) {
  const imageArray = []
  const fileNames = []

  for (var i in arrayFiles) {
    var file = arrayFiles[i]
    if (!file.name.endsWithArray(['.txt', '.png', '.jpeg', '.jpg', '.psd', '.psb']))
      alert("One or more files are not supported by this script!\nThis script only supports the extensions:\n.png, .jpg, .jpeg, .psd, .psb, .txt")
    else if (file.name.endsWith('.txt'))
      textFile = !textFile ? file : throwError("More than one text file recognized.")
    else
      imageArray.push(file)

  }

  if (!imageArray.length)
    throwError("Not enough valid image files")



  //* Prioritize Order

  const prioritizeOrder = ['.psd', '.psb', '.png', '.jpg', '.jpeg']

  if (!config.prioritizePSD) {
    prioritizeOrder.push(prioritizeOrder.shift())
    prioritizeOrder.push(prioritizeOrder.shift())
  }


  //* Eliminate Duplicates

  const getExtension = function (str) {
    return str.slice(str.lastIndexOf("."))
  }

  const filename = function (str) { //? Removes extension from str and parses number if it is a number
    try {
      return config.ignorePageNumber ? str.withoutExtension() : parseInt(str.withoutExtension())
    } catch (error) {
      throwError("Could not read number from file", error)
    }
  }





  for (var i = 0; i < imageArray.length; i++) {

    var n = filename(imageArray[i].name)
    var duplicates = []

    for (var j in imageArray) //? Search for file duplicates
      if (n == filename(imageArray[j].name))
        duplicates.push(imageArray[j])

      if (duplicates.length > 1) {
        duplicates.sort(function (a, b) {//? Sort duplicate files
          const aR = getKeyOf(prioritizeOrder, getExtension(a.name).toLowerCase())
          const bR = getKeyOf(prioritizeOrder, getExtension(b.name).toLowerCase())
          if (aR === undefined) return 1
          if (bR === undefined) return -1
          return aR - bR
        })
      }

    for (var j = 1; j < duplicates.length; j++) { //? Remove duplicates from main array
      var index = getKeyOf(imageArray, duplicates[j])
      var removed = imageArray.splice(index, 1)
      //alert("removing " + removed[0].name)
    }
  }

  imageArray = imageArray.sort()


  return imageArray
}

function createContentObj(multipleArchives) {

  if (!textFile || !textFile.name.endsWith('.txt')) {
    throwError("No text file was selected!")
  }

  //? Split text into array of texts
  const rawText = readFile(textFile)
  const textArray = rawText.split("\n")

  const content = {
    0: []
  }
  var current = 0
  for (var t in textArray) {
    var line = textArray[t].trim()
    if (!line) continue; //* Remove Blank strings

    if (isNewPage(line)) {
      current = config.ignorePageNumber ? current + 1 : getPageNumber(line)
      content[current] = []
    } else {
      content[current].push(line)
    }
  }

  if (multipleArchives)
    delete content[0] //? Deletes text before the first identifier


  //? Check if have lines to process
  var haveLines = false

  for (var pageKey in content) {
    var page = content[pageKey]
    for (var lineKey in page){
      haveLines = true
      break;
    }
    if (haveLines) break;
  }

  if (!haveLines)
    throwError("Not enough text lines to process\n Please check your .txt file and/or page identifiers")

  return content
}

function createGroupFolder(groupName, groupIndex, format) {

  if (format === undefined) format = {}
  if (format.name === undefined) format.name = groupName

  if (!groupIndex) //? if group index is present, creates sub group
    var newFolder = activeDocument.layerSets.add()
  else
    var newFolder = mainGroup.layerSets.add()

  formatLayer(newFolder, format)

  return newFolder

}













function formatLayer(layer, format) {
  if (format === undefined || layer === undefined) return;

  //* Is Background - This property can break many of the other ones
  //! it breaks 'Naming', 'Locking' and Text Features(probably)
  if (isNotUndef(format.isBackgroundLayer)) layer.isBackgroundLayer = format.isBackgroundLayer
  if (layer.isBackgroundLayer) {
    if (isNotUndef(format.visible)) layer.visible = format.visible
    return;
  }

  //* Naming
  if (isNotUndef(format.name)) layer.name = format.name


  //* Locking
  if (isNotUndef(format.transparentPixelsLocked)) layer.transparentPixelsLocked = format.transparentPixelsLocked
  if (isNotUndef(format.pixelsLocked)) layer.pixelsLocked = format.pixelsLocked
  if (isNotUndef(format.positionLocked)) layer.positionLocked = format.positionLocked

  if (isNotUndef(format.allLocked)) {
    layer.allLocked = format.allLocked
    if (layer.allLocked) {
      layer.transparentPixelsLocked = false
      layer.pixelsLocked = false
      layer.positionLocked = false
    }
  } else if (layer.transparentPixelsLocked || layer.pixelsLocked || layer.positionLocked)
    layer.allLocked = false



  //* Text Features
  if (layer.kind === LayerKind.TEXT) {

    const txt = layer.textItem

    if (isNotUndef(format.font)){
      var font = getFont(format.font)
      if (isNotUndef(font)) txt.font = font.postScriptName
    }
    if (isNotUndef(format.size) && format.size > 0)
      txt.size = format.size

    if (isNotUndef(format.color) && format.color.length){
      const color = new SolidColor();
      color.rgb.hexValue = format.color.slice(1);
      txt.color = color
    }

    if (isNotUndef(format.justification) && format.justification.length)
      txt.justification = Justification[format.justification.toUpperCase()]
    if (isNotUndef(format.language) && format.language.length)
      txt.language = Language[format.language.toUpperCase()]
    if (isNotUndef(format.antiAlias) && format.antiAlias.length)
      txt.antiAliasMethod = AntiAlias[format.antiAlias.toUpperCase()]
    if (isNotUndef(format.capitalization) && format.capitalization.length)
      txt.capitalization = TextCase[format.capitalization.toUpperCase()]


    if (isNotUndef(format.boxText)) txt.kind = format.boxText ? TextType.PARAGRAPHTEXT : TextType.POINTTEXT

  }

  if (isNotUndef(format.blendMode) && format.blendMode.length)
    layer.blendMode = BlendMode[format.blendMode.toUpperCase()]



  if (isNotUndef(format.opacity)) layer.opacity = format.opacity
  if (isNotUndef(format.grouped)) layer.grouped = format.grouped

  //* Visibility - always last
  if (isNotUndef(format.visible)) layer.visible = format.visible

}


//? Function for inserting texts in each page
function insertPageTexts(page, updateAtEachLine) {
  const positionArray = calculatePositions(page)
  var currentGroup
  var mainGroup

  for (var i in page) {
    var line = page[i]
    var format = undefined


    if (!config.disableCustomTextFormats){
      if (isNotUndef(config.ignoreCustomWith) && config.ignoreCustomWith.length && line.startsWith(config.ignoreCustomWith)){
        line = line.slice(config.ignoreCustomWith.length)
      }
      else if (isNotUndef(config.customTextFormats)){
          for (var j in config.customTextFormats){

            //? Similar to isNewPage()
            if (isCustomFormatted(line, config.customTextFormats[j])) {
              line = line.slice(config.customTextFormats[j].lineIdentifierPrefix.length)
              format = config.customTextFormats[j]
              break;
            }
          }
        }
      }

    if (!continueProcessing) break;

    writeTextLayer(line, i < page.length - 1, positionArray[i], format, currentGroup)
    if (updateAtEachLine) ProcessingWindowObj.update()
  }

}


function writeTextLayer(text, activateDuplication, positionArray, format) {


  function defaultTextLayer() {
    //* Creating PlaceHolder Layer
    if (config.columnGroup){
      mainGroup = getTypeFolder()
    }

    currentGroup = getTypeFolder(config.columnGroup ? positionArray.group : undefined)

    const txtLayer = currentGroup.artLayers.add()
    txtLayer.name = "PlaceHolder Layer"
    txtLayer.kind = LayerKind.TEXT

    //* Default Formatting
    if (isNotUndef(config.defaultTextFormat))
      formatLayer(txtLayer, config.defaultTextFormat)
    return txtLayer;
  }


  const txtLayer = duplicatedLayer === undefined ? defaultTextLayer() : duplicatedLayer


  if (config.columnGroup){
  if (!currentGroup.name.endsWith((positionArray.group.toString()))){
    currentGroup = getTypeFolder(positionArray.group)
    txtLayer.move(currentGroup,ElementPlacement.INSIDE)
  }
}
  duplicatedLayer = undefined;

  if (activateDuplication){
    duplicatedLayer = txtLayer.duplicate()
  }
  //* Set Text
  txtLayer.textItem.contents = text
  txtLayer.name = text

  if (format) formatLayer(txtLayer, format)

  //? Positioning

  txtLayer.textItem.position = [positionArray.xPosition, positionArray.yPosition]
  txtLayer.textItem.width = positionArray.width
  txtLayer.textItem.height = positionArray.height

}

//* Calculate the positioning of all the text in a page
function calculatePositions(textArray) {
  const yBorder = activeDocument.height * 0.02
  const xBorder = activeDocument.width * 0.02
  positionData = []
  const layerPosition = {
    yPosition: yBorder, //*Initially, the margin of the document
    xPosition: xBorder,
    height: undefined,
    width: activeDocument.width * 0.2, //*maybe customizable in the future
    group: 1
  }

  for (var i in textArray) {
    var line = textArray[i]

    if (config.disableCustomTextFormats){
    layerPosition.height = (config.defaultTextFormat.size * 1.1) * Math.ceil(line.length / (layerPosition.width / (6 * config.defaultTextFormat.size / 7))) //! Attention
    }

    else {
          if (isNotUndef(config.customTextFormats)){
            for (var j in config.customTextFormats){
              //? Similar to isNewPage()
              if (isCustomFormatted(line, config.customTextFormats[j])) {
                layerPosition.height = (config.customTextFormats[j].size * 1.1) * Math.ceil(line.length / (layerPosition.width / (6 * config.customTextFormats[j].size / 7))) //! Attention
                break;
              }
            }
          }
        if (layerPosition.height === undefined){
          layerPosition.height = (config.defaultTextFormat.size * 1.1) * Math.ceil(line.length / (layerPosition.width / (6 * config.defaultTextFormat.size / 7))) //! Attention
        }
    }
    positionData.push(getCopy(layerPosition))

    layerPosition.yPosition += yBorder + layerPosition.height //*yPosition += The size of the text Box + border

    if (layerPosition.yPosition >= activeDocument.height) { //*if the bottom of the file is reached
      layerPosition.yPosition = yBorder //*Reset yPosition
      layerPosition.xPosition += xBorder + layerPosition.width //*increment the x value to create a new column
      layerPosition.group += 1 //*Goes to the next group

    }

    layerPosition.height = undefined //? Resets height for custom format check
  }
  return positionData
}



/* -------------------------------------------------------------------------- */
/*                            Main Window Interface                           */
/* -------------------------------------------------------------------------- */


function MainWindow() {

  //* Create a new one by default
  const UI = new createMainWindow(getKeys(justificationObj), getKeys(languageObj), fontNamesArray)

  //* Set New Variables
  UI.arrayFiles = []
  UI.Executing = undefined
  UI.firstFont = undefined


  //* Dropdown Sizes
  UI.fontListDD.maximumSize = dropDownSizes
  UI.justificationDD.maximumSize = dropDownSizes
  UI.languageDD.maximumSize = dropDownSizes


  //* Set New Properties
  UI.win.defaultElement = UI.confirmBtn;
  UI.win.cancelElement = UI.cancelBtn;
  UI.resetConfigBtn.enabled = getFileFromScriptPath(savedConfigPath).exists


  //* Functions

  function setUIConfigs() {

    //? Simple Ones

    UI.pageIdentifierPrefixBox.text = config.pageIdentifierPrefix
    UI.pageIdentifierSuffixBox.text = config.pageIdentifierSuffix
    UI.ignorePageNumberCB.value = config.ignorePageNumber

    UI.prioritizePSDCB.value = config.prioritizePSD
    UI.selectAllFilesCB.value = config.selectAllFiles
    UI.alwaysCreateGroupCB.value = config.alwaysCreateGroup

    UI.columnGroupCB.value = config.columnGroup
    UI.disableCustomTextFormatsCB.value = config.disableCustomTextFormats

    UI.groupNameBox.text = isNotUndef(config.groupLayer.name) ? config.groupLayer.name : defaultConfig.groupLayer.name
    UI.visibleGroupCB.value = isNotUndef(config.groupLayer.visible) ? config.groupLayer.visible : defaultConfig.LayerFormatObject.visible

    UI.fontSizeBox.text = isNotUndef(config.defaultTextFormat.size) ? config.defaultTextFormat.size :  defaultConfig.LayerFormatObject.size
    UI.boxTextCB.value = isNotUndef(config.defaultTextFormat.boxText) ? config.defaultTextFormat.boxText :  defaultConfig.LayerFormatObject.boxText


    //? Complex Ones - this is used to select the valid option on every dropdown

    var fontListDDFont = getFont(isNotUndef(config.defaultTextFormat.font) ? config.defaultTextFormat.font :  defaultConfig.LayerFormatObject.font)
    UI.fontListDD.selection = isNotUndef(fontListDDFont) ? UI.fontListDD.find(fontListDDFont.name) | 0 : 0
    if (UI.firstFont === undefined) UI.firstFont = UI.fontListDD.selection.text

    var justificationDDKey = getKeyOf(justificationObj, isNotUndef(config.defaultTextFormat.justification) ? config.defaultTextFormat.justification.toUpperCase() :  defaultConfig.LayerFormatObject.justification)
    UI.justificationDD.selection = UI.justificationDD.find( justificationDDKey ) | 0

    var languageDDKey = getKeyOf(languageObj, isNotUndef(config.defaultTextFormat.language) ? config.defaultTextFormat.language.toUpperCase() :  defaultConfig.LayerFormatObject.language)
    UI.languageDD.selection = UI.languageDD.find( languageDDKey ) | 0

    app.refresh(); //? Fallback
  }

  function getUIConfigs() {

    //? Common Properties

    config.pageIdentifierPrefix = UI.pageIdentifierPrefixBox.text
    config.pageIdentifierSuffix = UI.pageIdentifierSuffixBox.text
    config.ignorePageNumber = UI.ignorePageNumberCB.value

    config.prioritizePSD = UI.prioritizePSDCB.value
    config.selectAllFiles = UI.selectAllFilesCB.value
    config.alwaysCreateGroup = UI.alwaysCreateGroupCB.value

    config.columnGroup = UI.columnGroupCB.value
    config.disableCustomTextFormats = UI.disableCustomTextFormatsCB.value

    //? groupLayer Properties

    config.groupLayer.name = UI.groupNameBox.text
    config.groupLayer.visible = UI.visibleGroupCB.value

    //? defaultTextFormat Properties

    config.defaultTextFormat.size = UI.fontSizeBox.text
    config.defaultTextFormat.boxText = UI.boxTextCB.value

    if (UI.firstFont != UI.fontListDD.selection.text)
      config.defaultTextFormat.font = UI.fontListDD.selection.index ? UI.fontListDD.selection.text : defaultConfig.LayerFormatObject.font
    config.defaultTextFormat.justification = justificationObj[UI.justificationDD.selection.text]
    config.defaultTextFormat.language = languageObj[UI.languageDD.selection.text]

    clearConfig() //* Asserting Integrity
  }


  //* Set Methods

  UI.initialize = function () {
    setUIConfigs()
    UI.win.show()
  }

  UI.openFolderBtn.onClick = function () {
    getFileFromScriptPath("").execute()
  }

  UI.registerConfigBtn.onClick = function () {
    if ( saveConfig() ){ //? Blank to import
      UI.resetConfigBtn.enabled = true;
      setUIConfigs()
      app.refresh()
    }
  }

  UI.saveConfigBtn.onClick = function () {

    getUIConfigs()

    const comparedConfig = getFileFromScriptPath(savedConfigPath).exists ? readJson(savedConfigPath, "Saved configuration") : defaultConfig

    if (!isEqualObjects(config, comparedConfig)) {
      saveConfig(config)
    } else {
      alert("Nothing changed.")
    }
  }

  UI.starterLayersBtn.onClick = function () {
    showTabbedWindow(true)
  }

  UI.customTextFormatsBtn.onClick = function () {
    showTabbedWindow(false)
  }

  UI.resetConfigBtn.onClick = function () {
    const savedFile = getFileFromScriptPath(savedConfigPath)
    if (!savedFile.exists) return;

    try {
      savedFile.remove()
    } catch (error) {
      throwError("Something went wrong when trying to delete saved configuration.", error)
    }

    UI.resetConfigBtn.enabled = false;
    readConfig()
    setUIConfigs()

  }

  UI.groupNameBox.onChange = function () {
    if (!UI.groupNameBox.text.length)
      UI.groupNameBox.text = isNotUndef(config.groupLayer.name) ? config.groupLayer.name : defaultConfig.groupLayer.name
  }

  UI.fontSizeBox.onChanging = function () {
    UI.fontSizeBox.text = UI.fontSizeBox.text.replace(/[^0-9]/g, '')
    if (!UI.fontSizeBox.text.length || isNaN(parseInt(UI.fontSizeBox.text)) )
      UI.fontSizeBox.text = 0

    if (parseInt(UI.fontSizeBox.text) > 255) UI.fontSizeBox.text = 255
  }
  UI.fontSizeBox.onChange = UI.fontSizeBox.onChanging
  UI.fontSizeBox.onChanging()

  UI.selectFilesBtn.onClick = function () {
    try {
      if (UI.selectAllFilesCB.value)
        UI.arrayFiles = File.openDialog("Select Files", ["All:*.txt;*.png;*.jpeg;*.jpg;*.psd;*.psb", "Text:*.txt", "Images:*.png;*.jpeg;*.jpg;*.psd;*.psb"], true)
      else
        UI.arrayFiles = Folder.selectDialog("Select Folder").getFiles()
    } catch (error) {}

    if (!Array.isArray(UI.arrayFiles)) arrayFiles = []

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
    UI.confirmBtn.onClick = undefined //? Ensure This will run only once

    //* Close Window
    UI.win.close()

    //* Set Configuration Object
    getUIConfigs()

    if (typeof UI.Executing === "function") UI.Executing();
  }

  return UI
}