import {
  Transform,
  Parser,
} from "visitor-as/as";

export = class MyTransform extends Transform {
  afterParse(parser: Parser): void {
    
  }
}