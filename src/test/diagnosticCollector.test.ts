import * as assert from "assert";
import * as vscode from "vscode";
import { DiagnosticCollector } from "../diagnosticCollector";

suite("DiagnosticCollector", () => {
  let collector: DiagnosticCollector;
  let diagnosticCollection: vscode.DiagnosticCollection;

  setup(() => {
    collector = new DiagnosticCollector();
    diagnosticCollection =
      vscode.languages.createDiagnosticCollection("test-errors");
  });

  teardown(() => {
    collector.dispose();
    diagnosticCollection.dispose();
  });

  test("should collect errors from diagnostics", async () => {
    const doc = await vscode.workspace.openTextDocument({
      content: "line0\nline1\nline2\n",
      language: "plaintext",
    });
    await vscode.window.showTextDocument(doc);

    const diag = new vscode.Diagnostic(
      new vscode.Range(1, 0, 1, 5),
      "Test error on line 2",
      vscode.DiagnosticSeverity.Error
    );

    // Wait for the change event to propagate
    const changed = new Promise<void>((resolve) => {
      const sub = collector.onDidChangeErrors(() => {
        sub.dispose();
        resolve();
      });
    });

    diagnosticCollection.set(doc.uri, [diag]);
    await changed;

    const errors = collector.getErrors(doc.uri);
    assert.strictEqual(errors.length, 1);
    assert.strictEqual(errors[0].line, 1);
    assert.strictEqual(errors[0].message, "Test error on line 2");
  });

  test("should filter out warnings", async () => {
    const doc = await vscode.workspace.openTextDocument({
      content: "line0\nline1\n",
      language: "plaintext",
    });
    await vscode.window.showTextDocument(doc);

    const warning = new vscode.Diagnostic(
      new vscode.Range(0, 0, 0, 5),
      "This is a warning",
      vscode.DiagnosticSeverity.Warning
    );
    const error = new vscode.Diagnostic(
      new vscode.Range(1, 0, 1, 5),
      "This is an error",
      vscode.DiagnosticSeverity.Error
    );

    const changed = new Promise<void>((resolve) => {
      const sub = collector.onDidChangeErrors(() => {
        sub.dispose();
        resolve();
      });
    });

    diagnosticCollection.set(doc.uri, [warning, error]);
    await changed;

    const errors = collector.getErrors(doc.uri);
    assert.strictEqual(errors.length, 1);
    assert.strictEqual(errors[0].message, "This is an error");
  });

  test("should dedupe errors on the same line", async () => {
    const doc = await vscode.workspace.openTextDocument({
      content: "line0\nline1\n",
      language: "plaintext",
    });
    await vscode.window.showTextDocument(doc);

    const diag1 = new vscode.Diagnostic(
      new vscode.Range(0, 0, 0, 3),
      "Error A",
      vscode.DiagnosticSeverity.Error
    );
    const diag2 = new vscode.Diagnostic(
      new vscode.Range(0, 2, 0, 5),
      "Error B",
      vscode.DiagnosticSeverity.Error
    );

    const changed = new Promise<void>((resolve) => {
      const sub = collector.onDidChangeErrors(() => {
        sub.dispose();
        resolve();
      });
    });

    diagnosticCollection.set(doc.uri, [diag1, diag2]);
    await changed;

    const errors = collector.getErrors(doc.uri);
    assert.strictEqual(errors.length, 1, "Should dedupe errors on the same line");
    assert.strictEqual(errors[0].message, "Error A");
  });

  test("should sort errors by line number", async () => {
    const doc = await vscode.workspace.openTextDocument({
      content: "line0\nline1\nline2\n",
      language: "plaintext",
    });
    await vscode.window.showTextDocument(doc);

    const diag1 = new vscode.Diagnostic(
      new vscode.Range(2, 0, 2, 5),
      "Error on line 3",
      vscode.DiagnosticSeverity.Error
    );
    const diag2 = new vscode.Diagnostic(
      new vscode.Range(0, 0, 0, 5),
      "Error on line 1",
      vscode.DiagnosticSeverity.Error
    );

    const changed = new Promise<void>((resolve) => {
      const sub = collector.onDidChangeErrors(() => {
        sub.dispose();
        resolve();
      });
    });

    diagnosticCollection.set(doc.uri, [diag1, diag2]);
    await changed;

    const errors = collector.getErrors(doc.uri);
    assert.strictEqual(errors.length, 2);
    assert.strictEqual(errors[0].line, 0, "First error should be line 0");
    assert.strictEqual(errors[1].line, 2, "Second error should be line 2");
  });

  test("getErrorLines should return line numbers", async () => {
    const doc = await vscode.workspace.openTextDocument({
      content: "line0\nline1\nline2\n",
      language: "plaintext",
    });
    await vscode.window.showTextDocument(doc);

    const diag = new vscode.Diagnostic(
      new vscode.Range(1, 0, 1, 5),
      "Error",
      vscode.DiagnosticSeverity.Error
    );

    const changed = new Promise<void>((resolve) => {
      const sub = collector.onDidChangeErrors(() => {
        sub.dispose();
        resolve();
      });
    });

    diagnosticCollection.set(doc.uri, [diag]);
    await changed;

    const lines = collector.getErrorLines(doc.uri);
    assert.deepStrictEqual(lines, [1]);
  });
});
