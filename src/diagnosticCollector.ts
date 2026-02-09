import * as vscode from "vscode";
import { ErrorEntry, ErrorMap } from "./types";

export class DiagnosticCollector implements vscode.Disposable {
  private readonly _errorMap: ErrorMap = new Map();
  private readonly _disposables: vscode.Disposable[] = [];

  private readonly _onDidChangeErrors = new vscode.EventEmitter<string>();
  readonly onDidChangeErrors = this._onDidChangeErrors.event;

  constructor() {
    this._disposables.push(
      vscode.languages.onDidChangeDiagnostics((e) => {
        for (const uri of e.uris) {
          this._collectForUri(uri);
        }
      }),
      vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (editor) {
          this._collectForUri(editor.document.uri);
        }
      }),
      this._onDidChangeErrors
    );

    // Initial collection for the active editor
    if (vscode.window.activeTextEditor) {
      this._collectForUri(vscode.window.activeTextEditor.document.uri);
    }
  }

  private _collectForUri(uri: vscode.Uri): void {
    const diagnostics = vscode.languages.getDiagnostics(uri);
    const errors = diagnostics.filter(
      (d) => d.severity === vscode.DiagnosticSeverity.Error
    );

    // Dedupe by line number, keep first occurrence per line
    const seenLines = new Set<number>();
    const entries: ErrorEntry[] = [];

    for (const diag of errors) {
      const line = diag.range.start.line;
      if (seenLines.has(line)) {
        continue;
      }
      seenLines.add(line);
      entries.push({
        line,
        message: diag.message,
        range: diag.range,
        source: diag.source ?? "",
        code:
          typeof diag.code === "object" ? diag.code.value : diag.code,
      });
    }

    // Sort by line number
    entries.sort((a, b) => a.line - b.line);

    const key = uri.toString();
    this._errorMap.set(key, entries);
    this._onDidChangeErrors.fire(key);
  }

  getErrors(uri: vscode.Uri): ErrorEntry[] {
    return this._errorMap.get(uri.toString()) ?? [];
  }

  getErrorLines(uri: vscode.Uri): number[] {
    return this.getErrors(uri).map((e) => e.line);
  }

  refresh(): void {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      this._collectForUri(editor.document.uri);
    }
  }

  dispose(): void {
    for (const d of this._disposables) {
      d.dispose();
    }
    this._errorMap.clear();
  }
}
