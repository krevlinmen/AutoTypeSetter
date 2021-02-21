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
const identifiersWidth = 60 // identifiers

const isWindowAvailable = !!$.global.Window;
const savedConfigPath = "config.json"

const defaultConfig = readJson("lib/defaultConfig.json", "Default configuration")

const justificationObj = readJson("lib/dropdown/justificationOptions.json", "Justification options list")
const blendModeObj = readJson("lib/dropdown/blendModeOptions.json", "Blend Mode options list")
const languageObj = readJson("lib/dropdown/languageOptions.json", "Language options list")
const antiAliasObj = readJson("lib/dropdown/antiAliasOptions.json", "Anti Aliasing options list")
const capitalizationObj = readJson("lib/dropdown/capitalizationOptions.json", "Capitalization options list")

const justificationDD_array = getKeys(justificationObj)
const blendModeDD_array = getKeys(blendModeObj)
const languageDD_array = getKeys(languageObj)
const antiAliasDD_array = getKeys(antiAliasObj)
const capitalizationDD_array = getKeys(capitalizationObj)
const fontDD_array = getFontNames()

//* ------- Windows ------

const mainWindowObj = isWindowAvailable ? MainWindow() : undefined
const progressWindowObj = isWindowAvailable ? new ProcessingWindow() : undefined

/* ---------------------------- Global Variables ---------------------------- */

var textFile;
var duplicatedLayer;
var convertAllToRGB;
var currentGroup;
var mainGroup;
var alreadyCreatedTextFolder = false;
var config = {};
var continueProcessing = false //? Flag that initialize the main process
var arrayFiles = []

/* -------------------------------------------------------------------------- */
/*                                    Main                                    */
/* -------------------------------------------------------------------------- */


main()

function main() {

  //? Save Configurations
  const savedDialogMode = app.displayDialogs
  //? Change Configurations
  app.displayDialogs = DialogModes.ERROR //change to NO by the End

  writeProgramInfo() // Archive for debugging purposes

  //? Read Configuration
  readConfig()

  //? Show UI window

  if (isWindowAvailable)
    mainWindowObj.initialize()
  else {
    continueProcessing = confirm("Unfortunately, we were unable to create the window where you can edit all the settings. We recommend that you acquire a more updated version of PhotoShop.\nBut not everything is lost. If you want to use the program anyway, you need to manually edit the configuration file \"config.json\" according to our documentation. If you have already done so, press OK to select your files and run the program!", false, "The window could not be created")
    if (continueProcessing) getArrayFiles()
  }

  //* Execute Process
  if (continueProcessing) processText()

  //* Commented Until we discuss how to handle uncaught errors
  // try {} catch (error) {
  //   //? Closes the windows if an error occurs, else PhotoShop crashes
  //   throwError("Something really bad happened", error)
  // }

  //? Restore Configurations
  app.displayDialogs = savedDialogMode
}

function processText() {


  //? Get Files

  const multipleArchives = arrayFiles.length > 1

  if (arrayFiles.length === 0)
    throwError("No files were selected!")
  else if (arrayFiles.length === 1)
    textFile = arrayFiles[0]

  const imageFileArray = multipleArchives ? createImageArray(arrayFiles) : undefined
  const content = createContentObj()
  const filesOrder = multipleArchives ? {} : []
  var ExecuteProcess = function () {}

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
          if ( ensureValidColorMode() ) continue;
          if (continueProcessing) applyStarterLayerFormats()
          if (continueProcessing) insertPageTexts(content[pageKey]) //Page text Writing Loop
          if (continueProcessing) selectTypeGroup()
          if (continueProcessing) saveAndCloseFile(file)
        }

        //? Update Window
        if (isWindowAvailable) progressWindowObj.update()
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

    //* Assure Valid Color Mode
    convertAllToRGB = false //? To ask only once
    if ( ensureValidColorMode() )
      return //? User decided not to change color mode, exit

    //* Populating filesOrder
    for (var pageKey in content) {
      var page = content[pageKey]
      for (var lineKey in page)
        filesOrder.push(getCustomFormattedLine(page[lineKey]))
    }

    //* Process Function
    ExecuteProcess = function () {
      if (continueProcessing) applyStarterLayerFormats()

      //? Everything will be used
      for (var pageKey in content) {
        if (!continueProcessing) break;
        insertPageTexts(content[pageKey], true)
      }
      if (continueProcessing) selectTypeGroup()
    }
  }

  //? This will show and await for a user confirmation
  continueProcessing = false
  if (isWindowAvailable)
    ProcessingWindow(filesOrder)
  else {
    var text = "This is what will be done:"

    if (Array.isArray(filesOrder)){
      text = "This will be placed in the document:"
      for (var i in filesOrder) text += "\n" + filesOrder[i]
    }
    else
      for (var page in filesOrder)
        text += "\nPage " + page +  "  ->  " +   (filesOrder[page] ? filesOrder[page].name : "")

    continueProcessing = confirm(text, false, "Processing Files")
  }


  if (continueProcessing){
    //? if the user confirms

    //* Open Progress Window
    if (isWindowAvailable) progressWindowObj.initialize(filesOrder)
    ExecuteProcess()
  }
}

/* -------------------------------------------------------------------------- */
/*                                  Functions                                 */
/* -------------------------------------------------------------------------- */





/* --------------------------------- Helpers -------------------------------- */

function throwError(message, error, notFatal) {

  //? Always show error message
  alert(message)

  //? Closes windows, else Crash

  if (!notFatal){
    try {
      mainWindowObj.win.close()
    } catch (error) {}

    try {
      progressWindowObj.close()
    } catch (error) {}

    if (error === undefined)
      throw new Error(message)
    else {
      alert(error)
      throw error
    }
  }

}

function selectTypeGroup(){
  if (alreadyCreatedTextFolder){
    const folder = getTypeFolder()
    activeDocument.activeLayer = folder
    formatLayer(folder, config.groupLayer)
  }
}

function saveAndCloseFile(file) {
  const saveFile = File(file.fullName.withoutExtension() + '.psd')
  activeDocument.saveAs(saveFile)
  activeDocument.close()
  alreadyCreatedTextFolder = false;
}

function ensureValidColorMode() {
  if (activeDocument.mode == DocumentMode.INDEXEDCOLOR){

    if (convertAllToRGB === undefined)
      convertAllToRGB = confirm("Indexed color mode doesn't allow changing layers.\nWould you like to change all necessary files to RGB mode?", false, "Invalid Color Mode")

    const res = convertAllToRGB ? true : confirm("Indexed color mode doesn't allow changing layers.\nWould you like to change the mode to RGB?", false, "Invalid Color Mode")

    if (res) activeDocument.changeMode(ChangeMode.RGB)
    else return true //? User refused
  }
}

function getArrayFiles(){

  try {
    if (config.selectAllFiles || config.selectAllFiles === undefined)
      arrayFiles = File.openDialog("Select Files", ["All:*.txt;*.png;*.jpeg;*.jpg;*.psd;*.psb", "Text:*.txt", "Images:*.png;*.jpeg;*.jpg;*.psd;*.psb"], true)
    else
      arrayFiles = Folder.selectDialog("Select Folder").getFiles()
  } catch (error) {}

  if (!Array.isArray(arrayFiles)) arrayFiles = []

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

function ensureFontSizeUI(sizeBox){
  sizeBox.text = sizeBox.text.replace(/\D/g, '')
  if (!sizeBox.text.length || isNaN(parseInt(sizeBox.text)))
    sizeBox.text = 0

  sizeBox.text = parseInt(sizeBox.text,10)

  if (parseInt(sizeBox.text) > 255) sizeBox.text = 255
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

  //? Validating 'defaultTextFormat' First of all
  validateLayerFormatObject(configObject.defaultTextFormat)

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

          validateLayerFormatObject(configObject[i][j], configObject[i][j-1], i == "customTextFormats" ? configObject.defaultTextFormat : undefined)
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
        configObject[key] = configObject[key].replace(/\D/g, '')

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

  function validateLayerFormatObject(obj, objBefore, addToDefault){

    const defaultLFO = getMerged(defaultConfig.LayerFormatObject, addToDefault)

    const optionObjects = {
      justification: justificationObj,
      blendMode: blendModeObj,
      language: languageObj
    }

    for (var k in optionObjects){

      //? If the property exists
      if (isNotUndef(obj[k])){

        obj[k] = obj[k].toUpperCase()

        //? If we try to parse it as the "actual useful value", and get undefined, use default
        if (undefined === ( getKeyOf(optionObjects[k], obj[k])) )
          obj[k] = defaultLFO[k]
      }
    }

    //? Validate "duplicate"
    validatePropertyType(obj, defaultLFO, "duplicate")
    //? If "duplicate" is not true, set objBefore as undefined
    if (!obj["duplicate"]) objBefore = undefined

    for (var k in obj){

      //* Type Validation
      validatePropertyType(obj, defaultLFO, k)

      //? We delete the property if the value is equal the default one
      //? If objBefore is defined, we only delete the property if objBefore[k] is undefined
      if (obj[k] === defaultLFO[k] && (isNotUndef(objBefore) ? objBefore[k] === undefined : true ))
        delete obj[k]

    }
  }
}













//? This Function shall not be in another file
function getFileFromScriptPath(filename) {
  return File((new File($.fileName)).path + "/" + encodeURI(filename))
}

function isNewPage(line) {
  if (config.pageIdentifierPrefix == "" && config.pageIdentifierSuffix == "") return false
  const res = line.startsWith(config.pageIdentifierPrefix) && line.endsWith(config.pageIdentifierSuffix)
  if (config.ignorePageNumber)
    return res
  else
    return res && !isNaN(getPageNumber(line))
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

function findFormat(line, returnIndex){

  //? Shall be 'line === line.trim()'
  if (config.disableCustomTextFormats) return undefined
  if (config.ignoreCustomWith && line.startsWith(config.ignoreCustomWith))
    return undefined

  for (var i in config.customTextFormats){
    var format = config.customTextFormats[i]

    if (!format.lineIdentifierPrefix && !format.lineIdentifierSuffix) continue;
    if (format.lineIdentifierPrefix === undefined) format.lineIdentifierPrefix = ""
    if (format.lineIdentifierSuffix === undefined) format.lineIdentifierSuffix = ""

    if (line.startsWith(format.lineIdentifierPrefix) && line.endsWith(format.lineIdentifierSuffix))
      return returnIndex ? i : format
  }
}

function getCustomFormattedLine(line, format){

  //? If disabled or line is blank, return unaltered
  if (!line || config.disableCustomTextFormats) return line

  var newLine = "";
  //? If startsWith 'config.ignoreCustomWith'
  if (config.ignoreCustomWith && line.startsWith(config.ignoreCustomWith))
    newLine = line.slice(config.ignoreCustomWith.length).trim()

  if (format === undefined) format = findFormat(line)
  if (format) newLine = line.slice(format.lineIdentifierPrefix.length, line.length - format.lineIdentifierSuffix.length).trim()
  return newLine || line //? Return new line (if not blank) or unaltered
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

  const candidates = []
  //? Better than calling 'toLowerCase()' every time
  const lrCaseName = fontName.toLowerCase()

  //? Loop through every font
  for (var i = 0; i < app.fonts.length; i++)
    //? search fonts with the name including 'fontName' - case insensitive
    if (app.fonts[i].name.toLowerCase().indexOf(lrCaseName) > -1)
      candidates.push(app.fonts[i])

  if (candidates.length === 0)
    return undefined

  if (candidates.length > 1){

    //? Try to find a exact copy
    for (var i in candidates)
      if (candidates[i].name === fontName)
        return candidates[i]
    for (var i in candidates)
      if (candidates[i].name == fontName)
        return candidates[i]

    //? Try to find a exact copy - case insensitive
    for (var i in candidates)
      if (candidates[i].name.toLowerCase() == lrCaseName)
        return candidates[i]
  }

  return candidates[0]
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
    else
      textFolder = mainGroup.layerSets.getByName(groupName) //? Gets nested groups inside the main group

  } catch (error) {
    //? If not found, create one

    textFolder = createGroupFolder(groupName, groupIndex)
  }
  alreadyCreatedTextFolder = true
  return textFolder;
}





















function createImageArray() {
  const imageArray = []

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

function createContentObj() {

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

  if (arrayFiles.length > 1)
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
  if (isNotUndef(format.isBackgroundLayer) || getKeys(format).length )
    layer.isBackgroundLayer = !!format.isBackgroundLayer
  if (layer.isBackgroundLayer) return

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

    if (isNotUndef(format.color) && format.color.length && isHexColor(format.color)){
      const color = new SolidColor();
      color.rgb.hexValue = format.color.slice(1);
      txt.color = color
    }

    if (isNotUndef(format.boxText)) {
      if (!format.boxText) txt.width = 9999 //! Without this, the text is cut out
      txt.kind = format.boxText ? TextType.PARAGRAPHTEXT : TextType.POINTTEXT
    }


    if (isNotUndef(format.justification) && format.justification.length){

      try {
        var just = format.justification.toUpperCase()
      } catch (error) {
        throwError("Text format justification is not valid.", error)
      }

      if (txt.kind === TextType.POINTTEXT){
        switch (just) {
          case "CENTER":
          case "LEFT":
          case "RIGHT":
            break;
          default:
            throwError("Point Text only supports \"CENTER\", \"LEFT\" and \"RIGHT\" justification methods. \nYou provided " + just, undefined, true)
            just = ""
            format.justification = undefined
          }
      }

      if (just)
        try {
          txt.justification = Justification[just]
        } catch (error) {
          throwError("Text format justification is not valid.", error)
        }
    }

    if (isNotUndef(format.language) && format.language.length)
      try {
        txt.language = Language[format.language.toUpperCase()]
      } catch (error) {
        throwError("Text format language is not valid.", error)
      }

    if (isNotUndef(format.antiAlias) && format.antiAlias.length)
      try {
        txt.antiAliasMethod = AntiAlias[format.antiAlias.toUpperCase()]
      } catch (error) {
        throwError("Text format anti aliasing method is not valid.", error)
      }

    if (isNotUndef(format.capitalization) && format.capitalization.length)
      try {
        txt.capitalization = TextCase[format.capitalization.toUpperCase()]
      } catch (error) {
        throwError("Text format capitalization method is not valid.", error)
      }

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

  for (var i in page) {
    var format = findFormat(page[i])
    var line = getCustomFormattedLine(page[i], format)

    if (!continueProcessing) break;

    writeTextLayer(line, i < page.length - 1, positionArray[i], format)
    if (updateAtEachLine && isWindowAvailable) progressWindowObj.update()
  }

}


function writeTextLayer(text, activateDuplication, positionObj, format) {


  function defaultTextLayer() {
    //* Creating PlaceHolder Layer
    if (config.columnGroup){
      mainGroup = getTypeFolder()
    }

    currentGroup = getTypeFolder(config.columnGroup ? positionObj.group : undefined)

    const txtLayer = currentGroup.artLayers.add()
    txtLayer.kind = LayerKind.TEXT

    //* Default Formatting
    formatLayer(txtLayer, config.defaultTextFormat)
    return txtLayer;
  }

  const txtLayer = duplicatedLayer === undefined ? defaultTextLayer() : duplicatedLayer

  if (config.columnGroup){
    if (!currentGroup.name.endsWith((positionObj.group.toString()))){
      currentGroup = getTypeFolder(positionObj.group)
      txtLayer.move(currentGroup,ElementPlacement.INSIDE)
    }
  }

  duplicatedLayer = undefined;
  if (activateDuplication)
    duplicatedLayer = txtLayer.duplicate()

  //* Set Text
  txtLayer.textItem.contents = text

  if (format)
    try {
      // alert("Formatting Layer")
      formatLayer(txtLayer, format)
    } catch (error) {
      throwError("Some error occurred while formatting the text layer", error)
    }

  //? Positioning

  // alert("Positioning Layer\nX: " + positionObj.xPosition + "\nY: " + positionObj.yPosition)
  txtLayer.textItem.position = [positionObj.xPosition, positionObj.yPosition]

  const boxText = txtLayer.textItem.kind === TextType.PARAGRAPHTEXT

  if (boxText) {
    // alert("Changing layer size\nWidth: " + positionObj.width + "\nHeight: " + positionObj.height)
    txtLayer.textItem.width = positionObj.width
    txtLayer.textItem.height = positionObj.height
  }
  // alert("Layer Complete")
}

//* Calculate the positioning of all the text in a page
function calculatePositions(textArray) {
  const docWidth  = activeDocument.width
  const docHeight = activeDocument.height
  docWidth.convert("px")
  docHeight.convert("px")

  const yBorder = docHeight * 0.02
  const xBorder = docWidth * 0.02

  positionData = []
  const layerPosition = {
    yPosition: yBorder, //*Initially, the margin of the document
    xPosition: xBorder,
    height: undefined,
    width: docWidth * 0.2, //*maybe customizable in the future
    group: 1
  }

  for (var i in textArray) {
    var line = textArray[i]
    var format = findFormat(line)

    //? 'format' will be undefined if 'config.disableCustomTextFormats' is true
    //? or if it was not found
    if (!format) format = config.defaultTextFormat
    //? If 'format.size' is undefined, use from default
    if (format.size === undefined) format.size = config.defaultTextFormat.size
    //? If 'format.size' still is undefined, call error
    if (format.size === undefined) throwError("Font size is undefined")
    //? If 'format.size' is 0, use 16 as default
    if (format.size === 0) format.size = 16

    layerPosition.height = (format.size * 1.1) * Math.ceil(line.length / (layerPosition.width / (6 * format.size / 7))) //! Attention

    layerPosition.xPosition += pointTextXoffset(format)
    positionData.push(getCopy(layerPosition))
    layerPosition.xPosition -= pointTextXoffset(format)

    layerPosition.yPosition += yBorder + layerPosition.height //*yPosition += The size of the text Box + border

    if (layerPosition.yPosition >= docHeight) { //*if the bottom of the file is reached
      layerPosition.yPosition = yBorder //*Reset yPosition
      layerPosition.xPosition += xBorder + layerPosition.width //*increment the x value to create a new column
      layerPosition.group += 1 //*Goes to the next group

    }

    layerPosition.height = undefined //? Resets height for custom format check
  }

  return positionData


  function pointTextXoffset(format){
    if (format.boxText === undefined || format.boxText) return 0

    switch ( format.justification ? format.justification.toUpperCase() : "" ) {
      case "LEFT":
        return 0
      case "RIGHT":
        return layerPosition.width
      default:
        return layerPosition.width / 2
    }
  }
}



/* -------------------------------------------------------------------------- */
/*                            Main Window Interface                           */
/* -------------------------------------------------------------------------- */


function MainWindow() {

  //* Create a new one by default
  const UI = new createMainWindow()

  //* Set New Variables
  UI.firstFont = undefined

  //* Dropdown Sizes
  UI.fontDD.maximumSize = dropDownSizes

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

    UI.groupNameBox.text = isNotUndef(config.groupLayer.name) ? config.groupLayer.name : defaultConfig.groupLayer.name
    UI.visibleGroupCB.value = isNotUndef(config.groupLayer.visible) ? config.groupLayer.visible : defaultConfig.LayerFormatObject.visible

    UI.fontSizeBox.text = isNotUndef(config.defaultTextFormat.size) ? config.defaultTextFormat.size :  defaultConfig.LayerFormatObject.size
    UI.boxTextCB.value = isNotUndef(config.defaultTextFormat.boxText) ? config.defaultTextFormat.boxText :  defaultConfig.LayerFormatObject.boxText


    //? Complex Ones - this is used to select the valid option on every dropdown

    var fontDDFont = getFont(isNotUndef(config.defaultTextFormat.font) ? config.defaultTextFormat.font :  defaultConfig.LayerFormatObject.font)
    UI.fontDD.selection = isNotUndef(fontDDFont) ? UI.fontDD.find(fontDDFont.name) | 0 : 0
    if (UI.firstFont === undefined) UI.firstFont = UI.fontDD.selection.text

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

    //? groupLayer Properties

    config.groupLayer.name = UI.groupNameBox.text
    config.groupLayer.visible = UI.visibleGroupCB.value

    //? defaultTextFormat Properties

    config.defaultTextFormat.size = UI.fontSizeBox.text
    config.defaultTextFormat.boxText = UI.boxTextCB.value

    if (UI.firstFont != UI.fontDD.selection.text)
      config.defaultTextFormat.font = UI.fontDD.selection.index ? UI.fontDD.selection.text : defaultConfig.LayerFormatObject.font

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
    getUIConfigs()
    showTabbedWindow(false)
    setUIConfigs()
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
    ensureFontSizeUI(UI.fontSizeBox)
  }
  UI.fontSizeBox.onChange = UI.fontSizeBox.onChanging
  UI.fontSizeBox.onChanging()

  UI.selectFilesBtn.onClick = function () {

    config.selectAllFiles = UI.selectAllFilesCB.value

    getArrayFiles()

    if (arrayFiles.length) {
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

    //* Set Configuration Object
    getUIConfigs()

    //* Flag to initialize the program
    continueProcessing = true
  }

  return UI
}