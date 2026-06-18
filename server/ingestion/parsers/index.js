const BaseParser = require('./BaseParser');
const DAADParser = require('./DAADParser');
const FestivalParser = require('./FestivalParser');
const UniversityParser = require('./UniversityParser');

const PARSER_REGISTRY = {
  daad: DAADParser,
  festival: FestivalParser,
  university: UniversityParser,
  generic: BaseParser,
};

function createParser(source) {
  const ParserClass = PARSER_REGISTRY[source.parser_type] || BaseParser;
  return new ParserClass(source);
}

function registerParser(type, ParserClass) {
  PARSER_REGISTRY[type] = ParserClass;
}

function listParserTypes() {
  return Object.keys(PARSER_REGISTRY);
}

module.exports = {
  createParser,
  registerParser,
  listParserTypes,
  PARSER_REGISTRY,
};