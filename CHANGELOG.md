# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### TODO

- Move UI code to other files
- Move simple functions to other files
- Add new window for customTextFormats
- Add Color, Capitalization and Anti-Alias menus
- Test Color, Capitalization and Anti-Alias options for Text Format
- Test lineIdentifierSuffix for customTextFormats

- Check Page identifying
- Check Getting archive number and ambiguous files
- calculatePositions, check if border of file has been reached
- Check column groups

- Test all features in CC 2018
- Retro-compatibility with PhotoShop CS6 - Some scripts have UI, but i don't know how - other people having this problem are probably using windows 7
- Automatic Update Checking - Only possible with C dll libraries, socket from ExtendScript is a piece of shit

### Added

- Color, Capitalization and Anti-Alias options for Text Format
- lineIdentifierSuffix for customTextFormats

## [2.0] - 2021-02-02

### Added

- This CHANGELOG file
- New User interface section: **Text Format**, used to change the default text format more easily
- New window: **Custom Layers Editor** used to change 'starterLayerFormats'
- Ability to create sub-groups by columns
- New Layer Format Object properties
- New common properties
- Disable property to 'starterLayerFormats' and 'customTextFormats'

### Changed

- Lots of default configuration
- 'Polyfill' folder name to 'lib'
- 'defaultConfig.json' moved to 'lib' folder

### Security

- Configuration validating is more consistent and secure

## [1.0] - 2021-01-26

### Added

- A user interface
- Standard Layer Format Object
- Support to `JSON` as configuration file
- Folder Polyfill, containing `.js` libraries
- README.md with documentation about the program

### Fixed

- Problem selecting ambiguous files (Example: `01.png` and `1.psd`)

[unreleased]: https://github.com/krevlinmen/AutoTypeSetter/compare/v2.0...HEAD
[2.0]: https://github.com/krevlinmen/AutoTypeSetter/compare/v1.0...v2.0
[1.0]: https://github.com/krevlinmen/AutoTypeSetter/releases/tag/v1.0
