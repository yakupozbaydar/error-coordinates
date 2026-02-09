import * as vscode from "vscode";
import { DiagnosticCollector } from "./diagnosticCollector";
import { getConfig } from "./types";

export class NavigationController implements vscode.Disposable {
  private readonly _disposables: vscode.Disposable[] = [];

  constructor(private readonly _collector: DiagnosticCollector) {
    this._disposables.push(
      vscode.commands.registerCommand(
        "errorCoordinates.nextError",
        () => this._jumpToError("next")
      ),
      vscode.commands.registerCommand(
        "errorCoordinates.previousError",
        () => this._jumpToError("previous")
      ),
      vscode.commands.registerCommand(
        "errorCoordinates.listErrors",
        () => this._listErrors()
      )
    );
  }

  private _jumpToError(direction: "next" | "previous"): void {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    const errors = this._collector.getErrors(editor.document.uri);
    if (errors.length === 0) {
      vscode.window.showInformationMessage("No errors in this file.");
      return;
    }

    const cursorLine = editor.selection.active.line;
    let targetIndex: number;

    if (direction === "next") {
      targetIndex = errors.findIndex((e) => e.line > cursorLine);
      if (targetIndex === -1) {
        // Wrap around to first error
        targetIndex = 0;
      }
    } else {
      // Find last error before cursor
      targetIndex = -1;
      for (let i = errors.length - 1; i >= 0; i--) {
        if (errors[i].line < cursorLine) {
          targetIndex = i;
          break;
        }
      }
      if (targetIndex === -1) {
        // Wrap around to last error
        targetIndex = errors.length - 1;
      }
    }

    const error = errors[targetIndex];
    const position = new vscode.Position(error.line, 0);
    editor.selection = new vscode.Selection(position, position);
    editor.revealRange(
      new vscode.Range(position, position),
      vscode.TextEditorRevealType.InCenter
    );

    const config = getConfig();
    if (config.showToastOnJump) {
      const lineNum = error.line + 1;
      const total = errors.length;
      const current = targetIndex + 1;
      vscode.window.showInformationMessage(
        `Line ${lineNum}: ${error.message} (${current}/${total})`
      );
    }
  }

  private async _listErrors(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    const errors = this._collector.getErrors(editor.document.uri);
    if (errors.length === 0) {
      vscode.window.showInformationMessage("No errors in this file.");
      return;
    }

    const items: vscode.QuickPickItem[] = errors.map((error, i) => ({
      label: `$(error) Line ${error.line + 1}`,
      description: error.message,
      detail: error.source
        ? `${error.source}${error.code ? ` (${error.code})` : ""}`
        : undefined,
    }));

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: `${errors.length} error(s) in this file`,
      matchOnDescription: true,
    });

    if (selected) {
      const index = items.indexOf(selected);
      const error = errors[index];
      const position = new vscode.Position(error.line, 0);
      editor.selection = new vscode.Selection(position, position);
      editor.revealRange(
        new vscode.Range(position, position),
        vscode.TextEditorRevealType.InCenter
      );
    }
  }

  dispose(): void {
    for (const d of this._disposables) {
      d.dispose();
    }
  }
}
