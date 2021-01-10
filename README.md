
# Configuration File


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
  
  
  
  selectAllFiles: false, // With this, you select every file manually, rather than a folder
  
  groupLayer: {
    groupName: "Types",       // Folder name
    visible: false,           // Visibility of the layer
    alwaysCreateGroup: false, // With this, even if a folder named by 'groupName' already exists, it will create another
    layerColor: null          // TODO: Not yet implemented
  },
  
  defaultTextFormat: {
    size: 16,                          // Font size
    font: "CCWildWordsInt Regular",    // Font name
    boxText: true,                     // A TextBox instead of a PointText
    justification: "CENTER",           // Justification
    visible: true,                     // Visibility of the layer
    language: "BRAZILLIANPORTUGUESE",  // Language
    layerColor: null                   // TODO: Not yet implemented
  },
  
  
  // TODO: BELOW IS NOT IMPLEMENTED YET
  
  ignoreCustomWith: ".", // Lines starting with this, will always be formatted as default
  
  customTextFormats: [   // You can Add as much 'objects' as you want
    {
      // Necessary:
      identifier_Start: "#", // Lines starting with this, will be formatted as following
      
      // Optional:
      // Everything not included will be formatted as in default
      size: 12,
      font: "Chinacat",
      boxText: false,
      border: "#FFFFFF-3-outer-false"  // TODO: Not yet implemented
    }
  ]
}
```
