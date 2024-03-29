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
const identifiersWidth = 60
const supportedImageFiles = ['.png', '.jpg', '.jpeg', '.psd', '.psb']
const textMargin = 0.02
const textBoxWidth = 0.2
const positionObj = {
  x: 0,
  y: 0,
  initialized: false,
  width: undefined,
  docWidth: undefined,
  docHeight: undefined,
  xMargin: undefined,
  yMargin: undefined,
  group: 1
}

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
var savedResolution;
var previousResolution;
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

    function getSpecificImage(num) {
      for (var i in imageFileArray)
        if (num === getFilenameNumber(imageFileArray[i]))
          return imageFileArray[i];
    }

    //* Populating filesOrder
    for (var pageKey in content)
      filesOrder[pageKey] = getSpecificImage(parseInt(pageKey))


    //* Process Function
    ExecuteProcess = function () {
      for (var pageKey in filesOrder){

        if (!continueProcessing) break;

        var file = filesOrder[pageKey]
        if (file){
          if (continueProcessing) open(file)
          if (continueProcessing) preProcessDocument();
          if (continueProcessing) applyStarterLayerFormats()
          if (continueProcessing) insertPageTexts(content[pageKey]) //Page text Writing Loop
          if (continueProcessing) postProcessDocument()
          if (continueProcessing) saveAndCloseFile(file)
        }

        //? Update Window
        if (isWindowAvailable && continueProcessing) progressWindowObj.update()
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
      throwError("No document was found.\nIf you only want to select a text file, you also need to have a document open.")
    }

    //* To ask only once when assuring Valid Color Mode
    convertAllToRGB = false

    //* Populating filesOrder
    for (var pageKey in content) {
      var page = content[pageKey]
      for (var lineKey in page)
        filesOrder.push(getCustomFormattedLine(page[lineKey]))
    }

    //* Process Function
    ExecuteProcess = function () {

      if (continueProcessing) preProcessDocument();
      if (continueProcessing) applyStarterLayerFormats()

      //? Creating a big page with everything
      var page = []
      if (continueProcessing)
        for (var pageKey in content)
          page = page.concat(content[pageKey])

      if (continueProcessing) insertPageTexts(page, true)
      if (continueProcessing) postProcessDocument()
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

function saveAndCloseFile(file) {
  //? Check if argument is a instance of File
  if (!(file instanceof File))
    return throwError("saveAndCloseFile() received a " + typeof(file) + " instead of a File.")

  const saveFile = File(file.fullName.withoutExtension() + '.psd')
  activeDocument.saveAs(saveFile)
  activeDocument.close()
  alreadyCreatedTextFolder = false;
}

function changeDocumentResolution(resolution, lookErrors){

  //* Check if 'resolution' is not a number
  if (typeof resolution != "number"){
    throwError("Tried to change Document resolution to " + resolution + " (" + parseInt(resolution) + "), which is of type '" + typeof(resolution) + "'.", undefined, true)
    return true //? Error
  }

  //* Check if 'resolution' is a negative number
  if (resolution < 0){
    throwError("Tried to change Document resolution to a negative number: " + resolution + ".", undefined, true)
    return true //? Error
  }

  if (!resolution || lookErrors) return

  if (parseInt(resolution) === parseInt(activeDocument.resolution))
    return

  try {
    const width = activeDocument.width
    const height = activeDocument.height
    width.convert("px")
    height.convert("px")

    activeDocument.resizeImage(width, height, parseInt(resolution))
  } catch (error) {
    throwError("An error ocurred while trying to change document resolution to " + parseInt(resolution) + ".", error)
  }
}

function changeDocumentMode(mode){

  //? Check if mode given is a string
  if (typeof mode != "string"){
    throwError("Tried to change Document mode to '" + mode + "'.", undefined, true)
    return true; //* Error
  }


  const modes = ["RGB", "GRAYSCALE", "CMYK", "LAB", "MULTICHANNEL"]
  //? BITMAP and INDEXEDCOLOR are not supported because it needs further options to work

  mode = mode.toUpperCase()

  if (getKeyOf(modes, mode) !== undefined){

    try {
      if (activeDocument.mode === DocumentMode[mode])
        return //? No need to change

      if (mode === "BITMAP") //? To change to BITMAP, change to GRAYSCALE First
        activeDocument.changeMode(ChangeMode.GRAYSCALE)
      activeDocument.changeMode(ChangeMode[mode])

    } catch (error) {
      throwError("An error ocurred while trying to change document color mode to '" + mode + "'.", error)
      return true; //* Error
    }

  } else {
    throwError("Document mode '" + mode + "' not supported.", undefined, true)
    return true; //* Error
  }

}

function ensureValidColorMode() {
  if (activeDocument.mode == DocumentMode.INDEXEDCOLOR){

    if (!convertAllToRGB) convertAllToRGB = confirm("Indexed color mode doesn't allow changing layers.\nWould you like to change all necessary files to RGB mode?\nRefusing will close the program.", false, "Invalid Color Mode")

    if (convertAllToRGB) changeDocumentMode("RGB")
    else continueProcessing = false //? User refused
  }
}

function preProcessDocument(){

  //* Ensure Valid Color Mode - Can Terminate Program
  ensureValidColorMode()
  if (!continueProcessing) return

  //* We can't edit with this being true
  activeDocument.quickMaskMode = false

  //* Save this document resolution
  savedResolution = parseInt(activeDocument.resolution)

  //* Change to default resolution
  changeDocumentResolution(72)

}

function postProcessDocument(){

  //* Select Type Folder
  if (alreadyCreatedTextFolder){
    const folder = getTypeFolder()
    activeDocument.activeLayer = folder
    formatLayer(folder, config.groupLayer)
  }

  //* Change Resolution to a previous saved one
  changeDocumentResolution(savedResolution)

  //? Look for errors on 'config.docResolution'
  if (changeDocumentResolution(config.docResolution, true))
    config.docResolution = 0

  //? This will check for files with different resolutions, and ask the user if we can uniform it
  if (!config.docResolution){

    if (previousResolution === undefined){
      //* Store the first file resolution in a variable
      previousResolution = parseInt(activeDocument.resolution) || undefined // NaN -> undefined

    } else if (previousResolution){
      //* When a file opens with different resolution
      //? warn the user, and ask if it can be changed to the same as previous ones
      if (previousResolution !== parseInt(activeDocument.resolution))
      {
        const res = confirm("We opened a file with a resolution ("+ activeDocument.resolution +" ppi) other than those we opened before (" + previousResolution + " ppi). In this way, the size of the text will probably be different. Do you allow us to change the resolution of this file and subsequent files for the same resolution that we were using so far?\n\n\n\n(Tip: You can set a resolution in configuration file, so every file will be automatically converted to a given resolution.)", false, "Different Resolution")

        if (res) config.docResolution = previousResolution //? Will convert to this resolution
        previousResolution = false //? No need to ask anymore
      }
    }
  }


  //* Change Resolution
  if (config.docResolution && parseInt(config.docResolution) != parseInt(activeDocument.resolution))
    changeDocumentResolution(config.docResolution)

  //* Change Document Mode
  if (config.docColorMode){
    const error = changeDocumentMode(config.docColorMode)
    if (error) config.docColorMode = undefined
  }

  //* Change Document Color Profile
  if (config.docColorProfile) {

    if (typeof config.docColorProfile != "string"){
      throwError("Tried to change Document color profile to '" + config.docColorProfile + "'.", undefined, true)
      config.docColorProfile = undefined

    } else try {
        activeDocument.convertProfile(config.docColorProfile, Intent.RELATIVECOLORIMETRIC, true, true)
      } catch (error) {
        if (error.number === 8007)
          throwError( "'" + config.docColorProfile  + "' is a invalid color profile.", undefined, true)
        else throwError("An error ocurred while trying to change document color profile to '" + config.docColorProfile + "'.", error)
      }
  }
}

function getArrayFiles(){

  try {
    if (config.selectAllFiles || config.selectAllFiles === undefined)
      arrayFiles = File.openDialog("Select Files", ["All:*.txt;*" + supportedImageFiles.join(";*"), "Text:*.txt", "Images:*" + supportedImageFiles.join(";*")], true)
    else
      arrayFiles = Folder.selectDialog("Select Folder").getFiles()
  } catch (error) {}

  if (!Array.isArray(arrayFiles)) arrayFiles = []
  else {
    //? Remove Folders
    for (var i in arrayFiles)
      while (arrayFiles[i] instanceof Folder)
        arrayFiles.splice(i,1);

    //? Remove 'debug.log'
    for (var i in arrayFiles)
      if (arrayFiles[i].name === "debug.log"){
        arrayFiles.splice(i,1);
        break;
      }
  }

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

  const file = typeof pathOrFile == "string" ? getFileFromScriptPath(pathOrFile) : pathOrFile

  //? Check if argument is a instance of File
  if (!(file instanceof File))
    return throwError("readJson() received a " + typeof(file) + " instead of a File.")

  //? Check if the file Exists
  if (!file.exists)
    return isUnnecessary ? undefined : throwError(name + " is missing.\nPlease check if all files are in the Scripts folder.\n If necessary, download this script again at github.com/krevlinmen/AutoTypeSetter")

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
    throwError("An error occurred while saving your configuration.", error)
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
  if (typeof filename == "string")
  return File((new File($.fileName)).path + "/" + encodeURI(filename))
  throwError("getFileFromScriptPath() received a " + typeof(filename) + " instead of a String")
}

function isNewPage(line) {
  if (config.pageIdentifierPrefix == "" && config.pageIdentifierSuffix == "") return false
  const res = line.startsWith(config.pageIdentifierPrefix) && line.endsWith(config.pageIdentifierSuffix)
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

function findFormat(line){

  //? Shall be 'line === line.trim()'
  if (config.disableCustomTextFormats) return undefined
  if (config.ignoreCustomWith && line.startsWith(config.ignoreCustomWith))
    return undefined

  const candidates = [];

  for (var i in config.customTextFormats){
    var format = config.customTextFormats[i]

    if (!format.lineIdentifierPrefix && !format.lineIdentifierSuffix) continue;
    if (format.lineIdentifierPrefix === undefined) format.lineIdentifierPrefix = ""
    if (format.lineIdentifierSuffix === undefined) format.lineIdentifierSuffix = ""

    if (  line.startsWith(format.lineIdentifierPrefix) &&
          line.endsWith(format.lineIdentifierSuffix) &&
          getCustomFormattedLine(line, format) !== line )
      candidates.push(format);
  }

  if (candidates.length > 1)
    candidates.sort(
      function (a, b) {
        const aS = a.lineIdentifierSuffix;
        const bS = b.lineIdentifierSuffix;
        if (!aS ^ !bS)
          //? If one or another, but not both
          return aS ? -1 : 1; //? use the one with more identifiers

        const aP = a.lineIdentifierPrefix;
        const bP = b.lineIdentifierPrefix;
        if (!aP ^ !bP) return aP ? -1 : 1;

        const aR = aP.length + aS.length;
        const bR = bP.length + bS.length;

        return bR - aR; //? Compare the total length, and use the longest sequence
    });

  if (candidates.length) return candidates[0];
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
  const imageArray = [];

  //* Filter Files
  //? Function wrapper to not save these other constants in memory
  (function () {
    const unsupportedFiles = []
    const filesWithoutNumbers = []

    for (var i in arrayFiles) {
      var file = arrayFiles[i]
      var filename = file.name

      if (filename.toLowerCase().endsWith('.txt'))
        textFile = !textFile ? file : throwError("Multiple text files have been recognized.")
      else if (filename.toLowerCase().endsWithArray(supportedImageFiles)){
        if (isNaN(getFilenameNumber(file)))
          filesWithoutNumbers.push(decodeURI(filename))
        else
          imageArray.push(file)
      }
      else unsupportedFiles.push(decodeURI(filename))
    }

    if (unsupportedFiles.length)
      throwError("The following files are not supported by this script:\n" + unsupportedFiles.join("\n") + "\n\nThis script only supports the following extensions:\n" + supportedImageFiles.join(", ") + ", .txt", undefined, true)

    if (filesWithoutNumbers.length)
      throwError("The following files do not have page numbers in their filenames:\n" + filesWithoutNumbers.join("\n") + "\n\nPlease add page numbers to their filenames if you wish to edit those files.\n", undefined, true)
  })()

  //* Check if is not blank
  if (!imageArray.length)
    throwError("Not enough valid image files.");

  //* Sort Array - Prioritize Order
  (function () {
    const prioritizeOrder = supportedImageFiles.concat() //? A copy
    const getExtension = function (str) { return str.slice(str.lastIndexOf(".")) }

    if (config.prioritizePSD) {
      prioritizeOrder.unshift(prioritizeOrder.pop())
      prioritizeOrder.unshift(prioritizeOrder.pop())
    }

    imageArray.sort(function (a, b) { //? Sort duplicate files
      const aR = getKeyOf(prioritizeOrder, getExtension(a.name).toLowerCase())
      const bR = getKeyOf(prioritizeOrder, getExtension(b.name).toLowerCase())
      if (aR === undefined) return 1
      if (bR === undefined) return -1
      return aR - bR
    })
  })()

  //* Eliminate Duplicates
  for (var i = 0; i < imageArray.length; i++) {

    var n = getFilenameNumber(imageArray[i])
    var duplicates = []

    for (var j in imageArray) //? Search for file duplicates
      if (n == getFilenameNumber(imageArray[j]))
        duplicates.push(imageArray[j])

    for (var j = 1; j < duplicates.length; j++) { //? Remove duplicates from main array
      var index = getKeyOf(imageArray, duplicates[j])
      imageArray.splice(index, 1) //? Removing and returning it
    }
  }

  //* Sort Array - Common means
  imageArray.sort()

  return imageArray
}

function createContentObj() {

  if (!textFile || !textFile.name.toLowerCase().endsWith('.txt')) {
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
      current = getPageNumber(line)
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
      txt.size = new UnitValue(format.size, "px");

    if (isNotUndef(format.color) && format.color.length && isHexColor(format.color)){
      const color = new SolidColor();
      color.rgb.hexValue = format.color.slice(1);
      txt.color = color
    }

    if (isNotUndef(format.boxText)) {
      if (!format.boxText) txt.width = 9999 //! Without this, the text is cut out
      txt.kind = format.boxText ? TextType.PARAGRAPHTEXT : TextType.POINTTEXT
    }

    if (isNotUndef(format.hyphenation)) txt.hyphenation = format.hyphenation

    if (isNotUndef(format.justification) && format.justification.length){

      try {
        var just = format.justification.toUpperCase()
      } catch (error) {
        throwError("Invalid text format justification.", error)
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
          throwError("Invalid text format justification.", error)
        }
    }

    if (isNotUndef(format.language) && format.language.length)
      try {
        txt.language = Language[format.language.toUpperCase()]
      } catch (error) {
        throwError("Invalid Text format language.", error)
      }

    if (isNotUndef(format.antiAlias) && format.antiAlias.length)
      try {
        txt.antiAliasMethod = AntiAlias[format.antiAlias.toUpperCase()]
      } catch (error) {
        throwError("Invalid Text format anti-aliasing method.", error)
      }

    if (isNotUndef(format.capitalization) && format.capitalization.length)
      try {
        txt.capitalization = TextCase[format.capitalization.toUpperCase()]
      } catch (error) {
        throwError("Invalid Text format capitalization method.", error)
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

  for (var i in page) {
    var format = findFormat(page[i])
    var line = getCustomFormattedLine(page[i], format)

    if (!continueProcessing) break;

    writeTextLayer(line, i < page.length - 1, format)
    if (updateAtEachLine && isWindowAvailable) progressWindowObj.update()
  }

  //? De-initialize after finalizing this page
  positionObj.initialized = false
}


function writeTextLayer(text, activateDuplication, format) {


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
      throwError("An error occurred while formatting the text layer", error)
    }

  //? Positioning
  setLayerPosition(txtLayer.textItem)
}

function setLayerPosition(txt) {

  //* Initialize page position info
  if (!positionObj.initialized){
    positionObj.docWidth = activeDocument.width
    positionObj.docHeight = activeDocument.height
    positionObj.docWidth.convert("px")
    positionObj.docHeight.convert("px")

    positionObj.xMargin = positionObj.docWidth * textMargin
    positionObj.yMargin = positionObj.docHeight * textMargin

    positionObj.x = positionObj.xMargin
    positionObj.y = positionObj.yMargin
    positionObj.width = positionObj.docWidth * textBoxWidth
    positionObj.group = 1
    positionObj.initialized = true
  }

  //* Declare Constants
  const isBoxText = txt.kind === TextType.PARAGRAPHTEXT
  const size = txt.size
  size.convert("px")
  //! Text height defining. Attention: black magic trickery very suspicious
  const height = (size * 1.1) * (
    !isBoxText ? 1 :
    Math.ceil(txt.contents.length / (positionObj.width / (size * 6 / 7)))
    )

  //* Positioning
  if (isBoxText) {
    txt.position = [positionObj.x, positionObj.y]
    txt.width = positionObj.width
    txt.height = height
  } else
    txt.position = [positionObj.x + pointTextXoffset(txt.justification), positionObj.y + (size * 1.1) / 2]

  //* Post Positioning
  //? Set the y coordinate for the next text
  positionObj.y += height + (positionObj.yMargin) / 2

  //? Check and handle text reaching end of a page
  if (positionObj.y >= positionObj.docHeight) {
    positionObj.y = positionObj.yMargin              //? Reset y coordinate
    positionObj.x += positionObj.width + positionObj.xMargin //? Move  x coordinate
    positionObj.group += 1                   //? Set the text group flag
  }
}

function pointTextXoffset(justification){
  //? Gives the right amount of offset to text x coordinate,
  //? to maintaining the text in the middle
  switch (justification) {
    case Justification.LEFT:
      return 0
    case Justification.RIGHT:
      return positionObj.width
    default:
      return positionObj.width / 2
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
      throwError("An error occurred while trying to delete the saved configuration.", error)
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