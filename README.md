# Layer Format Object
This can be used in `defaultTextFormat`, `customTextFormats`, `starterLayerFormats` and `groupLayer` properties from the configuration file.

### Common Properties
Can be used in any properties from the configuration file.
| Property  | Type  | Description |
| :------------ |:---------------:| :-----|
| name | string | The layer name. |
| visible | boolean |  If the layer will be visible or not. |
| allLocked | boolean |  Completely block settings and contents of the layer. Will deactivate all 3 below. |
| transparentPixelsLocked | boolean |  Edit only opaque portions of the layer. |
| pixelsLocked | boolean |  Pixels can't be edited (with a Paint Brush for example). |
| positionLocked | boolean |  Layer can't be moved. |
| border | string |  Not yet implemented |

### Text Properties
Can only be used in `defaultTextFormat` and `customTextFormats` from the configuration file.
| Property  | Type  | Description |
| :------------ |:---------------:| :-----|
| identifierStart | string | Can only be used in `customTextFormats` and is **Obrigatory**. Identifies the type of formatting to use in a line of text. Will be ignored if `ignoreCustomWith` identifier was found before this. |
| size | integer | Font size. |
| font | string |  Font name. |
| justification | string |  Text justification. See [Documentation](#Documentation) for options. |
| language | string |  Text language, useful for auto-wrapping. See [Documentation](#Documentation) for options. |
| boxText | boolean |  If true, a TextBox will be used instead of a PointText. |


### Starter Layer Properties
Can only be used in `starterLayerFormats` from the configuration file.
| Property  | Type  | Description |
| :------------ |:---------------:| :-----|
| duplicate | boolean | Is a duplicate from layer below. Can only be used from the 2 layer. |
| isBackgroundLayer | boolean |  Turn this layer the background layer. Will override a lot of configurations. |





# Configuration File
This is a commented configuration file as example. **But remember, `.JSON` files CAN'T have comments.**

```javascript
{
  // These 3 Configurations determine how we will identify
  // a new 'page' in your .txt file:
  
  identifierStart: "[", 
  identifierEnd: "]",
  ignorePageNumber: false, // This will ignore the number inside indentifiers
    // This example will identify lines like:
    // [1]
    // [02] 
    //  [ 30 ]
    // And will try to find files like
    // "01.png", "2.psd", "30.jpeg" to insert this text into
  
  
  "prioritizePSD": false, // Prioritize '.psd' and '.psb' over the other files
  // If have ambiguous files selected like "01.png" and "1.psd"
  // There is a order of priorities, that is:
  // '.psd', '.psb', '.png',  '.jpg', '.jpeg'  OR
  // '.png', '.jpg', '.jpeg', '.psd', '.psb'
  
  
  selectAllFiles: false,  // With this, you select every file manually, rather than a folder
  alwaysCreateGroup: false, // With this, it will always create a folder named by 'groupLayer.name' below
  
  groupLayer: {
    name: "Types",   // Folder name
    visible: false,  // Visibility of the layer
  },
  
  defaultTextFormat: {
    size: 16,                          // Font size
    font: "CCWildWordsInt Regular",    // Font name
    boxText: true,                     // A TextBox instead of a PointText
    justification: "CENTER",           // Justification
    visible: true,                     // Visibility of the layer
    language: "BRAZILLIANPORTUGUESE",  // Language
  },
  
  
  
  ignoreCustomWith: ".", // Lines starting with this, will always be formatted as default
  
  customTextFormats: [   // You can Add as much 'Layer Format Object's as you want
    {
      // Necessary:
      identifier_Start: "#", // Lines starting with this, will be formatted as following
      
      // Optional:
      // Everything not included will be formatted as in default
      size: 12,
      font: "Chinacat",
      boxText: false
    }
  ]
}
```



# Documentation



This program was made using [Adobe Photoshop 2020 Scripting](https://www.adobe.com/devnet/photoshop/scripting.html) and the javascript documentation can be found there.

Justification Options:
- CENTER
- CENTERJUSTIFIED
- FULLYJUSTIFIED
- LEFT
- LEFTJUSTIFIED
- RIGHT
- RIGHTJUSTIFIED

Language Options:
- BRAZILLIANPORTUGUESE
- CANADIANFRENCH
- DANISH
- DUTCH
- ENGLISHUK
- ENGLISHUSA
- FINNISH
- FRENCH
- GERMAN
- ITALIAN
- NORWEGIAN
- NYNORSKNORWEGIAN
- OLDGERMAN
- PORTUGUESE
- SPANISH
- SWEDISH
- SWISSGERMAN

# Credits

User Interface Created With https://scriptui.joonas.me/

Programmed by ImSamuka and Krevlinmen
