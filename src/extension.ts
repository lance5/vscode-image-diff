// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { ImageDiffViewer, initWebview } from "./diffViewer";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand(
    "image-diff.helloWorld",
    () => {
      // The code you place here will be executed every time your command is executed
      // Display a message box to the user
      const panel = vscode.window.createWebviewPanel(
        ImageDiffViewer.viewType,
        "Diff",
        vscode.ViewColumn.One,
        {}
      );
      initWebview(panel, context);
    }
  );

  context.subscriptions.push(disposable);
  context.subscriptions.push(ImageDiffViewer.register(context));
}

// This method is called when your extension is deactivated
export function deactivate() {}
