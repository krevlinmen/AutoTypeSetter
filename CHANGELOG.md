# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### TODO

- Option to color in text
- Option to change antiAliasMethod in text
- lineIdentifierSuffix for customTextFormats
- Automatic Update Checking
- Retro-compatibility with PhotoShop CS6
- Check Page identifying
- Check Getting archive number and ambiguous files
- calculatePositions, check if border of file has been reached
- Check column groups

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
