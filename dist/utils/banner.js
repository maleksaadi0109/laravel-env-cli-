"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.printBanner = printBanner;
exports.printSectionHeader = printSectionHeader;
const chalk_1 = __importDefault(require("chalk"));
function printBanner() {
    console.log();
    console.log(chalk_1.default.red.bold(`  _       _____ _   ___     __`));
    console.log(chalk_1.default.red.bold(` | |     | ____| \\ | \\ \\   / /`));
    console.log(chalk_1.default.red.bold(` | |     |  _| |  \\| |\\ \\ / / `));
    console.log(chalk_1.default.red.bold(` | |___  | |___| |\\  | \\ V /  `));
    console.log(chalk_1.default.red.bold(` |_____| |_____|_| \\_|  \\_/   `));
    console.log(chalk_1.default.cyan(` 🚀 Laravel & Docker Environment CLI v1.0.0`));
    console.log(chalk_1.default.gray(` ───────────────────────────────────────────────────────────`));
    console.log();
}
function printSectionHeader(title) {
    console.log(`\n${chalk_1.default.cyan.bold('❯ ' + title)}\n`);
}
