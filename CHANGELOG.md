# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### TODO

- Add a warning in Text Format Editor when a identifier is the same as page identifiers, or other identifiers
- Check if it's a good idea in Text Format Editor to only save CHANGES, and update each control manually
- Try to use a win.layout automatic layout to update window without resetting

- calculatePositions, check if border of file has been reached

- Automatic Update Checking - Only possible with C dll libraries, the socket from ExtendScript is a piece of shit

### Added

- New window: Text Format Editor!
- Option to see and cancel files currently being processed
- Option to change ppi, Image Mode and Color Profile
- Color, Capitalization, Anti-Aliasing, Hyphenation options for Text Format
- lineIdentifierSuffix for customTextFormats

### Fixed

- The "debug.log" file is not accessible anymore
- Text files not encoded as UTF-8 no longer breaks the program
- Different resolutions no more affect text size
- Exact font names can be used now, even if another match was found first in the list of fonts
- Point Text positioning and sizing

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
