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
/*                               User Interface                               */
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
    showStarterLayerUI()
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


















































function createStarterLayerTab(index, layerFormat, tabPanel_innerwrap){

  var blendModeDD_array = getKeys(blendModeObj)

  /*
  Just Tab Part:
  {"items":{"item-0":{"id":0,"type":"Dialog","parentId":false,"style":{"text":"Custom Layer Editor","preferredSize":[0,0],"margins":16,"orientation":"column","spacing":10,"alignChildren":["left","top"],"varName":"tab1","windowType":"Dialog","creationProps":{"su1PanelCoordinates":false,"maximizeButton":false,"minimizeButton":false,"independent":false,"closeButton":true,"borderless":false,"resizeable":false},"enabled":true}},"item-42":{"id":42,"type":"Group","parentId":67,"style":{"enabled":true,"varName":null,"preferredSize":[0,0],"margins":0,"orientation":"row","spacing":6,"alignChildren":["right","center"],"alignment":null}},"item-43":{"id":43,"type":"StaticText","parentId":42,"style":{"enabled":true,"varName":null,"creationProps":{"truncate":"none","multiline":false,"scrolling":false},"softWrap":false,"text":"Layer Name","justify":"left","preferredSize":[0,0],"alignment":null,"helpTip":null}},"item-44":{"id":44,"type":"EditText","parentId":42,"style":{"enabled":true,"varName":"nameBox","creationProps":{"noecho":false,"readonly":false,"multiline":false,"scrollable":false,"borderless":false,"enterKeySignalsOnChange":false},"softWrap":false,"text":"Raw","justify":"left","preferredSize":[100,0],"alignment":"fill","helpTip":null}},"item-48":{"id":48,"type":"Checkbox","parentId":61,"style":{"enabled":true,"varName":"visibleCB","text":"Visible","preferredSize":[0,0],"alignment":null,"helpTip":"Visibility of the layer","checked":true}},"item-49":{"id":49,"type":"Checkbox","parentId":61,"style":{"enabled":true,"varName":"isBackgroundLayerCB","text":"Is Background Layer","preferredSize":[0,0],"alignment":null,"helpTip":"Check this to make the layer, the background layer"}},"item-51":{"id":51,"type":"Panel","parentId":67,"style":{"enabled":true,"varName":null,"creationProps":{"borderStyle":"etched","su1PanelCoordinates":false},"text":"Locking","preferredSize":[0,0],"margins":10,"orientation":"column","spacing":10,"alignChildren":["fill","top"],"alignment":null}},"item-52":{"id":52,"type":"Checkbox","parentId":51,"style":{"enabled":true,"varName":"allLockedCB","text":"All Locked","preferredSize":[0,0],"alignment":"center","helpTip":null}},"item-53":{"id":53,"type":"Checkbox","parentId":51,"style":{"enabled":true,"varName":"transparentPixelsLockedCB","text":"Transparent Pixels Locked","preferredSize":[0,0],"alignment":null,"helpTip":null}},"item-54":{"id":54,"type":"Checkbox","parentId":51,"style":{"enabled":true,"varName":"pixelsLockedCB","text":"Pixels Locked","preferredSize":[0,0],"alignment":null,"helpTip":null}},"item-55":{"id":55,"type":"Checkbox","parentId":51,"style":{"enabled":true,"varName":"positionLockedCB","text":"Position Locked","preferredSize":[0,0],"alignment":null,"helpTip":null}},"item-56":{"id":56,"type":"Checkbox","parentId":61,"style":{"enabled":true,"varName":"groupedCB","text":"Clipping Mask","preferredSize":[0,0],"alignment":null,"helpTip":""}},"item-58":{"id":58,"type":"Slider","parentId":59,"style":{"enabled":true,"varName":"opacitySlider","preferredSize":[100,0],"alignment":"fill","helpTip":null}},"item-59":{"id":59,"type":"Group","parentId":67,"style":{"enabled":true,"varName":null,"preferredSize":[0,0],"margins":0,"orientation":"row","spacing":10,"alignChildren":["right","center"],"alignment":"fill"}},"item-60":{"id":60,"type":"StaticText","parentId":59,"style":{"enabled":true,"varName":null,"creationProps":{"truncate":"none","multiline":false,"scrolling":false},"softWrap":false,"text":"Opacity","justify":"left","preferredSize":[0,0],"alignment":null,"helpTip":null}},"item-61":{"id":61,"type":"Panel","parentId":67,"style":{"enabled":true,"varName":null,"creationProps":{"borderStyle":"etched","su1PanelCoordinates":false},"text":"","preferredSize":[0,0],"margins":10,"orientation":"column","spacing":10,"alignChildren":["left","top"],"alignment":null}},"item-62":{"id":62,"type":"Checkbox","parentId":61,"style":{"enabled":true,"varName":"duplicateCB","text":"Duplicate","preferredSize":[0,0],"alignment":null,"helpTip":"This will duplicate the layer below/before"}},"item-64":{"id":64,"type":"Button","parentId":67,"style":{"enabled":true,"varName":"deleteBtn","text":"Delete","justify":"center","preferredSize":[0,0],"alignment":"fill","helpTip":"Delete this Layer"}},"item-67":{"id":67,"type":"Panel","parentId":0,"style":{"enabled":true,"varName":null,"creationProps":{"borderStyle":"etched","su1PanelCoordinates":false},"text":"","preferredSize":[0,0],"margins":10,"orientation":"column","spacing":10,"alignChildren":["fill","top"],"alignment":"fill"}},"item-68":{"id":68,"type":"Group","parentId":67,"style":{"enabled":true,"varName":null,"preferredSize":[0,0],"margins":0,"orientation":"column","spacing":10,"alignChildren":["center","center"],"alignment":null}},"item-69":{"id":69,"type":"StaticText","parentId":68,"style":{"enabled":true,"varName":null,"creationProps":{"truncate":"none","multiline":false,"scrolling":false},"softWrap":false,"text":"Blend Mode","justify":"center","preferredSize":[0,0],"alignment":null,"helpTip":null}},"item-70":{"id":70,"type":"DropDownList","parentId":68,"style":{"enabled":true,"varName":"blendModeDD","text":"DropDownList","listItems":"Item 1, -, Item 2","preferredSize":[0,0],"alignment":"fill","selection":0,"helpTip":null}}},"order":[0,67,42,43,44,59,60,58,68,69,70,61,48,56,49,62,51,52,53,54,55,64],"settings":{"importJSON":true,"indentSize":false,"cepExport":false,"includeCSSJS":true,"functionWrapper":false,"compactCode":false,"showDialog":true,"afterEffectsDockable":false,"itemReferenceList":"var"},"activeId":70}
  */
  const tab
  if (index){
  tab = tabPanel_innerwrap.add("group", undefined, {name: "Layer " + (index)});
  tab.text = "Layer " + (index);}
  else{
  tab = tabPanel_innerwrap.add("group", undefined, {name: "Raw Layer"});
  tab.text = "Raw Layer";
  }
  tab.orientation = "column";
  tab.alignChildren = ["fill","top"];
  tab.spacing = 10;
  tab.margins = 0;



  // PANEL1
  // ======
  var panel1 = tab.add("panel", undefined, undefined, {name: "panel1"});
      panel1.orientation = "column";
      panel1.alignChildren = ["fill","top"];
      panel1.spacing = 10;
      panel1.margins = 10;
      panel1.alignment = ["fill","top"];

  // GROUP1
  // ======
  var group1 = panel1.add("group", undefined, {name: "group1"});
      group1.orientation = "row";
      group1.alignChildren = ["right","center"];
      group1.spacing = 6;
      group1.margins = 0;

  var nameBox = group1.add("statictext", undefined, undefined, {name: "nameBox"});
      nameBox.text = "Layer Name";

  var nameBox = group1.add('edittext {properties: {name: "nameBox"}}');
      nameBox.text = "Raw";
      nameBox.preferredSize.width = 100;
      nameBox.alignment = ["right","fill"];

  // GROUP2
  // ======
  var group2 = panel1.add("group", undefined, {name: "group2"});
      group2.orientation = "row";
      group2.alignChildren = ["right","center"];
      group2.spacing = 10;
      group2.margins = 0;
      group2.alignment = ["fill","top"];

  var statictext2 = group2.add("statictext", undefined, undefined, {name: "statictext2"});
      statictext2.text = "Opacity";

  var opacitySlider = group2.add("slider", undefined, undefined, undefined, undefined, {name: "opacitySlider"});
      opacitySlider.minvalue = 0;
      opacitySlider.maxvalue = 100;
      opacitySlider.value = 100;
      opacitySlider.preferredSize.width = 100;
      opacitySlider.alignment = ["right","fill"];

// GROUP3
// ======
var group3 = panel1.add("group", undefined, {name: "group3"});
    group3.orientation = "row";
    group3.alignChildren = ["right","center"];
    group3.spacing = 10;
    group3.margins = 0;

var statictext3 = group3.add("statictext", undefined, undefined, {name: "statictext3"});
    statictext3.text = "Blend Mode";
    statictext3.justify = "center";

var blendModeDD = group3.add("dropdownlist", undefined, undefined, {name: "blendModeDD", items: blendModeDD_array});
    blendModeDD.alignment = ["right","fill"];

  // PANEL2
  // ======
  var panel2 = panel1.add("panel", undefined, undefined, {name: "panel2"});
      panel2.orientation = "column";
      panel2.alignChildren = ["left","top"];
      panel2.spacing = 10;
      panel2.margins = 10;

  var visibleCB = panel2.add("checkbox", undefined, undefined, {name: "visibleCB"});
      visibleCB.helpTip = "Visibility of the layer";
      visibleCB.text = "Visible";
      visibleCB.value = true;

  var groupedCB = panel2.add("checkbox", undefined, undefined, {name: "groupedCB"});
      groupedCB.text = "Clipping Mask";

  // PANEL3
  // ======
  var panel3 = panel1.add("panel", undefined, undefined, {name: "panel3"});
      panel3.text = "Locking";
      panel3.orientation = "column";
      panel3.alignChildren = ["fill","top"];
      panel3.spacing = 10;
      panel3.margins = 10;

  var allLockedCB = panel3.add("checkbox", undefined, undefined, {name: "allLockedCB"});
      allLockedCB.text = "All Locked";
      allLockedCB.alignment = ["center","top"];

  var transparentPixelsLockedCB = panel3.add("checkbox", undefined, undefined, {name: "transparentPixelsLockedCB"});
      transparentPixelsLockedCB.text = "Transparent Pixels Locked";

  var pixelsLockedCB = panel3.add("checkbox", undefined, undefined, {name: "pixelsLockedCB"});
      pixelsLockedCB.text = "Pixels Locked";

  var positionLockedCB = panel3.add("checkbox", undefined, undefined, {name: "positionLockedCB"});
      positionLockedCB.text = "Position Locked";


  //* -------------------------------------------------------------

  //? --------- Fallbacks ---------

  var duplicateCB = { value:false }
  var isBackgroundLayerCB = { value:false }

  //? --------- Conditional Object Creation ---------



  if (index){
    //? Index is more than 1

    duplicateCB = panel2.add("checkbox", undefined, undefined, {name: "duplicateCB"});
      duplicateCB.helpTip = "This will duplicate the layer below/before";
      duplicateCB.text = "Duplicate";

    var deleteBtn = panel1.add("button", undefined, undefined, {name: "deleteBtn"});
      deleteBtn.helpTip = "Delete this Layer";
      deleteBtn.text = "Delete";
      deleteBtn.alignment = ["fill","top"];

  } else {
    //? Index is 0
    tab.text = "Original Layer"
    isBackgroundLayerCB = panel2.add("checkbox", undefined, undefined, {name: "isBackgroundLayerCB"});
      isBackgroundLayerCB.helpTip = "Check this to make the layer, the background layer";
      isBackgroundLayerCB.text = "Is Background Layer";

  }



  //? --------- Functions ---------


  function changeOne(element, enabled, value){
    element.enabled = enabled

    if (isNotUndef(value)){

      if (element.type == "checkbox"){
        element.value = value

      } else if (element.type == "slider" && !value){
        element.value = 100
        element.onChange()
      }

    }
  }

  function changeAll(array, enabled, value){
    for (var i = 0, l = array.length; i < l; i++)
      changeOne(array[i], enabled, value)
  }



  //? --------- Set Properties ---------

  tab.alignment = ["fill","fill"];
  tab.visible = false;

  blendModeDD.maximumSize = dropDownSizes

  opacitySlider.onChange = function () {

    opacitySlider.helpTip = opacitySlider.value
  }
  opacitySlider.onChanging = opacitySlider.onChange //? Fallback

  allLockedCB.onClick = function () {
    if (allLockedCB.value)
      changeAll([transparentPixelsLockedCB, pixelsLockedCB, positionLockedCB], false, false)
     else
      changeAll([transparentPixelsLockedCB, pixelsLockedCB, positionLockedCB], true)
  }


  nameBox.onChange = function () {
    if (!nameBox.text.length)
      nameBox.text = defaultConfig.LayerFormatObject.name
  }


  if (index){
    //? Index is more than 1

    duplicateCB.value = isNotUndef(layerFormat.duplicate) ? layerFormat.duplicate : defaultConfig.LayerFormatObject.duplicate
    deleteBtn.onClick = function () {
        tabPanel_innerwrap.deleteLayer(index)
    }

  } else {
    //? Index is 0

    isBackgroundLayerCB.onClick = function () {
      if (isBackgroundLayerCB.value){
        changeOne(visibleCB, false, true)
        changeAll([nameBox,opacitySlider,allLockedCB,transparentPixelsLockedCB, pixelsLockedCB, positionLockedCB], false, false)
      } else {
        changeOne(visibleCB, true)
        changeAll([nameBox,opacitySlider,allLockedCB,transparentPixelsLockedCB, pixelsLockedCB, positionLockedCB], true)
      }
    }

    isBackgroundLayerCB.value = isNotUndef(layerFormat.isBackgroundLayer) ? layerFormat.isBackgroundLayer : defaultConfig.LayerFormatObject.isBackgroundLayer
    isBackgroundLayerCB.onClick()

    groupedCB.enabled = false
  }


  nameBox.text = isNotUndef(layerFormat.name) ? layerFormat.name : defaultConfig.LayerFormatObject.name
  opacitySlider.value = isNotUndef(layerFormat.opacity) ? layerFormat.opacity : defaultConfig.LayerFormatObject.opacity
  visibleCB.value = isNotUndef(layerFormat.visible) ? layerFormat.visible : defaultConfig.LayerFormatObject.visible
  groupedCB.value = isNotUndef(layerFormat.grouped) ? layerFormat.grouped : defaultConfig.LayerFormatObject.grouped
  allLockedCB.value = isNotUndef(layerFormat.allLocked) ? layerFormat.allLocked : defaultConfig.LayerFormatObject.allLocked
  transparentPixelsLockedCB.value = isNotUndef(layerFormat.transparentPixelsLocked) ? layerFormat.transparentPixelsLocked : defaultConfig.LayerFormatObject.transparentPixelsLocked
  pixelsLockedCB.value = isNotUndef(layerFormat.pixelsLocked) ? layerFormat.pixelsLocked : defaultConfig.LayerFormatObject.pixelsLocked
  positionLockedCB.value = isNotUndef(layerFormat.positionLocked) ? layerFormat.positionLocked : defaultConfig.LayerFormatObject.positionLocked

  var blendModeDDKey = getKeyOf(blendModeObj, isNotUndef(layerFormat.blendMode) ? layerFormat.blendMode.toUpperCase() : defaultConfig.LayerFormatObject.blendMode)
  blendModeDD.selection = blendModeDD.find( blendModeDDKey ) | 0


  allLockedCB.onClick()
  opacitySlider.onChange()


  tab.items = {
    tab: tab, // dialog
    nameBox: nameBox, // textBox
    opacitySlider: opacitySlider, // slider
    visibleCB: visibleCB, // checkbox
    groupedCB: groupedCB, // checkbox
    isBackgroundLayerCB: isBackgroundLayerCB, // checkbox
    duplicateCB: duplicateCB, // checkbox
    allLockedCB: allLockedCB, // checkbox
    transparentPixelsLockedCB: transparentPixelsLockedCB, // checkbox
    pixelsLockedCB: pixelsLockedCB, // checkbox
    positionLockedCB: positionLockedCB, // checkbox
    blendModeDD: blendModeDD // dropdown
  };

  return tab
  }




function createStarterLayerUI(repeatIndex){

  /*
  JSON Starter Layers:
  {"items":{"item-0":{"id":0,"type":"Dialog","parentId":false,"style":{"text":"Custom Layer Editor","preferredSize":[0,0],"margins":16,"orientation":"column","spacing":10,"alignChildren":["left","top"],"varName":"win","windowType":"Dialog","creationProps":{"su1PanelCoordinates":false,"maximizeButton":false,"minimizeButton":false,"independent":false,"closeButton":true,"borderless":false,"resizeable":false},"enabled":true}},"item-36":{"id":36,"type":"Group","parentId":0,"style":{"preferredSize":[0,0],"margins":0,"orientation":"row","spacing":10,"alignChildren":["left","center"],"alignment":null,"varName":null,"enabled":true}},"item-38":{"id":38,"type":"Button","parentId":36,"style":{"text":"Close","justify":"center","preferredSize":[0,0],"alignment":null,"varName":"closeBtn","helpTip":null,"enabled":true}},"item-39":{"id":39,"type":"VerticalTabbedPanel","parentId":0,"style":{"enabled":true,"varName":"tabPanel","preferredSize":[0,0],"tabNavWidth":0,"margins":0,"alignment":null,"selection":40}},"item-40":{"id":40,"type":"Tab","parentId":39,"style":{"enabled":true,"varName":"nameBox","text":"Layer 1","orientation":"column","spacing":10,"alignChildren":["fill","top"]}},"item-41":{"id":41,"type":"Tab","parentId":39,"style":{"enabled":true,"varName":null,"text":"Layer 2","orientation":"column","spacing":10,"alignChildren":["fill","top"]}},"item-42":{"id":42,"type":"Group","parentId":67,"style":{"enabled":true,"varName":null,"preferredSize":[0,0],"margins":0,"orientation":"row","spacing":6,"alignChildren":["right","center"],"alignment":null}},"item-43":{"id":43,"type":"StaticText","parentId":42,"style":{"enabled":true,"varName":null,"creationProps":{"truncate":"none","multiline":false,"scrolling":false},"softWrap":false,"text":"Layer Name","justify":"left","preferredSize":[0,0],"alignment":null,"helpTip":null}},"item-44":{"id":44,"type":"EditText","parentId":42,"style":{"enabled":true,"varName":null,"creationProps":{"noecho":false,"readonly":false,"multiline":false,"scrollable":false,"borderless":false,"enterKeySignalsOnChange":false},"softWrap":false,"text":"Raw","justify":"left","preferredSize":[100,0],"alignment":"fill","helpTip":null}},"item-48":{"id":48,"type":"Checkbox","parentId":61,"style":{"enabled":true,"varName":"visibleCB","text":"Visible","preferredSize":[0,0],"alignment":null,"helpTip":"Visibility of the layer","checked":true}},"item-49":{"id":49,"type":"Checkbox","parentId":61,"style":{"enabled":true,"varName":"isBackgroundLayerCB","text":"Is Background Layer","preferredSize":[0,0],"alignment":null,"helpTip":"Check this to make the layer, the background layer"}},"item-51":{"id":51,"type":"Panel","parentId":67,"style":{"enabled":true,"varName":null,"creationProps":{"borderStyle":"etched","su1PanelCoordinates":false},"text":"Locking","preferredSize":[0,0],"margins":10,"orientation":"column","spacing":10,"alignChildren":["fill","top"],"alignment":null}},"item-52":{"id":52,"type":"Checkbox","parentId":51,"style":{"enabled":true,"varName":"allLockedCB","text":"All Locked","preferredSize":[0,0],"alignment":"center","helpTip":null}},"item-53":{"id":53,"type":"Checkbox","parentId":51,"style":{"enabled":true,"varName":"transparentPixelsLockedCB","text":"Transparent Pixels Locked","preferredSize":[0,0],"alignment":null,"helpTip":null}},"item-54":{"id":54,"type":"Checkbox","parentId":51,"style":{"enabled":true,"varName":"pixelsLockedCB","text":"Pixels Locked","preferredSize":[0,0],"alignment":null,"helpTip":null}},"item-55":{"id":55,"type":"Checkbox","parentId":51,"style":{"enabled":true,"varName":"positionLockedCB","text":"Position Locked","preferredSize":[0,0],"alignment":null,"helpTip":null}},"item-56":{"id":56,"type":"Checkbox","parentId":61,"style":{"enabled":true,"varName":"groupedCB","text":"Clipping Mask","preferredSize":[0,0],"alignment":null,"helpTip":""}},"item-58":{"id":58,"type":"Slider","parentId":59,"style":{"enabled":true,"varName":"opacitySlider","preferredSize":[100,0],"alignment":"fill","helpTip":null}},"item-59":{"id":59,"type":"Group","parentId":67,"style":{"enabled":true,"varName":null,"preferredSize":[0,0],"margins":0,"orientation":"row","spacing":10,"alignChildren":["right","center"],"alignment":"fill"}},"item-60":{"id":60,"type":"StaticText","parentId":59,"style":{"enabled":true,"varName":null,"creationProps":{"truncate":"none","multiline":false,"scrolling":false},"softWrap":false,"text":"Opacity","justify":"left","preferredSize":[0,0],"alignment":null,"helpTip":null}},"item-61":{"id":61,"type":"Panel","parentId":67,"style":{"enabled":true,"varName":null,"creationProps":{"borderStyle":"etched","su1PanelCoordinates":false},"text":"","preferredSize":[0,0],"margins":10,"orientation":"column","spacing":10,"alignChildren":["left","top"],"alignment":null}},"item-62":{"id":62,"type":"Checkbox","parentId":61,"style":{"enabled":true,"varName":"duplicateCB","text":"Duplicate","preferredSize":[0,0],"alignment":null,"helpTip":"This will duplicate the layer below/before"}},"item-63":{"id":63,"type":"StaticText","parentId":41,"style":{"enabled":true,"varName":null,"creationProps":{"truncate":"none","multiline":false,"scrolling":false},"softWrap":false,"text":"TESTE LAYER 2","justify":"left","preferredSize":[0,0],"alignment":null,"helpTip":null}},"item-64":{"id":64,"type":"Button","parentId":67,"style":{"enabled":true,"varName":"deleteBtn","text":"Delete","justify":"center","preferredSize":[0,0],"alignment":"fill","helpTip":"Delete this Layer"}},"item-65":{"id":65,"type":"Checkbox","parentId":36,"style":{"enabled":true,"varName":"disableStarterLayerCB","text":"Disable All","preferredSize":[0,0],"alignment":null,"helpTip":"Disable layer creation","checked":true}},"item-66":{"id":66,"type":"Button","parentId":36,"style":{"text":"Add Layer","justify":"center","preferredSize":[0,0],"alignment":null,"varName":"addLayerBtn","helpTip":"Create a new layer below all others","enabled":true}},"item-67":{"id":67,"type":"Panel","parentId":40,"style":{"enabled":true,"varName":null,"creationProps":{"borderStyle":"etched","su1PanelCoordinates":false},"text":"","preferredSize":[0,0],"margins":10,"orientation":"column","spacing":10,"alignChildren":["fill","top"],"alignment":"fill"}}},"order":[0,36,65,66,38,39,40,67,42,43,44,59,60,58,61,48,56,49,62,51,52,53,54,55,64,41,63],"settings":{"importJSON":true,"indentSize":false,"cepExport":false,"includeCSSJS":true,"functionWrapper":false,"compactCode":false,"showDialog":true,"afterEffectsDockable":false,"itemReferenceList":"var"},"activeId":58}
  */

  // WIN
  // ===
  var win = new Window("dialog");
      win.text = "Custom Layer Editor";
      win.orientation = "column";
      win.alignChildren = ["left","top"];
      win.spacing = 10;
      win.margins = 16;



  // GROUP1
  // ======
  var group1 = win.add("group", undefined, {name: "group1"});
      group1.orientation = "row";
      group1.alignChildren = ["left","center"];
      group1.spacing = 10;
      group1.margins = 0;

  var disableStarterLayerCB = group1.add("checkbox", undefined, undefined, {name: "disableStarterLayerCB"});
      disableStarterLayerCB.helpTip = "Disable layer creation";
      disableStarterLayerCB.text = "Disable All";
      disableStarterLayerCB.value = true;

  var addLayerBtn = group1.add("button", undefined, undefined, {name: "addLayerBtn"});
      addLayerBtn.helpTip = "Create a new layer below all others";
      addLayerBtn.text = "Add Layer";

  var closeBtn = group1.add("button", undefined, undefined, {name: "closeBtn"});
      closeBtn.text = "Close";



  // TABPANEL
  // ========
  var tabPanel = win.add("group", undefined, undefined, {name: "tabPanel"});
      tabPanel.alignChildren = ["left","fill"];
  var tabPanel_nav = tabPanel.add ("listbox", undefined, [], { columnWidths: [60]});
  var tabPanel_innerwrap = tabPanel.add("group")
      tabPanel_innerwrap.alignment = ["fill","fill"];
      tabPanel_innerwrap.orientation = ["stack"];




  // * -------------------------------------------------------------------


  const tabPanel_tabs = [];


  //? --------- Functions ---------

  function deleteLayer(index){
    config.starterLayerFormats.splice(index,1)
    tabPanel_tabs.splice(index,1)
    tabPanel_nav.remove(index)
    tabPanel_innerwrap.remove(index)
    tabPanel_nav.selection = index - 1;
  }

  function addLayer(index){

    if (index === undefined || index >= config.starterLayerFormats.length){
      index = config.starterLayerFormats.length
      config.starterLayerFormats.push({})
    }

    tabPanel_tabs.push(createStarterLayerTab(index, config.starterLayerFormats[index], tabPanel_innerwrap))
    if (index){
    tabPanel_nav.add ("item", "Layer " + (index))
    }else{
      tabPanel_nav.add ("item", "Raw Layer")
    }

    tabPanel_nav.selection = index


    if (win.visible){
      win.repeat = index
      win.close()
    }
  }

  function showTab_tabPanel() {
    if ( tabPanel_nav.selection !== null ) {
      for (var i = tabPanel_tabs.length-1; i >= 0; i--)
        tabPanel_tabs[i].visible = false;
      tabPanel_tabs[tabPanel_nav.selection.index].visible = true;
    }
  }

  //? --------- Set Properties ---------

  win.cancelElement = closeBtn
  win.defaultElement = addLayerBtn

  tabPanel_nav.onChange = showTab_tabPanel;
  tabPanel_innerwrap.deleteLayer = deleteLayer
  addLayerBtn.onClick = addLayer

  disableStarterLayerCB.value = config.disableStarterLayer
  disableStarterLayerCB.onClick = function () {
    config.disableStarterLayer = disableStarterLayerCB.value
  }


  //? Add all Layers
  for (var i = 0; i < config.starterLayerFormats.length; i++)
    addLayer(i)

  //? Show the first one by default, or repeatIndex
  tabPanel_nav.selection = repeatIndex === undefined ? 0 : repeatIndex
  showTab_tabPanel() //? Fallback of line above

  win.items = {
    win: win, // dialog
    tabPanel_tabs: tabPanel_tabs,
    disableStarterLayerCB: disableStarterLayerCB, // checkbox
    addLayerBtn: addLayerBtn, // button
    closeBtn: closeBtn, // button
  };

  win.show()

  return {
    tabPanel_tabs: tabPanel_tabs,
    repeat: win.repeat
    }
  }







function showStarterLayerUI(){

    function getUIConfigs(tabs){

      for (var i = 0, len = tabs.length; i < len; i++){
        var tabItems = tabs[i].items
        var layerFormat = config.starterLayerFormats[i]

        layerFormat.name = tabItems.nameBox.text
        layerFormat.duplicate = tabItems.duplicateCB.value
        layerFormat.isBackgroundLayer = tabItems.isBackgroundLayerCB.value
        layerFormat.opacity = tabItems.opacitySlider.value
        layerFormat.visible = tabItems.visibleCB.value
        layerFormat.grouped = tabItems.groupedCB.value
        layerFormat.allLocked = tabItems.allLockedCB.value
        layerFormat.transparentPixelsLocked = tabItems.transparentPixelsLockedCB.value
        layerFormat.pixelsLocked = tabItems.pixelsLockedCB.value
        layerFormat.positionLocked = tabItems.positionLockedCB.value

        layerFormat.blendMode = blendModeObj[tabItems.blendModeDD.selection.text]
      }

      clearConfig() //* Asserting Integrity
    }

    var repeatIndex = 0

    while (isNotUndef(repeatIndex)){

      var obj = createStarterLayerUI(repeatIndex)
      repeatIndex = obj.repeat

      getUIConfigs(obj.tabPanel_tabs)
    }

  }



  //Cemetery





/*
UI 1
{"activeId":50,"items":{"item-0":{"id":0,"type":"Dialog","parentId":false,"style":{"text":"Auto TypeSetter","preferredSize":[0,0],"margins":16,"orientation":"row","spacing":10,"alignChildren":["left","top"],"varName":"this.win","windowType":"Dialog","creationProps":{"su1PanelCoordinates":false,"maximizeButton":false,"minimizeButton":false,"independent":false,"closeButton":true,"borderless":false,"resizeable":false},"enabled":true}},"item-1":{"id":1,"type":"Panel","parentId":20,"style":{"text":"Page Identifiers","preferredSize":[0,0],"margins":10,"orientation":"column","spacing":10,"alignChildren":["left","top"],"alignment":null,"varName":null,"creationProps":{"borderStyle":"etched","su1PanelCoordinates":false},"enabled":true}},"item-4":{"id":4,"type":"StaticText","parentId":6,"style":{"text":"Start","justify":"left","preferredSize":[0,0],"alignment":null,"varName":null,"helpTip":null,"softWrap":true,"creationProps":{"truncate":"none","multiline":false,"scrolling":false},"enabled":true}},"item-5":{"id":5,"type":"EditText","parentId":6,"style":{"text":"[","preferredSize":[60,0],"alignment":null,"varName":"this.pageIdentifierPrefixBox","helpTip":null,"softWrap":false,"creationProps":{"noecho":false,"readonly":false,"multiline":false,"scrollable":false,"borderless":false,"enterKeySignalsOnChange":false},"enabled":true,"justify":"left"}},"item-6":{"id":6,"type":"Group","parentId":1,"style":{"preferredSize":[0,0],"margins":0,"orientation":"row","spacing":10,"alignChildren":["right","center"],"alignment":"center","varName":null,"enabled":true}},"item-9":{"id":9,"type":"Panel","parentId":20,"style":{"text":"Configuration","preferredSize":[0,0],"margins":10,"orientation":"column","spacing":10,"alignChildren":["left","top"],"alignment":null,"varName":null,"creationProps":{"borderStyle":"etched","su1PanelCoordinates":false},"enabled":true}},"item-19":{"id":19,"type":"Group","parentId":0,"style":{"preferredSize":[0,0],"margins":0,"orientation":"column","spacing":10,"alignChildren":["fill","top"],"alignment":null,"varName":null,"enabled":true}},"item-20":{"id":20,"type":"Group","parentId":0,"style":{"preferredSize":[0,0],"margins":0,"orientation":"column","spacing":10,"alignChildren":["fill","top"],"alignment":null,"varName":null,"enabled":true}},"item-21":{"id":21,"type":"Panel","parentId":19,"style":{"text":"Files","preferredSize":[0,0],"margins":10,"orientation":"column","spacing":10,"alignChildren":["fill","top"],"alignment":null,"varName":null,"creationProps":{"borderStyle":"etched","su1PanelCoordinates":false},"enabled":true}},"item-22":{"id":22,"type":"StaticText","parentId":21,"style":{"text":"Select a Folder including:\n- A '.txt' file containing the text\n- Image Files ('1.png', '2.jpg')\n\n(if you don't select images, \nthe script will run on a open\ndocument)","justify":"left","preferredSize":[0,0],"alignment":null,"varName":null,"helpTip":null,"softWrap":true,"creationProps":{"truncate":"none","multiline":false,"scrolling":false},"enabled":true}},"item-36":{"id":36,"type":"Group","parentId":0,"style":{"preferredSize":[0,0],"margins":0,"orientation":"column","spacing":10,"alignChildren":["fill","top"],"alignment":null,"varName":null,"enabled":true}},"item-37":{"id":37,"type":"Button","parentId":36,"style":{"text":"OK","justify":"center","preferredSize":[0,0],"alignment":null,"varName":"this.confirmBtn","helpTip":null,"enabled":false}},"item-38":{"id":38,"type":"Button","parentId":36,"style":{"text":"Cancel","justify":"center","preferredSize":[0,0],"alignment":null,"varName":"this.cancelBtn","helpTip":null,"enabled":true}},"item-40":{"id":40,"type":"Checkbox","parentId":1,"style":{"text":"Ignore Page Number","preferredSize":[0,0],"alignment":null,"varName":"this.ignorePageNumberCB","helpTip":"This will ignore or not numbers between both identifiers","enabled":true,"checked":false}},"item-45":{"id":45,"type":"Group","parentId":1,"style":{"preferredSize":[0,0],"margins":0,"orientation":"row","spacing":10,"alignChildren":["right","center"],"alignment":"center","varName":null,"enabled":true}},"item-46":{"id":46,"type":"StaticText","parentId":45,"style":{"text":"End","justify":"left","preferredSize":[0,0],"alignment":null,"varName":"","helpTip":null,"softWrap":true,"creationProps":{"truncate":"none","multiline":false,"scrolling":false},"enabled":true}},"item-47":{"id":47,"type":"EditText","parentId":45,"style":{"text":"]","preferredSize":[60,0],"alignment":null,"varName":"this.pageIdentifierSuffixBox","helpTip":null,"softWrap":false,"creationProps":{"noecho":false,"readonly":false,"multiline":false,"scrollable":false,"borderless":false,"enterKeySignalsOnChange":false},"enabled":true,"justify":"left"}},"item-48":{"id":48,"type":"Button","parentId":9,"style":{"enabled":true,"varName":"this.registerConfigBtn","text":"Register Config.","justify":"center","preferredSize":[0,0],"alignment":"fill","helpTip":"Select a JSON with your custom configuration to use!  :D"}},"item-49":{"id":49,"type":"Button","parentId":9,"style":{"enabled":false,"varName":"this.resetConfigBtn","text":"Reset Config.","justify":"center","preferredSize":[0,0],"alignment":"fill","helpTip":"This will delete the JSON you registered"}},"item-50":{"id":50,"type":"Button","parentId":9,"style":{"enabled":true,"varName":"this.openFolderBtn","text":"Open Folder","justify":"center","preferredSize":[0,0],"alignment":"fill","helpTip":""}},"item-52":{"id":52,"type":"Checkbox","parentId":21,"style":{"enabled":true,"varName":"this.selectAllFilesCB","text":"Select All Files Instead","preferredSize":[0,0],"alignment":null,"helpTip":"You need to select all files, not a folder containing these files","checked":false}},"item-53":{"id":53,"type":"StaticText","parentId":21,"style":{"enabled":true,"varName":null,"creationProps":{"truncate":"none","multiline":false,"scrolling":false},"softWrap":true,"text":"Formats Supported","justify":"center","preferredSize":[0,0],"alignment":null,"helpTip":"'.png', '.jpeg', '.jpg', '.psd', '.psb'"}},"item-55":{"id":55,"type":"Button","parentId":21,"style":{"enabled":true,"varName":"this.selectFilesBtn","text":"Select","justify":"center","preferredSize":[0,0],"alignment":"center","helpTip":null}},"item-56":{"id":56,"type":"StaticText","parentId":19,"style":{"enabled":true,"varName":null,"creationProps":{"truncate":"none","multiline":false,"scrolling":false},"softWrap":true,"text":"Created By \nKrevlinMen and ImSamuka","justify":"left","preferredSize":[0,0],"alignment":null,"helpTip":null}},"item-57":{"id":57,"type":"Panel","parentId":20,"style":{"text":"Text Group","preferredSize":[0,0],"margins":10,"orientation":"column","spacing":10,"alignChildren":["left","top"],"alignment":null,"varName":null,"creationProps":{"borderStyle":"etched","su1PanelCoordinates":false},"enabled":true}},"item-58":{"id":58,"type":"Group","parentId":57,"style":{"preferredSize":[0,0],"margins":0,"orientation":"row","spacing":10,"alignChildren":["right","center"],"alignment":"fill","varName":null,"enabled":true}},"item-59":{"id":59,"type":"StaticText","parentId":58,"style":{"text":"Name","justify":"left","preferredSize":[0,0],"alignment":null,"varName":null,"helpTip":null,"softWrap":true,"creationProps":{"truncate":"none","multiline":false,"scrolling":false},"enabled":true}},"item-60":{"id":60,"type":"EditText","parentId":58,"style":{"text":"Type","preferredSize":[80,0],"alignment":null,"varName":"this.groupNameBox","helpTip":null,"softWrap":false,"creationProps":{"noecho":false,"readonly":false,"multiline":false,"scrollable":false,"borderless":false,"enterKeySignalsOnChange":false},"enabled":true,"justify":"left"}},"item-64":{"id":64,"type":"Checkbox","parentId":57,"style":{"text":"Visible","preferredSize":[0,0],"alignment":null,"varName":"this.visibleGroupCB","helpTip":"Set Layer to Visible","enabled":true}},"item-65":{"id":65,"type":"Checkbox","parentId":57,"style":{"text":"Always Create Group","preferredSize":[0,0],"alignment":null,"varName":"this.alwaysCreateGroupCB","helpTip":"Always create a new group, otherwise add text layers to an existing group","enabled":true}},"item-66":{"id":66,"type":"Button","parentId":9,"style":{"enabled":true,"varName":"this.saveConfigBtn","text":"Save Config.","justify":"center","preferredSize":[0,0],"alignment":"fill","helpTip":"Quick Save Current Configuration"}}},"order":[0,20,1,6,4,5,45,46,47,40,57,58,59,60,64,65,9,66,48,50,49,19,21,22,53,52,55,56,36,37,38],"settings":{"importJSON":true,"indentSize":false,"cepExport":false,"includeCSSJS":true,"functionWrapper":false,"compactCode":false,"showDialog":true,"afterEffectsDockable":false,"itemReferenceList":"var"}}
*/

/*
UI 2
{"activeId":84,"items":{"item-0":{"id":0,"type":"Dialog","parentId":false,"style":{"text":"AutoTypeSetter","preferredSize":[0,0],"margins":16,"orientation":"row","spacing":10,"alignChildren":["left","top"],"varName":"win","windowType":"Dialog","creationProps":{"su1PanelCoordinates":false,"maximizeButton":false,"minimizeButton":false,"independent":false,"closeButton":true,"borderless":false,"resizeable":false},"enabled":true}},"item-1":{"id":1,"type":"Panel","parentId":20,"style":{"text":"Page Identifiers","preferredSize":[0,0],"margins":10,"orientation":"column","spacing":10,"alignChildren":["left","top"],"alignment":null,"varName":null,"creationProps":{"borderStyle":"etched","su1PanelCoordinates":false},"enabled":true}},"item-4":{"id":4,"type":"StaticText","parentId":6,"style":{"text":"Prefix","justify":"left","preferredSize":[0,0],"alignment":null,"varName":null,"helpTip":null,"softWrap":true,"creationProps":{"truncate":"none","multiline":false,"scrolling":false},"enabled":true}},"item-5":{"id":5,"type":"EditText","parentId":6,"style":{"text":">>","preferredSize":[60,0],"alignment":null,"varName":"pageIdentifierPrefixBox","helpTip":null,"softWrap":false,"creationProps":{"noecho":false,"readonly":false,"multiline":false,"scrollable":false,"borderless":false,"enterKeySignalsOnChange":false},"enabled":true,"justify":"left"}},"item-6":{"id":6,"type":"Group","parentId":1,"style":{"preferredSize":[0,0],"margins":0,"orientation":"row","spacing":10,"alignChildren":["right","center"],"alignment":"center","varName":null,"enabled":true}},"item-9":{"id":9,"type":"Panel","parentId":19,"style":{"text":"Configuration","preferredSize":[0,0],"margins":10,"orientation":"column","spacing":10,"alignChildren":["left","top"],"alignment":null,"varName":null,"creationProps":{"borderStyle":"etched","su1PanelCoordinates":false},"enabled":true}},"item-19":{"id":19,"type":"Group","parentId":0,"style":{"preferredSize":[0,0],"margins":0,"orientation":"column","spacing":10,"alignChildren":["fill","top"],"alignment":null,"varName":null,"enabled":true}},"item-20":{"id":20,"type":"Group","parentId":0,"style":{"preferredSize":[0,0],"margins":0,"orientation":"column","spacing":10,"alignChildren":["fill","top"],"alignment":null,"varName":null,"enabled":true}},"item-21":{"id":21,"type":"Panel","parentId":19,"style":{"text":"Files","preferredSize":[0,0],"margins":10,"orientation":"column","spacing":10,"alignChildren":["fill","top"],"alignment":null,"varName":null,"creationProps":{"borderStyle":"etched","su1PanelCoordinates":false},"enabled":true}},"item-22":{"id":22,"type":"StaticText","parentId":21,"style":{"text":"Select a Folder including:\n- A '.txt' file containing the text\n- Image Files ('1.png', '2.jpg')\n\n(if you don't select images, \nthe script will run on a open\ndocument)","justify":"left","preferredSize":[0,0],"alignment":null,"varName":null,"helpTip":null,"softWrap":true,"creationProps":{"truncate":"none","multiline":false,"scrolling":false},"enabled":true}},"item-36":{"id":36,"type":"Group","parentId":0,"style":{"preferredSize":[0,0],"margins":0,"orientation":"column","spacing":10,"alignChildren":["fill","top"],"alignment":null,"varName":null,"enabled":true}},"item-37":{"id":37,"type":"Button","parentId":36,"style":{"text":"OK","justify":"center","preferredSize":[0,0],"alignment":null,"varName":"confirmBtn","helpTip":null,"enabled":false}},"item-38":{"id":38,"type":"Button","parentId":36,"style":{"text":"Cancel","justify":"center","preferredSize":[0,0],"alignment":null,"varName":"cancelBtn","helpTip":null,"enabled":true}},"item-40":{"id":40,"type":"Checkbox","parentId":1,"style":{"text":"Ignore Page Number","preferredSize":[0,0],"alignment":null,"varName":"ignorePageNumberCB","helpTip":"This will ignore or not numbers between both identifiers","enabled":true,"checked":false}},"item-45":{"id":45,"type":"Group","parentId":1,"style":{"preferredSize":[0,0],"margins":0,"orientation":"row","spacing":10,"alignChildren":["right","center"],"alignment":"center","varName":null,"enabled":true}},"item-46":{"id":46,"type":"StaticText","parentId":45,"style":{"text":"Suffix","justify":"left","preferredSize":[0,0],"alignment":null,"varName":"","helpTip":null,"softWrap":true,"creationProps":{"truncate":"none","multiline":false,"scrolling":false},"enabled":true}},"item-47":{"id":47,"type":"EditText","parentId":45,"style":{"text":"","preferredSize":[60,0],"alignment":null,"varName":"pageIdentifierSuffixBox","helpTip":null,"softWrap":false,"creationProps":{"noecho":false,"readonly":false,"multiline":false,"scrollable":false,"borderless":false,"enterKeySignalsOnChange":false},"enabled":true,"justify":"left"}},"item-48":{"id":48,"type":"Button","parentId":9,"style":{"enabled":true,"varName":"registerConfigBtn","text":"Import Config","justify":"center","preferredSize":[0,0],"alignment":"fill","helpTip":"Select a JSON with your custom configuration to use!  :D"}},"item-49":{"id":49,"type":"Button","parentId":9,"style":{"enabled":false,"varName":"resetConfigBtn","text":"Reset Config","justify":"center","preferredSize":[0,0],"alignment":"fill","helpTip":"This will delete the JSON you registered"}},"item-50":{"id":50,"type":"Button","parentId":9,"style":{"enabled":true,"varName":"openFolderBtn","text":"Open Scripts Folder","justify":"center","preferredSize":[0,0],"alignment":"fill","helpTip":""}},"item-52":{"id":52,"type":"Checkbox","parentId":21,"style":{"enabled":true,"varName":"selectAllFilesCB","text":"Select Files Instead","preferredSize":[0,0],"alignment":null,"helpTip":"You need to select all files, not a folder containing these files","checked":false}},"item-53":{"id":53,"type":"StaticText","parentId":21,"style":{"enabled":true,"varName":null,"creationProps":{"truncate":"none","multiline":false,"scrolling":false},"softWrap":true,"text":"Formats Supported","justify":"center","preferredSize":[0,0],"alignment":null,"helpTip":"'.png', '.jpeg', '.jpg', '.psd', '.psb'"}},"item-55":{"id":55,"type":"Button","parentId":21,"style":{"enabled":true,"varName":"selectFilesBtn","text":"Select","justify":"center","preferredSize":[0,0],"alignment":"center","helpTip":null}},"item-56":{"id":56,"type":"StaticText","parentId":36,"style":{"enabled":true,"varName":null,"creationProps":{"truncate":"none","multiline":false,"scrolling":false},"softWrap":true,"text":"Created By \nKrevlinMen\nImSamuka","justify":"left","preferredSize":[0,0],"alignment":null,"helpTip":null}},"item-57":{"id":57,"type":"Panel","parentId":20,"style":{"text":"Text Group","preferredSize":[0,0],"margins":10,"orientation":"column","spacing":10,"alignChildren":["left","top"],"alignment":null,"varName":null,"creationProps":{"borderStyle":"etched","su1PanelCoordinates":false},"enabled":true}},"item-58":{"id":58,"type":"Group","parentId":57,"style":{"preferredSize":[0,0],"margins":0,"orientation":"row","spacing":10,"alignChildren":["right","center"],"alignment":"fill","varName":null,"enabled":true}},"item-59":{"id":59,"type":"StaticText","parentId":58,"style":{"text":"Name","justify":"left","preferredSize":[0,0],"alignment":null,"varName":null,"helpTip":null,"softWrap":true,"creationProps":{"truncate":"none","multiline":false,"scrolling":false},"enabled":true}},"item-60":{"id":60,"type":"EditText","parentId":58,"style":{"text":"Type","preferredSize":[80,0],"alignment":null,"varName":"groupNameBox","helpTip":null,"softWrap":false,"creationProps":{"noecho":false,"readonly":false,"multiline":false,"scrollable":false,"borderless":false,"enterKeySignalsOnChange":false},"enabled":true,"justify":"left"}},"item-64":{"id":64,"type":"Checkbox","parentId":57,"style":{"text":"Visible","preferredSize":[0,0],"alignment":null,"varName":"visibleGroupCB","helpTip":"Set Layer to Visible","enabled":true}},"item-65":{"id":65,"type":"Checkbox","parentId":57,"style":{"text":"Always Create Group","preferredSize":[0,0],"alignment":null,"varName":"alwaysCreateGroupCB","helpTip":"Always create a new group, otherwise add text layers to an existing group","enabled":true}},"item-66":{"id":66,"type":"Button","parentId":9,"style":{"enabled":true,"varName":"saveConfigBtn","text":"Save Config","justify":"center","preferredSize":[0,0],"alignment":"fill","helpTip":"Quick Save Current Configuration"}},"item-67":{"id":67,"type":"Group","parentId":0,"style":{"enabled":true,"varName":null,"preferredSize":[0,0],"margins":0,"orientation":"row","spacing":10,"alignChildren":["left","center"],"alignment":null}},"item-68":{"id":68,"type":"Panel","parentId":20,"style":{"enabled":true,"varName":null,"creationProps":{"borderStyle":"etched","su1PanelCoordinates":false},"text":"Text Format","preferredSize":[0,0],"margins":10,"orientation":"column","spacing":10,"alignChildren":["left","top"],"alignment":null}},"item-69":{"id":69,"type":"Group","parentId":68,"style":{"enabled":true,"varName":null,"preferredSize":[0,0],"margins":0,"orientation":"row","spacing":10,"alignChildren":["left","center"],"alignment":null}},"item-70":{"id":70,"type":"Group","parentId":68,"style":{"enabled":true,"varName":null,"preferredSize":[0,0],"margins":0,"orientation":"row","spacing":10,"alignChildren":["left","center"],"alignment":null}},"item-71":{"id":71,"type":"Group","parentId":68,"style":{"enabled":true,"varName":null,"preferredSize":[0,0],"margins":0,"orientation":"row","spacing":10,"alignChildren":["left","center"],"alignment":null}},"item-72":{"id":72,"type":"Group","parentId":68,"style":{"enabled":true,"varName":null,"preferredSize":[0,0],"margins":0,"orientation":"row","spacing":10,"alignChildren":["left","center"],"alignment":null}},"item-73":{"id":73,"type":"StaticText","parentId":69,"style":{"enabled":true,"varName":null,"creationProps":{"truncate":"none","multiline":false,"scrolling":false},"softWrap":false,"text":"Font","justify":"left","preferredSize":[0,0],"alignment":null,"helpTip":null}},"item-74":{"id":74,"type":"DropDownList","parentId":69,"style":{"enabled":true,"varName":"fontListDD","text":"DropDownList","listItems":"font1,font2","preferredSize":[0,0],"alignment":null,"selection":0,"helpTip":null}},"item-75":{"id":75,"type":"StaticText","parentId":70,"style":{"enabled":true,"varName":null,"creationProps":{"truncate":"none","multiline":false,"scrolling":false},"softWrap":false,"text":"Size (px)","justify":"left","preferredSize":[0,0],"alignment":null,"helpTip":null}},"item-76":{"id":76,"type":"EditText","parentId":70,"style":{"enabled":true,"varName":"fontSizeBox","creationProps":{"noecho":false,"readonly":false,"multiline":false,"scrollable":false,"borderless":false,"enterKeySignalsOnChange":false},"softWrap":false,"text":"16","justify":"left","preferredSize":[0,0],"alignment":null,"helpTip":"0 will maintain size Unchanged"}},"item-77":{"id":77,"type":"Checkbox","parentId":70,"style":{"enabled":true,"varName":"boxTextCB","text":"Box Text","preferredSize":[0,0],"alignment":null,"helpTip":null,"checked":true}},"item-78":{"id":78,"type":"StaticText","parentId":71,"style":{"enabled":true,"varName":null,"creationProps":{"truncate":"none","multiline":false,"scrolling":false},"softWrap":false,"text":"Justification","justify":"left","preferredSize":[0,0],"alignment":null,"helpTip":null}},"item-79":{"id":79,"type":"DropDownList","parentId":71,"style":{"enabled":true,"varName":"justificationDD","text":"DropDownList","listItems":"center,left","preferredSize":[0,0],"alignment":null,"selection":0,"helpTip":null}},"item-80":{"id":80,"type":"StaticText","parentId":72,"style":{"enabled":true,"varName":null,"creationProps":{"truncate":"none","multiline":false,"scrolling":false},"softWrap":false,"text":"Language","justify":"left","preferredSize":[0,0],"alignment":null,"helpTip":null}},"item-81":{"id":81,"type":"DropDownList","parentId":72,"style":{"enabled":true,"varName":"languageDD","text":"DropDownList","listItems":"english, portuguese","preferredSize":[0,0],"alignment":null,"selection":0,"helpTip":null}},"item-82":{"id":82,"type":"Group","parentId":20,"style":{"enabled":true,"varName":null,"preferredSize":[0,0],"margins":0,"orientation":"row","spacing":10,"alignChildren":["center","center"],"alignment":null}},"item-84":{"id":84,"type":"Button","parentId":82,"style":{"enabled":true,"varName":"starterLayersBtn","text":"Custom Layers Editor","justify":"center","preferredSize":[0,0],"alignment":"fill","helpTip":null}}},"order":[0,67,20,1,6,4,5,45,46,47,40,57,58,59,60,64,65,68,69,73,74,70,75,76,77,71,78,79,72,80,81,82,84,19,21,22,53,52,55,9,66,48,50,49,36,37,38,56],"settings":{"importJSON":true,"indentSize":false,"cepExport":false,"includeCSSJS":true,"functionWrapper":false,"compactCode":false,"showDialog":true,"afterEffectsDockable":false,"itemReferenceList":"var"}}
*/

/*
UI 3
{"activeId":37,"items":{"item-0":{"id":0,"type":"Dialog","parentId":false,"style":{"text":"AutoTypeSetter","preferredSize":[0,0],"margins":16,"orientation":"row","spacing":10,"alignChildren":["left","top"],"varName":"win","windowType":"Dialog","creationProps":{"su1PanelCoordinates":false,"maximizeButton":false,"minimizeButton":false,"independent":false,"closeButton":true,"borderless":false,"resizeable":false},"enabled":true}},"item-1":{"id":1,"type":"Panel","parentId":20,"style":{"text":"Page Identifiers","preferredSize":[0,0],"margins":10,"orientation":"column","spacing":10,"alignChildren":["left","top"],"alignment":null,"varName":null,"creationProps":{"borderStyle":"etched","su1PanelCoordinates":false},"enabled":true}},"item-4":{"id":4,"type":"StaticText","parentId":6,"style":{"text":"Prefix","justify":"left","preferredSize":[0,0],"alignment":null,"varName":null,"helpTip":null,"softWrap":true,"creationProps":{"truncate":"none","multiline":false,"scrolling":false},"enabled":true}},"item-5":{"id":5,"type":"EditText","parentId":6,"style":{"text":">>","preferredSize":[60,0],"alignment":null,"varName":"pageIdentifierPrefixBox","helpTip":null,"softWrap":false,"creationProps":{"noecho":false,"readonly":false,"multiline":false,"scrollable":false,"borderless":false,"enterKeySignalsOnChange":false},"enabled":true,"justify":"left"}},"item-6":{"id":6,"type":"Group","parentId":1,"style":{"preferredSize":[0,0],"margins":0,"orientation":"row","spacing":10,"alignChildren":["right","center"],"alignment":"center","varName":null,"enabled":true}},"item-9":{"id":9,"type":"Panel","parentId":19,"style":{"text":"Configuration","preferredSize":[0,0],"margins":10,"orientation":"column","spacing":10,"alignChildren":["left","top"],"alignment":null,"varName":null,"creationProps":{"borderStyle":"etched","su1PanelCoordinates":false},"enabled":true}},"item-19":{"id":19,"type":"Group","parentId":0,"style":{"preferredSize":[0,0],"margins":0,"orientation":"column","spacing":10,"alignChildren":["fill","top"],"alignment":null,"varName":null,"enabled":true}},"item-20":{"id":20,"type":"Group","parentId":0,"style":{"preferredSize":[0,0],"margins":0,"orientation":"column","spacing":10,"alignChildren":["fill","top"],"alignment":null,"varName":null,"enabled":true}},"item-21":{"id":21,"type":"Panel","parentId":19,"style":{"text":"Files","preferredSize":[0,0],"margins":10,"orientation":"column","spacing":10,"alignChildren":["fill","top"],"alignment":null,"varName":null,"creationProps":{"borderStyle":"etched","su1PanelCoordinates":false},"enabled":true}},"item-22":{"id":22,"type":"StaticText","parentId":21,"style":{"text":"Select a Folder including:\n- A '.txt' file containing the text\n- Image Files ('1.png', '2.jpg')\n\n(if you don't select images, \nthe script will run on a open\ndocument)","justify":"left","preferredSize":[0,0],"alignment":null,"varName":null,"helpTip":null,"softWrap":true,"creationProps":{"truncate":"none","multiline":false,"scrolling":false},"enabled":true}},"item-36":{"id":36,"type":"Group","parentId":0,"style":{"preferredSize":[0,0],"margins":0,"orientation":"column","spacing":10,"alignChildren":["fill","top"],"alignment":null,"varName":null,"enabled":true}},"item-37":{"id":37,"type":"Button","parentId":36,"style":{"text":"OK","justify":"center","preferredSize":[0,0],"alignment":null,"varName":"confirmBtn","helpTip":null,"enabled":false}},"item-38":{"id":38,"type":"Button","parentId":36,"style":{"text":"Cancel","justify":"center","preferredSize":[0,0],"alignment":null,"varName":"cancelBtn","helpTip":null,"enabled":true}},"item-40":{"id":40,"type":"Checkbox","parentId":1,"style":{"text":"Ignore Page Number","preferredSize":[0,0],"alignment":null,"varName":"ignorePageNumberCB","helpTip":"This will ignore or not numbers between both identifiers","enabled":true,"checked":false}},"item-45":{"id":45,"type":"Group","parentId":1,"style":{"preferredSize":[0,0],"margins":0,"orientation":"row","spacing":10,"alignChildren":["right","center"],"alignment":"center","varName":null,"enabled":true}},"item-46":{"id":46,"type":"StaticText","parentId":45,"style":{"text":"Suffix","justify":"left","preferredSize":[0,0],"alignment":null,"varName":"","helpTip":null,"softWrap":true,"creationProps":{"truncate":"none","multiline":false,"scrolling":false},"enabled":true}},"item-47":{"id":47,"type":"EditText","parentId":45,"style":{"text":"","preferredSize":[60,0],"alignment":null,"varName":"pageIdentifierSuffixBox","helpTip":null,"softWrap":false,"creationProps":{"noecho":false,"readonly":false,"multiline":false,"scrollable":false,"borderless":false,"enterKeySignalsOnChange":false},"enabled":true,"justify":"left"}},"item-48":{"id":48,"type":"Button","parentId":9,"style":{"enabled":true,"varName":"registerConfigBtn","text":"Import Config","justify":"center","preferredSize":[0,0],"alignment":"fill","helpTip":"Select a JSON with your custom configuration to use!  :D"}},"item-49":{"id":49,"type":"Button","parentId":9,"style":{"enabled":false,"varName":"resetConfigBtn","text":"Reset Config","justify":"center","preferredSize":[0,0],"alignment":"fill","helpTip":"This will delete the JSON you registered"}},"item-50":{"id":50,"type":"Button","parentId":9,"style":{"enabled":true,"varName":"openFolderBtn","text":"Open Scripts Folder","justify":"center","preferredSize":[0,0],"alignment":"fill","helpTip":""}},"item-52":{"id":52,"type":"Checkbox","parentId":21,"style":{"enabled":true,"varName":"selectAllFilesCB","text":"Select Files Instead","preferredSize":[0,0],"alignment":null,"helpTip":"You need to select all files, not a folder containing these files","checked":false}},"item-53":{"id":53,"type":"StaticText","parentId":21,"style":{"enabled":true,"varName":null,"creationProps":{"truncate":"none","multiline":false,"scrolling":false},"softWrap":true,"text":"Formats Supported","justify":"center","preferredSize":[0,0],"alignment":null,"helpTip":"'.png', '.jpeg', '.jpg', '.psd', '.psb'"}},"item-55":{"id":55,"type":"Button","parentId":21,"style":{"enabled":true,"varName":"selectFilesBtn","text":"Select","justify":"center","preferredSize":[0,0],"alignment":"center","helpTip":null}},"item-56":{"id":56,"type":"StaticText","parentId":36,"style":{"enabled":true,"varName":null,"creationProps":{"truncate":"none","multiline":false,"scrolling":false},"softWrap":true,"text":"Created By \nKrevlinMen\nImSamuka","justify":"left","preferredSize":[0,0],"alignment":null,"helpTip":null}},"item-57":{"id":57,"type":"Panel","parentId":20,"style":{"text":"Text Group","preferredSize":[0,0],"margins":10,"orientation":"column","spacing":10,"alignChildren":["left","top"],"alignment":null,"varName":null,"creationProps":{"borderStyle":"etched","su1PanelCoordinates":false},"enabled":true}},"item-58":{"id":58,"type":"Group","parentId":57,"style":{"preferredSize":[0,0],"margins":0,"orientation":"row","spacing":10,"alignChildren":["right","center"],"alignment":"center","varName":null,"enabled":true}},"item-59":{"id":59,"type":"StaticText","parentId":58,"style":{"text":"Name","justify":"left","preferredSize":[0,0],"alignment":null,"varName":null,"helpTip":null,"softWrap":true,"creationProps":{"truncate":"none","multiline":false,"scrolling":false},"enabled":true}},"item-60":{"id":60,"type":"EditText","parentId":58,"style":{"text":"Type","preferredSize":[80,0],"alignment":null,"varName":"groupNameBox","helpTip":null,"softWrap":false,"creationProps":{"noecho":false,"readonly":false,"multiline":false,"scrollable":false,"borderless":false,"enterKeySignalsOnChange":false},"enabled":true,"justify":"left"}},"item-64":{"id":64,"type":"Checkbox","parentId":57,"style":{"text":"Visible","preferredSize":[0,0],"alignment":null,"varName":"visibleGroupCB","helpTip":"Set Layer to Visible","enabled":true}},"item-65":{"id":65,"type":"Checkbox","parentId":57,"style":{"text":"Always Create Group","preferredSize":[0,0],"alignment":null,"varName":"alwaysCreateGroupCB","helpTip":"Always create a new group, otherwise add text layers to an existing group","enabled":true}},"item-66":{"id":66,"type":"Button","parentId":9,"style":{"enabled":true,"varName":"saveConfigBtn","text":"Save Config","justify":"center","preferredSize":[0,0],"alignment":"fill","helpTip":"Quick Save Current Configuration"}},"item-67":{"id":67,"type":"Group","parentId":0,"style":{"enabled":true,"varName":null,"preferredSize":[0,0],"margins":0,"orientation":"row","spacing":10,"alignChildren":["left","center"],"alignment":null}},"item-68":{"id":68,"type":"Panel","parentId":20,"style":{"enabled":true,"varName":null,"creationProps":{"borderStyle":"etched","su1PanelCoordinates":false},"text":"Text Format","preferredSize":[0,0],"margins":10,"orientation":"column","spacing":10,"alignChildren":["right","top"],"alignment":null}},"item-69":{"id":69,"type":"Group","parentId":68,"style":{"enabled":true,"varName":null,"preferredSize":[0,0],"margins":0,"orientation":"row","spacing":10,"alignChildren":["left","center"],"alignment":null}},"item-70":{"id":70,"type":"Group","parentId":68,"style":{"enabled":true,"varName":null,"preferredSize":[0,0],"margins":0,"orientation":"row","spacing":10,"alignChildren":["left","center"],"alignment":null}},"item-71":{"id":71,"type":"Group","parentId":68,"style":{"enabled":true,"varName":null,"preferredSize":[0,0],"margins":0,"orientation":"row","spacing":10,"alignChildren":["left","center"],"alignment":null}},"item-72":{"id":72,"type":"Group","parentId":68,"style":{"enabled":true,"varName":null,"preferredSize":[0,0],"margins":0,"orientation":"row","spacing":10,"alignChildren":["left","center"],"alignment":null}},"item-73":{"id":73,"type":"StaticText","parentId":69,"style":{"enabled":true,"varName":null,"creationProps":{"truncate":"none","multiline":false,"scrolling":false},"softWrap":false,"text":"Font","justify":"left","preferredSize":[0,0],"alignment":null,"helpTip":null}},"item-74":{"id":74,"type":"DropDownList","parentId":69,"style":{"enabled":true,"varName":"fontListDD","text":"DropDownList","listItems":"font1,font2","preferredSize":[0,0],"alignment":null,"selection":0,"helpTip":null}},"item-75":{"id":75,"type":"StaticText","parentId":70,"style":{"enabled":true,"varName":null,"creationProps":{"truncate":"none","multiline":false,"scrolling":false},"softWrap":false,"text":"Size (px)","justify":"left","preferredSize":[0,0],"alignment":null,"helpTip":null}},"item-76":{"id":76,"type":"EditText","parentId":70,"style":{"enabled":true,"varName":"fontSizeBox","creationProps":{"noecho":false,"readonly":false,"multiline":false,"scrollable":false,"borderless":false,"enterKeySignalsOnChange":false},"softWrap":false,"text":"16","justify":"left","preferredSize":[0,0],"alignment":null,"helpTip":"0 will maintain size Unchanged"}},"item-77":{"id":77,"type":"Checkbox","parentId":70,"style":{"enabled":true,"varName":"boxTextCB","text":"Box Text","preferredSize":[0,0],"alignment":null,"helpTip":null,"checked":false}},"item-78":{"id":78,"type":"StaticText","parentId":71,"style":{"enabled":true,"varName":null,"creationProps":{"truncate":"none","multiline":false,"scrolling":false},"softWrap":false,"text":"Justification","justify":"left","preferredSize":[0,0],"alignment":null,"helpTip":null}},"item-79":{"id":79,"type":"DropDownList","parentId":71,"style":{"enabled":true,"varName":"justificationDD","text":"DropDownList","listItems":"center,left","preferredSize":[0,0],"alignment":null,"selection":0,"helpTip":null}},"item-80":{"id":80,"type":"StaticText","parentId":72,"style":{"enabled":true,"varName":null,"creationProps":{"truncate":"none","multiline":false,"scrolling":false},"softWrap":false,"text":"Language","justify":"left","preferredSize":[0,0],"alignment":null,"helpTip":null}},"item-81":{"id":81,"type":"DropDownList","parentId":72,"style":{"enabled":true,"varName":"languageDD","text":"DropDownList","listItems":"english, portuguese","preferredSize":[0,0],"alignment":null,"selection":0,"helpTip":null}},"item-82":{"id":82,"type":"Group","parentId":20,"style":{"enabled":true,"varName":null,"preferredSize":[0,0],"margins":0,"orientation":"row","spacing":10,"alignChildren":["center","center"],"alignment":null}},"item-84":{"id":84,"type":"Button","parentId":82,"style":{"enabled":true,"varName":"starterLayersBtn","text":"Custom Layers Editor","justify":"center","preferredSize":[0,0],"alignment":"fill","helpTip":null}},"item-85":{"id":85,"type":"Checkbox","parentId":57,"style":{"text":"Column Group","preferredSize":[0,0],"alignment":null,"varName":"columnGroupCB","helpTip":"Text Columns will be stacked in different groups","enabled":true}},"item-86":{"id":86,"type":"Checkbox","parentId":21,"style":{"enabled":true,"varName":"prioritizePSDCB","text":"Prioritize PSD Files","preferredSize":[0,0],"alignment":null,"helpTip":"It will prioritize PSD over more \"raw\" files (PNG, JPG)","checked":false}},"item-87":{"id":87,"type":"Checkbox","parentId":68,"style":{"enabled":true,"varName":"disableCustomTextFormatsCB","text":"Disable Custom Text Formats","preferredSize":[0,0],"alignment":null,"helpTip":null,"checked":true}}},"order":[0,67,20,1,6,4,5,45,46,47,40,57,58,59,60,64,65,85,68,69,73,74,70,75,76,77,71,78,79,72,80,81,87,82,84,19,21,22,53,52,86,55,9,66,48,50,49,36,37,38,56],"settings":{"importJSON":true,"indentSize":false,"cepExport":false,"includeCSSJS":true,"functionWrapper":false,"compactCode":false,"showDialog":true,"afterEffectsDockable":false,"itemReferenceList":"var"}}
*/

