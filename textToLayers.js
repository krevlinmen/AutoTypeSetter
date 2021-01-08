/* 
<javascriptresource>
  <name>Auto typesetting by Krevlinmen and ImSamuka</name>
  <type>scripts</type>
  <about>A program that automatically inputs text from files</about>
  <enableinfo>true</enableinfo>
</javascriptresource>
*/


/* -------------------------------------------------------------------------- */
/*                                Preparations                                */
/* -------------------------------------------------------------------------- */



/* ------------------------------- Parameters ------------------------------- */

const identifier_Start = "["
const identifier_End = "]"

//? Default Typesetting Format
const defaultTextFormat = {
  size: 16,
  font: "CCWildWordsInt Regular",
  border: "#FFFFFF-3-outer-false" 
  // color(hex)-size(px)-position(outer/center/inner)-visible(false/true)

}

//0 or false= Correspondent Page Identified
//1 or true= Ignore Page Number
const ignorePageNumber = true



//? Show all Errors
app.displayDialogs = DialogModes.ERROR //change to NO by the End

var textFile;
var multipleArchives = false
const arrayFiles = app.openDialog()

var yPosition = 20
var newFolder

/* -------------------------------------------------------------------------- */
/*                                    Main                                    */
/* -------------------------------------------------------------------------- */


/* -------------------------------- Open Files ------------------------------ */



if (arrayFiles.length === 0) //No input!
  throwError("No files were selected!")
else if (arrayFiles.length === 1)
  textFile = arrayFiles[0]
else
  multipleArchives = true

if (!multipleArchives) {
  try {
    if (activeDocument)
      multipleArchives = false //useless
  } catch (error) {
    throwError("No document open.")
  }
}
processText()


/* -------------------------------------------------------------------------- */
/*                                  Functions                                 */
/* -------------------------------------------------------------------------- */

/* --------------------------------- Helpers -------------------------------- */

function throwError(message) {
  if (app.displayDialogs === DialogModes.NO) alert(message)
  throw new Error(message)
}

function isNaN(p) {
  return p !== p
}

//? Return if 'main' string starts with 'sub' string
function startsWith(main, sub) {
  return !sub.length || main.indexOf(sub) === 0
}

//? Return if 'main' string ends with 'sub' string
function endsWith(main, sub) {
  return !sub.length || main.slice(main.length - sub.length).indexOf(sub) === 0
}

function endsWithArray(main, subArray) {
  for (i in subArray)
    if (endsWith(main, subArray[i]))
      return true;
  return false;
}

//? Removes Spaces and Tabs after and before a string 
function trim(text) {
  var sl = 0
  var el = 0

  for (i = 0; i < text.length; i++)
    if (text.charAt(i) !== " " && text.charAt(i) !== "\t") break;
    else sl += 1

  for (i = text.length - 1; i > -1; i--)
    if (text.charAt(i) !== " " && text.charAt(i) !== "\t") break;
    else el += 1

  return text.slice(sl, text.length - el)
}

function keys(obj) {
  const arr = []
  for (k in obj)
    arr.push(k)
  return arr
}

function getNumber(str) {
  return parseInt(str.slice(identifier_Start.length, str.length - identifier_End.length))
}

function isNewPage(line) {
  const res = startsWith(line, identifier_Start) && endsWith(line, identifier_End)
  if (ignorePageNumber)
    return res
  else
    return res && !isNaN(getNumber(line))
}

function check(item) {
  alert(item)
  alert(typeof (item))
}

/* ------------------------------ File Handling ----------------------------- */

function openTextFile() {
  if (!textFile || !endsWith(textFile.name, '.txt')) {
    throwError("No text file was selected!")
  }
  textFile.encoding = 'UTF8'; // set to 'UTF8' or 'UTF-8'
  textFile.open("r");
  const rawText = textFile.read();
  textFile.close();
  return rawText
}

function filterFiles(arrayUsed) {
  const imageArray = []
  for (i in arrayUsed) {
    var file = arrayUsed[i]

    if (!endsWithArray(file.name, ['.txt', '.png', '.jpeg', '.jpg', 'psd', 'psb']))
      throwError("One or more files are not supported by this script!\nThis script supports the extensions:\n.png, .jpg, .jpeg, .psd, .psb, .txt")
    else if (endsWith(file.name, '.txt'))
      textFile = file
    else
      imageArray.push(file)
  }
  imageArray.sort()
  return imageArray
}

function getFont(fontName) {
  //? Loop through every font
  for (i = 0; i < app.fonts.length; i++)
    //? search a font with the name including 'fontName' 
    if (app.fonts[i].name.indexOf(fontName) > -1)
      return app.fonts[i]
  //? else return "Arial" by default
  return getFont("Arial")
}

function newTextLayer(text, duplicate, format) {
  //? if duplicate was given, we will duplicate the layer, and return it

  //? Use Default Format if 'format' not given
  if (format === undefined)
    format = defaultTextFormat
//duplicar camadas pra ir mais rapido
  //? Creating Text Layer 
  const txtLayer = newFolder.artLayers.add()
  txtLayer.kind = LayerKind.TEXT

  //? Custom Formatting 
  txtLayer.textItem.contents = text
  if (format.size) txtLayer.textItem.size = format.size
  if (format.font) txtLayer.textItem.font = getFont(format.font).postScriptName
  txtLayer.textItem.position = [20, yPosition]

  //? Default Properties
  txtLayer.textItem.kind = TextType.PARAGRAPHTEXT
  txtLayer.textItem.justification = Justification.CENTER
  txtLayer.textItem.language = Language.BRAZILLIANPORTUGUESE
  
  
  //? Default Properties
  txtLayer.textItem.width = activeDocument.width * 0.2
  txtLayer.textItem.height = (format.size * 1.1) * Math.ceil(text.length / (txtLayer.textItem.width / (6 * format.size / 7)))
  yPosition += txtLayer.textItem.height + 0.3 * format.size //acrescents the height of the body to the y value of position 


  return txtLayer
}

/* -------------------------------- Editing ------------------------------- */

function createDataObj() {

  //? Split text into array of texts
  const rawText = openTextFile()
  const textArray = rawText.split("\n")

  const content = { 0: [] }
  var current = 0

  for (t in textArray) {
    var line = trim(textArray[t])

    if (isNewPage(line)) {
      current = ignorePageNumber ? current + 1 : getNumber(line)
      content[current] = []
    }
    else if (current && line.length) { //ERROR
      content[current].push(line)
    }
  }

  return content
}


function processText() {
  const imageArrayDir = filterFiles(arrayFiles)
  const content = createDataObj()
  var found;

  delete content[0] //Deletes text before the first identifier

  if (multipleArchives) {

    var keyNum;

    function find(array, num) {
      for (i in array) {
        var file = array[i]
        if (num === parseInt(file.name.slice(0, file.name.lastIndexOf("."))))
          return file
      }
    }

    for (key in content) {
      keyNum = parseInt(key)
      if (ignorePageNumber && (keyNum - 1) >= imageArrayDir.length) {
        break;
      }

      found = ignorePageNumber ? imageArrayDir[keyNum - 1] : find(imageArrayDir, keyNum)

      if (found === undefined) {
        continue;
      }

      open(found)
      cleanFile()

      var page = content[key]

      for (i in page) {
        
        newTextLayer(page[i]) //Write all text Layers
      }
      saveAndClosefile(found)
    }
  } else {
    //? Get the first valid key of 'content'
    var page = content[keys(content)[0]]

    cleanFile()
    for (i in page)
      newTextLayer(page[i]) //Write all text Layers
  }
}

function createLayer(name, format) {
  //? Default Format
  const defaultFormat = {
    color: undefined,
    locked: false,
    type: undefined//levels,text,etc
  }

  //? Use Default Format if 'format' not given
  if (format === undefined)
    format = defaultFormat

  const newLayer = activeDocument.artLayers.add()
  newLayer.name = name

  //if (format.size) txtLayer.textItem.size = format.size
  return newLayer

}//use more

function cleanFile() {
  assertTypeFolder()
  try {
    var editL = activeDocument.backgroundLayer.duplicate()
    editL.name = "Camada para Edicao"
    activeDocument.backgroundLayer.name = "Camada Raw"
  } catch (error) {
    return
  }

  createLayer('baloes')
  createLayer('ReDraw')
}

function saveAndClosefile(file) {
  const filePath = file.fullName

  function getSavePath() {
    const ext = ['.png', '.jpg', '.jpeg']
    for (i in ext)
      if (endsWith(filePath, ext[i]))
        return filePath.slice(0, filePath.length - ext[i].length)
  }

  const saveFile = File(getSavePath() + '.psd')
  activeDocument.saveAs(saveFile)
  activeDocument.close()
  yPosition = 20
}

function assertTypeFolder() {
  try {
    //? Try find a folder with name "Type"
    newFolder = activeDocument.layerSets.getByName("Type")
  } catch (error) {
    //? If not found, create one
    newFolder = activeDocument.layerSets.add()
    newFolder.name = "Type"
  }
}