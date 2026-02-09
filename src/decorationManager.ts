import * as vscode from "vscode";
import { DiagnosticCollector } from "./diagnosticCollector";
import { getConfig } from "./types";

export class DecorationManager implements vscode.Disposable {
  private _gutterType: vscode.TextEditorDecorationType | undefined;
  private _rulerType: vscode.TextEditorDecorationType | undefined;
  private readonly _disposables: vscode.Disposable[] = [];

  constructor(
    private readonly _collector: DiagnosticCollector,
    private readonly _context: vscode.ExtensionContext
  ) {
    this._createDecorationTypes();

    this._disposables.push(
      this._collector.onDidChangeErrors(() => {
        this._updateActiveEditor();
      }),
      vscode.window.onDidChangeActiveTextEditor(() => {
        this._updateActiveEditor();
      }),
      vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration("errorCoordinates")) {
          this._recreateDecorationTypes();
          this._updateActiveEditor();
        }
      })
    );

    // Initial decoration
    this._updateActiveEditor();
  }

  private _createDecorationTypes(): void {
    const config = getConfig();

    this._gutterType = vscode.window.createTextEditorDecorationType({
      gutterIconPath: this._context.asAbsolutePath(
        "resources/icons/error-marker.svg"
      ),
      gutterIconSize: "80%",
      light: {
        gutterIconPath: this._context.asAbsolutePath(
          "resources/icons/error-marker-light.svg"
        ),
      },
    });

    this._rulerType = vscode.window.createTextEditorDecorationType({
      overviewRulerColor: config.markerColor,
      overviewRulerLane: vscode.OverviewRulerLane.Full,
      isWholeLine: true,
      borderWidth: "0 0 0 3px",
      borderStyle: "solid",
      borderColor: `${config.markerColor}40`,
    });
  }

  private _recreateDecorationTypes(): void {
    this._gutterType?.dispose();
    this._rulerType?.dispose();
    this._createDecorationTypes();
  }

  private _updateActiveEditor(): void {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    const config = getConfig();

    if (!config.enabled) {
      this._clearDecorations(editor);
      return;
    }

    const errors = this._collector.getErrors(editor.document.uri);

    const gutterDecorations: vscode.DecorationOptions[] = [];
    const rulerDecorations: vscode.DecorationOptions[] = [];

    for (const error of errors) {
      const lineNum = error.line + 1; // 0-based to 1-based for display
      const hoverMessage = new vscode.MarkdownString(
        `**Line ${lineNum}** — ${error.message}`
      );

      const decoration: vscode.DecorationOptions = {
        range: new vscode.Range(error.line, 0, error.line, 0),
        hoverMessage,
      };

      if (config.gutterIconEnabled) {
        gutterDecorations.push(decoration);
      }

      if (config.overviewRulerEnabled) {
        rulerDecorations.push(decoration);
      }
    }

    if (this._gutterType) {
      editor.setDecorations(this._gutterType, gutterDecorations);
    }
    if (this._rulerType) {
      editor.setDecorations(this._rulerType, rulerDecorations);
    }
  }

  private _clearDecorations(editor: vscode.TextEditor): void {
    if (this._gutterType) {
      editor.setDecorations(this._gutterType, []);
    }
    if (this._rulerType) {
      editor.setDecorations(this._rulerType, []);
    }
  }

  dispose(): void {
    this._gutterType?.dispose();
    this._rulerType?.dispose();
    for (const d of this._disposables) {
      d.dispose();
    }
  }
}
