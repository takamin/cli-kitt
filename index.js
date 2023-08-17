const hashArg = require("hash-arg");

/**
 * コマンドスキーマ
 */
class CommandSchema {
  /**
   * コマンド実行
   * @param {Array<object>} commandSchemaList
   */
  constructor(commandSchemaList) {
    this.commandSchema = commandSchemaList.reduce((acc, cur) => {
      acc[cur.name] = new SubCommandSchema(cur);
      return acc;
    }, {});
  }
  /**
   * サブコマンドスキーマを取得する
   * @param {string} name
   * @returns {SubCommandSchema}
   */
  subCommand(name) {
    const subCommand = this.commandSchema[name];
    return subCommand;
  }
  /**
   * 全体の使い方を表示する
   */
  printUsage() {
    console.error(`Usage: ${process.argv[1]} <sub-command:string> ...`);
    console.error("");
    console.error("使用可能なサブコマンド");
    Object.entries(this.commandSchema).forEach(([key, value]) => {
      console.error(`  ${key}:`);
      console.error(`    ${value.description.split("\n")[0]}`);
    });
  }
  /**
   * コマンド実行
   */
  run() {
    const subCommandName = process.argv[2];
    if (subCommandName == null) {
      throw new Error("sub command is required");
    }
    const subCommand = this.subCommand(subCommandName);
    if (subCommand == null) {
      throw new Error(`sub command '${subCommandName}' is not found`);
    }
    const paramSchema = subCommand.paramSchema;
    const restParameters = hashArg.get(paramSchema, process.argv.slice(3));
    subCommand.run(restParameters);
  }
  /**
   * コマンド実行
   * @param {Array<object>} commandSchemaList
   */
  static run(commandSchemaList) {
    const commandSchema = new CommandSchema(commandSchemaList);
    try {
      commandSchema.run();
    } catch (e) {
      console.error(`Error: ${e.message}`);
      commandSchema.printUsage();
      process.exit(1);
    }
  }
}
/**
 * サブコマンドスキーマ
 */
class SubCommandSchema {
  /**
   * コンストラクタ
   * @param {SubCommandSchema|object} other
   */
  constructor(other) {
    this.name = other.name;
    this.description = other.description;
    this.paramSchema = other.paramSchema;
    this.process = other.process;
  }
  /**
   * サブコマンドレベルの使い方を表示する
   */
  printUsage() {
    const [desc, detail] = splitHeadline(this.description);
    console.error(``);
    console.error(`名前:`);
    console.error(`  '${this.name}' - ${desc}`);
    console.error(`使い方:`);
    console.error(
      `  ${process.argv[1]} '${this.name}' ${this.paramSchema
        .map((p) => `<${p.name}>`)
        .join(" ")}`
    );
    console.error(`パラメータ:`);
    this.paramSchema.forEach((param) => {
      const [desc, detail] = splitHeadline(param.description);
      console.error(`  ${param.name} (型:${param.type}) - ${desc}`);
      if (detail) {
        console.error(`${indent(4, detail)}`);
      }
    });
    console.error(`説明:`);
    if (detail) {
      console.error(`${indent(2, detail)}`);
      console.error(``);
    }
  }
  /**
   * 処理の実行
   * @param {object} parameters
   */
  run(parameters) {
    try {
      this.process.call(this, parameters);
    } catch (e) {
      console.error(`Error: ${e.message}`);
      this.printUsage();
      process.exit(1);
    }
  }
}
/**
 * 文字列を最初の1行とそれ以降の行に分割する。
 * @param {string} s
 * @returns {[string, string]}
 */
function splitHeadline(s) {
  const lines = s.split("\n");
  const description = lines[0];
  const detail = lines.slice(1).join("\n");
  return [description, detail];
}
/**
 * インデントを付ける
 * @param {number} n
 * @param {string} s
 * @returns {string}
 */
function indent(n, s) {
  return s
    .split("\n")
    .map((line) => `${" ".repeat(n)}${line}`)
    .map((line) => `${line.trim() === "" ? "" : line}`)
    .join("\n");
}
module.exports = {
  CommandSchema,
  SubCommandSchema,
};
